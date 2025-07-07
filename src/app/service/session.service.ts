// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
// import { BehaviorSubject, firstValueFrom, Observable, throwError } from 'rxjs';
// import { catchError, tap } from 'rxjs/operators';

// import { environment } from '../environments/environment';

// export enum UserRole {
//   User = 'user'
// }

// export interface GenerateUserIdRequestModel {
//   role: UserRole;
// }

// export interface UserIdResponseModel {
//   user_id: string;
//   role: UserRole;
//   created_at: string;
// }

// export interface TokenResponse {
//   access_token: string;
//   refresh_token: string;
//   expires_in: number; 
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class SessionService {
//   private readonly USERID_LOCAL_STORAGE = 'userId';
//   private readonly ACCESS_TOKEN_LOCAL_STORAGE = 'access_token'

//   private apiKey = environment.apiKey;

//   public initializationStatusSubject = new BehaviorSubject<boolean>(false);
//   readonly initializationStatus$ = this.initializationStatusSubject.asObservable();
  
//   constructor(private http: HttpClient) {
//     this.initializeUserId(); 
//   }

//   private async initializeUserId(): Promise<void> { 
//     const storedUserId = localStorage.getItem(this.USERID_LOCAL_STORAGE);

//     if (storedUserId) { 
//       console.log('SessionService: User ID ditemukan di local storage.');
//       this.initializationStatusSubject.next(true);
//       return;
//     }

//     console.log('SessionService: User ID tidak ditemukan, melakukan generate dari server.');

//     let headers = new HttpHeaders({
//       'X-API-Key': this.apiKey,
//       'Content-Type': 'application/json'
//     });

//     const generateUrl = `${environment.backendApiUrl}/auth/generate_user_id`;

//     try {

//       console.log('SessionService: Generating User ID...');
//       const userPayload: GenerateUserIdRequestModel = { role: UserRole.User };
//       const userResponse = await firstValueFrom(
//         this.http.post<UserIdResponseModel>(generateUrl, userPayload, { headers: headers })
//           .pipe(
//              catchError(this.handleError)
//           )
//       );
//       localStorage.setItem(this.USERID_LOCAL_STORAGE, userResponse.user_id);
//       console.log('SessionService: User ID berhasil digenerate dan disimpan:', userResponse.user_id);

//       await this.generateToken(userResponse.user_id);

//       this.initializationStatusSubject.next(true);
//       console.log('SessionService: Inisialisasi User ID selesai.');

//     } catch (error) {
//       console.error('SessionService: Gagal mendapatkan User ID dari server:', error);
//       this.initializationStatusSubject.next(false);
//     }
//   }

//   /**
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
//     console.error('SessionService HTTP Error:', errorMessage);
//     return throwError(() => new Error(errorMessage));
//   }

//   /**
//    * Mendapatkan User ID dari local storage.
//    * @returns User ID atau null jika tidak ada.
//    */
//   public getUserId(): string | null {
//     return localStorage.getItem(this.USERID_LOCAL_STORAGE);
//   }

//   public getAccessToken(): string | null {
//     return localStorage.getItem(this.ACCESS_TOKEN_LOCAL_STORAGE);
//   }

//   public clearSession(): void {
//     console.log('SessionService: Clearing session...');
//     // localStorage.removeItem(this.USERID_LOCAL_STORAGE);

    
//     this.initializationStatusSubject.next(false);
//     // this.initializeUserId(); 
//     console.log('SessionService: Session cleared and re-initialization started.');
//   }

//   private async generateToken(userId: string): Promise<void> {
//     const url = `${environment.backendApiUrl}/auth/generate_token`;
//     let headers = new HttpHeaders({
//       'X-API-Key': this.apiKey,
//       'Content-Type': 'application/json'
//     });

//     try {
//       const tokenResponse = await firstValueFrom(
//         this.http.post<TokenResponse>(
//           url,
//           { user_id: userId },
//           { headers }
//         ).pipe(
//           catchError(this.handleError)
//         )
//       );

//       localStorage.setItem('access_token', tokenResponse.access_token);
//       localStorage.setItem('refresh_token', tokenResponse.refresh_token);
//       const expireTimestamp = Date.now() + tokenResponse.expires_in * 1000;
//       localStorage.setItem('access_token_expires_at', expireTimestamp.toString());

//       console.log('[SessionService] Token berhasil di-generate dan disimpan.');
//     } catch (err) {
//       console.error('[SessionService] Gagal generate token:', err);
//       throw err;
//     }
//   }

//   public async regenerateAccessToken(): Promise<void> {
//     const userId = this.getUserId();
//     if (!userId) {
//       throw new Error('[SessionService] Tidak ada user_id untuk refresh token.');
//     }
//     return this.generateToken(userId);
//   }

//   public isAccessTokenExpired(): boolean {
//     const expiresAt = localStorage.getItem('access_token_expires_at');
//     if (!expiresAt) return true;

//     const now = Date.now();
//     return now >= parseInt(expiresAt, 10);
//   }

// }

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../environments/environment';

export enum UserRole {
  User = 'user'
}

export interface GenerateUserIdRequestModel {
  role: UserRole;
}

export interface UserIdResponseModel {
  user_id: string;
  role: UserRole;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly USERID_LOCAL_STORAGE = 'userId';
  private apiKey = environment.apiKey;

  public initializationStatusSubject = new BehaviorSubject<boolean>(false);
  readonly initializationStatus$ = this.initializationStatusSubject.asObservable();
  
  constructor(private http: HttpClient) {
    this.initializeUserId(); 
  }

  private async initializeUserId(): Promise<void> { 
    const storedUserId = localStorage.getItem(this.USERID_LOCAL_STORAGE);

    if (storedUserId) { 
      console.log('SessionService: User ID ditemukan di local storage.');
      this.initializationStatusSubject.next(true);
      return;
    }

    console.log('SessionService: User ID tidak ditemukan, melakukan generate dari server.');

    let headers = new HttpHeaders({
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    });

    const generateUrl = `${environment.backendApiUrl}/auth/generate_user_id`;

    try {
      console.log('SessionService: Generating User ID...');
      const userPayload: GenerateUserIdRequestModel = { role: UserRole.User };
      const userResponse = await firstValueFrom(
        this.http.post<UserIdResponseModel>(generateUrl, userPayload, { headers: headers })
          .pipe(
             catchError(this.handleError)
          )
      );
      localStorage.setItem(this.USERID_LOCAL_STORAGE, userResponse.user_id);
      console.log('SessionService: User ID berhasil digenerate dan disimpan:', userResponse.user_id);

      this.initializationStatusSubject.next(true);
      console.log('SessionService: Inisialisasi User ID selesai.');

    } catch (error) {
      console.error('SessionService: Gagal mendapatkan User ID dari server:', error);
      this.initializationStatusSubject.next(false);
    }
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
    console.error('SessionService HTTP Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  public getUserId(): string | null {
    return localStorage.getItem(this.USERID_LOCAL_STORAGE);
  }

  public clearSession(): void {
    console.log('SessionService: Clearing session...');
    // localStorage.removeItem(this.USERID_LOCAL_STORAGE);
    this.initializationStatusSubject.next(false);
    // this.initializeUserId(); 
    console.log('SessionService: Session cleared.');
  }
}
