import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../authentication.service';
import { Observable } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FeedbackService } from 'src/app/feedback.service';
import { ModalController } from '@ionic/angular';
import { FcmService } from 'src/app/fcm.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  userData$: Observable<any>;
  notificationsEnabled = false;

  constructor(
    private authService: AuthenticationService,
    private alertController: AlertController,
    private router: Router,
    private feedbackService: FeedbackService,
    private modalController: ModalController,
    private fcmService: FcmService
  ) {}

  async ngOnInit() {
    this.userData$ = this.authService.getUserData$();
  }

  async uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const userId = await this.authService.getCurrentUserId();
        if (userId) {
          try {
            await this.authService
              .uploadProfilePicture(userId, file)
              .toPromise();
            this.presentAlert(
              'Success',
              'Profile picture updated successfully.'
            );

            this.userData$ = this.authService.getUserData$();
          } catch (error) {
            console.error('Error uploading profile picture:', error);
            this.presentAlert(
              'Error',
              'Failed to update profile picture. Please try again.'
            );
          }
        }
      }
    };
    input.click();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async signOut() {
    const userId = await this.authService.getCurrentUserId();
    if (userId) {
      await this.authService.updateUserStatus(userId, false);
    }

    this.authService
      .logoutUser()
      .then(() => {
        console.log('User signed out successfully and marked offline');
        this.router.navigate(['/authentication']);
      })
      .catch((error) => {
        console.error('Error signing out:', error);
      });
  }

  navigateToForum() {
    this.userData$.subscribe((userData) => {
      if (userData) {
        this.router.navigate(['/forum'], {
          queryParams: {
            userId: userData.uid,
            avatar: userData.profilePictureUrl,
            role: userData.role,
          },
        });
      }
    });
  }

  async openFeedback() {
    this.router.navigate(['/feedback-modal']);
    console.log('Navigated to Feedback page');
  }

  // toggleNotifications() {
  //   if (this.notificationsEnabled) {
  //     this.fcmService.requestPermission();
  //   } else {
  //     console.log('Notifications disabled');
  //   }
  // }
}
