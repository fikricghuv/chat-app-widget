import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserHistoryResponseModel } from '../model/chat_history_response.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatHistoryService {
  private apiUrl = environment.backendApiUrl;
  private apiKey = environment.apiKey;

  constructor(private http: HttpClient) {}

  public loadChatHistory(
    userId: string,
    cursor: string | null = null,
    limit: number = 20
  ): Observable<UserHistoryResponseModel> {
    const headers = new HttpHeaders({
      'X-API-Key': this.apiKey,
    });

    let params = new HttpParams().set('limit', limit.toString());
    
    if (cursor) {
      params = params.set('cursor', cursor);
    }

    const url = `${this.apiUrl}/history/${userId}`;

    return this.http.get<UserHistoryResponseModel>(url, { headers, params }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && typeof error.error === 'object' && error.error.detail) {
        errorMessage += `\nDetail: ${error.error.detail}`;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage += `\nServer Response: ${error.error}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
