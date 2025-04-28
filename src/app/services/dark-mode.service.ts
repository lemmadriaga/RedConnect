import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthenticationService } from '../authentication.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DarkModeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private authService: AuthenticationService,
    private firestore: AngularFirestore
  ) {}

  getUserDarkMode() {
    this.authService.getCurrentUserId().then((userId) => {
      if (userId) {
        this.firestore
          .collection('users')
          .doc(userId)
          .valueChanges()
          .subscribe((user: any) => {
            this.darkModeSubject.next(user?.darkMode || false);
            this.applyDarkMode(user?.darkMode || false);
          });
      }
    });
  }

  setUserDarkMode(isDarkMode: boolean) {
    this.authService.getCurrentUserId().then((userId) => {
      if (userId) {
        this.firestore
          .collection('users')
          .doc(userId)
          .update({ darkMode: isDarkMode });

        this.applyDarkMode(isDarkMode);
      }
    });
  }

  private applyDarkMode(isDarkMode: boolean) {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  getDarkModeStatus() {
    return this.darkModeSubject.asObservable();
  }
}
