// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
// import { Observable, throwError } from 'rxjs';
// import { catchError, map } from 'rxjs/operators';
// import { UserHistoryResponseModel } from '../model/chat_history_response.model';
// import { environment } from '../environments/environment';

// @Injectable({
//   providedIn: 'root',
// })

// export class ChatHistoryService 
// {
//   private apiUrl = environment.backendApiUrl;
  
//   private apiKey = environment.apiKey;

//   constructor(private http: HttpClient) {}

//   public loadChatHistory(
//     userId: string,
//     offset: number = 0,
//     limit: number = 100
//   ): Observable<UserHistoryResponseModel> 
//   {
    
//     let headers = new HttpHeaders({
//       'X-API-Key': this.apiKey 
//     });

//     // const accessToken = localStorage.getItem('access_token');
//     // console.log('[ChatHistoryService] Access token:', localStorage.getItem('access_token'));

//     // if (accessToken) {
//     //   headers = headers.set('Authorization', `Bearer ${accessToken}`);
//     // }

//     const params = new HttpParams()
//       .set('offset', offset.toString()) 
//       .set('limit', limit.toString()); 

//     const url = `${this.apiUrl}/history/${userId}`;

//     return this.http.get<UserHistoryResponseModel>(url, { headers: headers, params: params })
//       .pipe(
//         catchError(this.handleError)
//       );
//   }

//   public loadChatHistoryByRoomId(
//     roomId: string,
//     offset: number = 0,
//     limit: number = 100
//   ): Observable<UserHistoryResponseModel> 
//   {
    
//     let headers = new HttpHeaders({
//       'X-API-Key': this.apiKey 
//     });

//     const params = new HttpParams()
//       .set('offset', offset.toString())
//       .set('limit', limit.toString());

//     const url = `${this.apiUrl}/history/room/${roomId}`;

//     return this.http.get<UserHistoryResponseModel>(url, { headers: headers, params: params })
//       .pipe(
        
//         catchError(this.handleError)
//       );
//   }

//    /**
//    * Metode penanganan error untuk permintaan HTTP.
//    * @param error Objek HttpErrorResponse.
//    * @returns Observable yang memancarkan error.
//    */
//   private handleError(error: HttpErrorResponse) {
//     let errorMessage = 'An unknown error occurred!';
//     if (error.error instanceof ErrorEvent) {
      
//       errorMessage = `Error: ${error.error.message}`;
//     } else {
      
//       errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
//       if (error.error && typeof error.error === 'object' && error.error.detail) {
//          errorMessage += `\nDetail: ${error.error.detail}`;
//       } else if (error.error && typeof error.error === 'string') {
//          errorMessage += `\nServer Response: ${error.error}`;
//       }
//     }
//     console.error(errorMessage); 
//     return throwError(() => new Error(errorMessage)); 
//   }

// }

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
    offset: number = 0,
    limit: number = 100
  ): Observable<UserHistoryResponseModel> {
    const headers = new HttpHeaders({
      'X-API-Key': this.apiKey,
    });

    const params = new HttpParams()
      .set('offset', offset.toString())
      .set('limit', limit.toString());

    const url = `${this.apiUrl}/history/${userId}`;

    return this.http.get<UserHistoryResponseModel>(url, { headers, params }).pipe(
      catchError(this.handleError)
    );
  }

  public loadChatHistoryByRoomId(
    roomId: string,
    offset: number = 0,
    limit: number = 100
  ): Observable<UserHistoryResponseModel> {
    const headers = new HttpHeaders({
      'X-API-Key': this.apiKey,
    });

    const params = new HttpParams()
      .set('offset', offset.toString())
      .set('limit', limit.toString());

    const url = `${this.apiUrl}/history/room/${roomId}`;

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
