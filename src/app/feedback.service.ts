import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthenticationService } from './authentication.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  constructor(
    private firestore: AngularFirestore,
    private authService: AuthenticationService,
    private alertController: AlertController, 
    private router: Router 
  ) {}

  saveFeedback(comment: string, rating: number): Promise<void> {
    return lastValueFrom(
      this.authService.getUserData$().pipe(
        switchMap((user) => {
          const feedbackData = {
            name: user?.fullName || 'Anonymous',
            comment,
            rating,
            createdAt: new Date(),
          };
          return this.firestore.collection('feedback').add(feedbackData);
        })
      )
    )
      .then(() => {
        console.log('Feedback successfully saved in Firestore');
      })
      .catch((error) => {
        console.error('Error saving feedback:', error);
        throw error;
      });
  }
  
  
  

  getFeedbackRatings(): Observable<any[]> {
    return this.firestore
      .collection('feedback', (ref) => ref.orderBy('createdAt', 'desc'))
      .valueChanges();
  }
}
