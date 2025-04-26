import { Component, OnInit } from '@angular/core';
import { StatusService } from './status.service';
import { PushNotifications } from '@capacitor/push-notifications';
import { MessagingService } from './messaging.service';
import { FcmService } from './fcm.service';
import { IonicModule, Platform } from '@ionic/angular';

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
    private platform: Platform
  ) {
    this.platform
      .ready()
      .then(() => {
        this.fcm.initPush();
      })
      .catch((e) => {
        console.log('error fcm: ', e);
      });
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
