import { Component, OnInit } from '@angular/core';
import { StatusService } from './status.service';
import { PushNotifications } from '@capacitor/push-notifications';
import { MessagingService } from './messaging.service';
import { FcmService } from './fcm.service';
import { IonicModule, Platform } from '@ionic/angular';
import { DarkModeService } from './services/dark-mode.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private statusService: StatusService,
    private messagingService: MessagingService,
    private fcm: FcmService,
    private platform: Platform,
    private darkModeService: DarkModeService
  ) {
    this.darkModeService.getDarkModeStatus().subscribe((isDarkMode) => {
      this.applyDarkMode(isDarkMode);
    });
    this.platform
      .ready()
      .then(() => {
        this.fcm.initPush();
      })
      .catch((e) => {
        console.log('error fcm: ', e);
      });
  }
  private applyDarkMode(isDarkMode: boolean) {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
  async ngOnInit() {
    await PushNotifications.requestPermissions();
    PushNotifications.register();
    this.messagingService.requestPermission();
    this.messagingService.listenForMessages();

    PushNotifications.addListener('registration', (token) => {
      console.log('FCM Token:', token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });
  }
}
