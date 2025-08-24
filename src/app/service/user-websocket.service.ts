import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })

export class WebSocketService 
{
  private _socket?: WebSocket;
  private _messageSubject = new Subject<any>();
  private _statusSubject = new BehaviorSubject<string>('disconnected'); 
  private _messageQueue: any[] = [];

  private _numberReconnectAttempts: number;
  private _numberMaxReconnectAttempts: number;
  private _reconnectTimeout: any; 

  private _currentId: string = '';
  private _currentRole: string = '';

  readonly status$ = this._statusSubject.asObservable();

  constructor() 
  {
    this._numberReconnectAttempts = 0;
    this._numberMaxReconnectAttempts = 5;
  }

  /**
   * Koneksi ke WebSocket menggunakan ID (user_id atau admin_id) dan role
   * @param id User ID atau Admin ID
   * @param role 'user', 'admin', atau 'chatbot'
   */
  public connect(id: string, role: string): Promise<void> 
  {
    this._currentId = id;
    this._currentRole = role;
    return new Promise((resolve, reject) => 
    {
      if (this._socket && (this._socket.readyState === WebSocket.OPEN || this._socket.readyState === WebSocket.CONNECTING))
        {
          console.log(`ℹ️ WebSocket is already ${this._socket.readyState === WebSocket.OPEN ? 'connected' : 'connecting'}.`);
           this._statusSubject.next(this._socket.readyState === WebSocket.OPEN ? 'connected' : 'connecting');
          resolve(); 

          return;
        }

      const wsUrl = `${environment.websocketUrl}?user_id=${encodeURIComponent(id)}&role=${role}&api_key=${environment.apiKey}`;
      console.log(`Attempting to connect to ${wsUrl}`);

      this._statusSubject.next('connecting');
      this._socket = new WebSocket(wsUrl);

      this._socket.onopen = () => {
        console.log('✅ WebSocket User terhubung');
        this._numberReconnectAttempts = 0;
        this._statusSubject.next('connected');

        if (this._reconnectTimeout) {
          clearTimeout(this._reconnectTimeout);
          this._reconnectTimeout = null;
        }
        this.processQueue(); 
        resolve();
      };

      this._socket.onmessage = (event) => 
      {
        console.log('>>> DEBUG: WebSocket onmessage event fired.', event.data); 
        try 
        {
          const data = JSON.parse(event.data);
          console.log('>>> DEBUG: Parsed data, calling next():', data);
          this._messageSubject.next(data);
        } 
        catch (e) 
        {
          console.error('❌ Gagal parse pesan JSON:', event.data, e);
          
        }
      };

      this._socket.onclose = (event) => 
      {
        console.warn(`⚠️ WebSocket user_id=${encodeURIComponent(id)}&role=${role} ditutup: Code=${event.code}, Reason=${event.reason}, Clean=${event.wasClean}`, event);
        this._statusSubject.next('disconnected'); 
        this._socket = undefined;

        if (!event.wasClean && event.code !== 1000) {
          this.tryReconnect(id, role);
        } 
        else 
        {
           console.log("✅ WebSocket ditutup dengan bersih.");
           this._numberReconnectAttempts = 0; 
        }
      };

      this._socket.onerror = (error) => 
      {
        console.error('❌ WebSocket error:', error);
        this._statusSubject.next('disconnected'); 
        reject(error);
      };
    });
  }

  private tryReconnect(id: string, role: string): void
  {
    if (this._statusSubject.value === 'connected' || this._statusSubject.value === 'connecting') {
         console.log("ℹ️ Already connected or connecting, skipping reconnect attempt.");
         return;
    }
    if (this._numberReconnectAttempts >= this._numberMaxReconnectAttempts)
    {
      console.error('❌ Gagal reconnect setelah beberapa kali percobaan');
      this._statusSubject.next('disconnected'); 
      return;
    }

    this._numberReconnectAttempts++;

    const baseDelay = 1000 * Math.pow(2, this._numberReconnectAttempts);
    const jitter = Math.random() * 1000; 
    const delay = Math.min(baseDelay + jitter, 30000);

    console.log(`🔄 Mencoba reconnect... (${this._numberReconnectAttempts}/${this._numberMaxReconnectAttempts}) dalam ${Math.round(delay / 1000)}s`);
    this._statusSubject.next('connecting'); 

    this._reconnectTimeout = setTimeout(() =>
    {
      this.connect(id, role)
        .then(() => console.log("Reconnect successful!"))
        .catch(err => {
             console.error("Reconnect attempt failed:", err);
        });
    }, delay);
  }

  /**
   * Mengirim pesan melalui WebSocket
   * @param payload Data JSON (sebagai objek atau any) yang akan dikirim
   */
  public sendMessage(payload: any): void
  {
   
    if (typeof payload !== 'object' || payload === null) {
         console.error('❌ Payload pesan harus berupa objek:', payload);
         
         return;
    }

    if (this._socket?.readyState === WebSocket.OPEN)
    {
      
      try {
          this._socket.send(JSON.stringify(payload));
      } catch (e) {
          console.error('❌ Gagal mengirim pesan (stringify error atau lainnya):', payload, e);
          
      }
    }
    else
    {
      console.error('❌ WebSocket belum terhubung! Pesan gagal dikirim:', payload);
      
      this._messageQueue.push(payload);
        
      if (this._currentId && this._currentRole) {
          this.tryReconnect(this._currentId, this._currentRole);
      } else {
            console.error("❌ Gagal reconnect: ID atau Role tidak tersedia.");
      }
    }
  }

  /**
   * Mengirim semua pesan yang tersimpan dalam antrian
   */
  private processQueue(): void 
  {
      if (this._socket?.readyState === WebSocket.OPEN) 
      {
          while (this._messageQueue.length > 0) 
          {
              const payload = this._messageQueue.shift(); // Ambil dan hapus pesan pertama dari antrian
              
              try {
                  this._socket.send(JSON.stringify(payload));
                  console.log('✅ Pesan antrian terkirim:', payload);
              } catch (e) {
                  // Jika masih gagal kirim, kembalikan ke antrian (opsional, tergantung seberapa keras kita ingin mencoba)
                  // this._messageQueue.unshift(payload); 
                  console.error('❌ Gagal mengirim pesan dari antrian:', payload, e);
                  break; // Berhenti memproses antrian jika ada kegagalan kirim
              }
          }
          
          if (this._messageQueue.length === 0) {
              console.log("Antrian pesan berhasil dikosongkan.");
          }
      }
  }

  /**
   * Mendapatkan Observable untuk menerima pesan masuk dari server
   */
  public getMessages(): Observable<any>
  {
    return this._messageSubject.asObservable();
  }

  /**
   * Mendapatkan Observable untuk status koneksi WebSocket
   * Nilai: 'connecting', 'connected', 'disconnected'
   */
  public getStatus(): Observable<string> 
  {
    return this._statusSubject.asObservable();
  }

  /**
   * Menutup koneksi WebSocket
   * @param code Kode penutupan (default 1000 untuk clean close)
   * @param reason Alasan penutupan
   */
  public disconnect(code: number = 1000, reason: string = "Client initiated disconnect"): void
  {
    if (this._socket)
    {
      console.log('⛔ Menutup WebSocket...');
      
      this._socket.close(code, reason);
      
       if (this._reconnectTimeout) {
           clearTimeout(this._reconnectTimeout);
           this._reconnectTimeout = null;
       }
    } else 
    {
       console.log('ℹ️ WebSocket tidak terhubung atau sedang mencoba.');
       
       if (this._reconnectTimeout) 
        {
           clearTimeout(this._reconnectTimeout);
           this._reconnectTimeout = null;
        }
    }
     this._statusSubject.next('disconnected'); 
     this._numberReconnectAttempts = 0; 
  }

  ngOnDestroy(): void 
  {
    console.log('WebSocketService is being destroyed. Disconnecting WebSocket.');
    this.disconnect();
    this._messageSubject.complete(); 
    this._statusSubject.complete();
}

  public getReadyState(): number | undefined 
  {
      return this._socket?.readyState;
  }
}