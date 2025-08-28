// src/app/services/chat-core.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { takeUntil, filter, map, catchError, finalize, take } from 'rxjs/operators';
import { WebSocketService } from './user-websocket.service'; 
import { ChatHistoryService } from './chat-history.service'; 
import { SessionService } from './session.service';           
import { MessageModel } from '../model/message.model'; 
import { UserHistoryResponseModel, ChatHistoryResponseModel } from '../model/chat_history_response.model'; 
import { ServerRole, ENUM_SENDER } from '../constants/enum.constant'; 

@Injectable({
  providedIn: 'root'
})
export class ChatCoreService implements OnDestroy {

  private _userId: string | null = null;
  private destroy$ = new Subject<void>();

  private _incomingMessages = new Subject<MessageModel>();
  public readonly incomingMessages$ = this._incomingMessages.asObservable();

  private _isLoadingSending = new BehaviorSubject<boolean>(false);
  public readonly isLoadingSending$ = this._isLoadingSending.asObservable();

  public readonly wsConnectionStatus$: Observable<string>;

  private _nextCursor: string | null = null;
  private _hasMoreHistory = true;

  constructor(
    private wsService: WebSocketService,
    private historyService: ChatHistoryService,
    private sessionService: SessionService
  ) {
    this.wsConnectionStatus$ = this.wsService.getStatus();
    this.sessionService.initializationStatus$
      .pipe(
        filter(isInitialized => isInitialized === true),
        take(1)
      )
      .subscribe(() => {
        this._userId = this.sessionService.getUserId();

        if (this._userId) {
          this.connectAndSubscribe();
        } else {
          console.error('ChatCoreService: Tidak bisa lanjut, userId belum tersedia.');
        }
      });
  }

  private connectAndSubscribe(): void {
    if (!this._userId) return; 
    this.wsService.connect(this._userId, ServerRole.User)
      .then(() => {
        this.wsService.getMessages()
          .pipe(takeUntil(this.destroy$))
          .subscribe(
            data => this.handleRawWebSocketMessage(data),
            error => console.error('ChatCoreService: WebSocket message stream error:', error)
          );
      })
      .catch(error => console.error('ChatCoreService: WebSocket connection failed:', error));
  }

  sendMessage(text: string): void {
    if (!this._userId) return;
    const payload = { type: 'message', user_id: this._userId, role: ServerRole.User, message: text.trim() };
    this._isLoadingSending.next(true);
    this.wsService.sendMessage(payload);
  }

  get hasMoreHistory(): boolean {
    return this._hasMoreHistory;
  }

  private readFileAsBase64(fileOrBlob: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target && typeof event.target.result === 'string') {
          resolve(event.target.result.split(',')[1]); 
        } else {
          reject('Failed to read file/blob as Base64 string.');
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(fileOrBlob);
    });
  }

  // sendFile(file: File): Promise<void> {
  //   if (!this._userId) return Promise.reject('User ID not set.');
  //   this._isLoadingSending.next(true);

  //   return this.readFileAsBase64(file).then(base64Data => {
  //     const payload = {
  //       type: 'file', user_id: this._userId!, role: ServerRole.User,
  //       file_name: file.name, file_type: file.type, file_size: file.size, file_data: base64Data,
  //     };
  //     this.wsService.sendMessage(payload);
  //   }).catch(err => {
  //     console.error('ChatCoreService Error sending file:', err);
  //     throw err; 
  //   }).finally(() => {
  //     this._isLoadingSending.next(false);
  //   });
  // }

  sendVoiceNote(audioBlob: Blob, fileName: string, mimeType: string, durationSeconds: number): Promise<void> {
    if (!this._userId) return Promise.reject('User ID not set.');
    this._isLoadingSending.next(true);
    return this.readFileAsBase64(audioBlob).then(base64AudioData => {
      const payload = {
        type: 'voice_note', user_id: this._userId!, role: ServerRole.User,
        file_name: fileName, mime_type: mimeType, duration: Math.round(durationSeconds), file_data: base64AudioData,
      };
      this.wsService.sendMessage(payload);
    }).catch(err => {
      console.error('ChatCoreService Error sending voice note:', err);
      throw err; 
    }).finally(() => {
      this._isLoadingSending.next(false);
    });
  }

  private handleRawWebSocketMessage(serverData: any): void {
    let processedMessage: MessageModel | null = null;
    let stopLoading = false;

    const senderId = serverData.from_user_id || (serverData.from === ServerRole.User ? this._userId : undefined);

    let senderEnum: ENUM_SENDER;
    if (serverData.from === ServerRole.User) {
        senderEnum = senderId === this._userId ? ENUM_SENDER.User : ENUM_SENDER.Chatbot; 
    } else if (serverData.from === ServerRole.Admin) {
        senderEnum = ENUM_SENDER.Admin;
    } else if (serverData.from === ServerRole.Chatbot) {
        senderEnum = ENUM_SENDER.Chatbot;
    } else {
        senderEnum = senderId === this._userId ? ENUM_SENDER.User : ENUM_SENDER.Chatbot;
    }

    const normalized = this.normalizeMessage(serverData);
    const messageId = serverData.message_id || `srv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const timestamp = serverData.timestamp || new Date().toISOString();

    if (normalized.text) {
        processedMessage = {
            id: messageId,
            sender: senderEnum,
            time: timestamp,
            message: normalized.text.trim(),
            room_id: serverData.room_id
        };
        stopLoading = true;
    } 
    else if (serverData.message_type === 'voice_note' && serverData.audio_url) {
        processedMessage = {
            id: messageId,
            sender: senderEnum,
            time: timestamp,
            isVoiceNote: true,
            audioUrl: serverData.audio_url,
            fileName: serverData.file_name,
            fileType: serverData.mime_type,
            audioDuration: this.formatDurationFromServer(serverData.duration),
            message: serverData.caption || ''
        };
        stopLoading = true;
    } 
    else if (serverData.message_type === 'file' && serverData.file_url) {
        processedMessage = {
            id: messageId,
            sender: senderEnum,
            time: timestamp,
            fileUrl: serverData.file_url,
            fileName: serverData.file_name,
            fileType: serverData.mime_type,
            message: serverData.caption || ''
        };
        stopLoading = true;
    } 
    else if ((serverData.type === 'error' && serverData.error) || 
         (serverData.success === false && serverData.error)) {
        processedMessage = {
            id:`err-${Date.now()}`,
            sender: ENUM_SENDER.Chatbot,
            message: "Maaf sedang terjadi kesalahan, coba lagi nanti.",
            time: new Date().toISOString()
        };
        stopLoading = true;
    } 
    else if (serverData.type === 'info' && serverData.message) {
        processedMessage = {
            id:`info-${Date.now()}`,
            sender: ENUM_SENDER.Chatbot,
            message: `[INFO] ${serverData.message}`,
            time: new Date().toISOString()
        };
    } 
    else if (["room_message", "chat_history", "active_rooms_update"].includes(serverData.type)) {
        // skip
    } 
    else {
        console.warn('ChatCoreService: Unhandled WS message format:', serverData);
        stopLoading = true;
    }

    if (processedMessage) {
        this._incomingMessages.next(processedMessage);
    }
    if (stopLoading) {
        this._isLoadingSending.next(false);
    }
  }

  /**
   * Normalize semua variasi payload menjadi { text, type }
   */
  private normalizeMessage(serverData: any): { text?: string; type?: string } {
    if (serverData.message && typeof serverData.message === 'string') {
      return { text: serverData.message, type: serverData.type || 'message' };
    }
    return {};
  }

  private formatDurationFromServer(totalSeconds?: number): string | undefined {
    if (totalSeconds === undefined || totalSeconds === null || isNaN(totalSeconds)) return undefined;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  loadHistory(limit: number = 20, cursor: string | null = null): Observable<MessageModel[]> {
    if (!this._userId) return throwError(() => new Error("User ID not set for history load"));

    return this.historyService.loadChatHistory(this._userId, cursor, limit).pipe(
      map((response: UserHistoryResponseModel): MessageModel[] => {
        if (!response?.history?.length) {
          this._hasMoreHistory = false;
          return [];
        }

        this._nextCursor = response.next_cursor;
        this._hasMoreHistory = !!response.next_cursor;

        return this.mapHistoryResponse(response.history);
      }),
      catchError(err => {
        console.error('ChatCoreService: Failed to load/map history:', err);
        return throwError(() => new Error('Failed to load chat history'));
      })
    );
  }


  private mapHistoryResponse(history: ChatHistoryResponseModel[]): MessageModel[] {
    return history
      .sort((a, b) => (new Date(a.created_at).getTime()) - (new Date(b.created_at).getTime()))
      .map((historyItem: ChatHistoryResponseModel): MessageModel | null => {
        let senderType: ENUM_SENDER;
        if (historyItem.role === ServerRole.User) {
          senderType = ENUM_SENDER.User;
        } else if (historyItem.role === ServerRole.Admin || historyItem.role === ServerRole.Chatbot) {
          senderType = ENUM_SENDER.Chatbot;
        } else {
          senderType = ENUM_SENDER.Chatbot;
        }

        return {
          id: historyItem.id || `hist-${historyItem.created_at}`,
          sender: senderType,
          message: historyItem.message,
          time: historyItem.created_at,
          room_id: historyItem.room_conversation_id,
        };
      })
      .filter(msg => msg !== null && msg.message.trim() !== '') as MessageModel[];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.wsService) { 
        this.wsService.disconnect();
    }
    this._incomingMessages.complete();
    this._isLoadingSending.complete();
  }

  loadMoreHistory(limit: number = 20): Observable<MessageModel[]> {
    if (!this._hasMoreHistory || !this._nextCursor) {
      return of([]); 
    }
    return this.loadHistory(limit, this._nextCursor);
  }

}
