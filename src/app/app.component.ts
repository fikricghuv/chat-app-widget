// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { RouterModule, Router } from '@angular/router';
// import { SessionService } from './service/session.service';
// import { Subscription } from 'rxjs';
// import { filter } from 'rxjs/operators';
// import { CommonModule } from '@angular/common';
// import { ChatComponent } from './chat/chat.component';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [RouterModule, CommonModule, ChatComponent],
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.scss'],
// })
// export class AppComponent implements OnInit, OnDestroy {
//   public _booleanIsAppInitialized: boolean;
//   public _stringLoadingMessage: string;
//   public _stringErrorMessage: string;
//   private _initializationSubscription: Subscription | undefined;

//   constructor(
//     private sessionService: SessionService,
//     private router: Router
//   ) 
//   {
//     this._booleanIsAppInitialized = false;
//     this._stringLoadingMessage = 'Memuat aplikasi...';
//     this._stringErrorMessage = 'Terjadi kesalahan saat menginisialisasi aplikasi.';
//   }

//   ngOnInit(): void {
//   this._initializationSubscription = this.sessionService.initializationStatus$
//     .pipe(filter(isInitialized => isInitialized)) // hanya jika sudah inisialisasi lengkap
//     .subscribe(() => {
//       this._booleanIsAppInitialized = true;
//       const userId = this.sessionService.getUserId();
//       // const access_token = this.sessionService.getAccessToken();

//       if (userId) {
//         console.log('✅ Inisialisasi lengkap.');
//         console.log('User ID:', userId);
//       } else {
//         console.warn('❗ User ID belum tersedia.');
//       }

//       // if (access_token) {
//       //   console.log('Access Token:', access_token);
//       // } else {
//       //   console.warn('❗ access token belum tersedia.');
//       //   this.sessionService.regenerateAccessToken()
//       // }
//     });
// }


//   ngOnDestroy(): void {
//     if (this._initializationSubscription) {
//       this._initializationSubscription.unsubscribe();
//     }
//   }
// }

import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { SessionService } from './service/session.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, ChatComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public _booleanIsAppInitialized: boolean;
  public _stringLoadingMessage: string;
  public _stringErrorMessage: string;
  private _initializationSubscription: Subscription | undefined;

  constructor(
    private sessionService: SessionService,
    private router: Router
  ) {
    this._booleanIsAppInitialized = false;
    this._stringLoadingMessage = 'Memuat aplikasi...';
    this._stringErrorMessage = 'Terjadi kesalahan saat menginisialisasi aplikasi.';
  }

  ngOnInit(): void {
    this._initializationSubscription = this.sessionService.initializationStatus$
      .pipe(filter(isInitialized => isInitialized)) // hanya jika sudah inisialisasi lengkap
      .subscribe(() => {
        this._booleanIsAppInitialized = true;
        const userId = this.sessionService.getUserId();

        if (userId) {
          console.log('✅ Inisialisasi lengkap.');
          console.log('User ID:', userId);
        } else {
          console.warn('❗ User ID belum tersedia.');
        }
      });
  }

  ngOnDestroy(): void {
    if (this._initializationSubscription) {
      this._initializationSubscription.unsubscribe();
    }
  }
}
