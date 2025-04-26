import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private firestore: AngularFirestore) {}

  getTotalUsers(): Observable<number> {
    return this.firestore
      .collection('users')
      .valueChanges()
      .pipe(map((users) => users.length));
  }

  getUsersByMonth(): Observable<any[]> {
    return this.firestore
      .collection('users', (ref) => ref.orderBy('createdAt', 'asc'))
      .valueChanges()
      .pipe(
        map((users) => {
          return this.processUsersByMonth(users);
        })
      );
  }

  getUsersByDepartment(): Observable<any[]> {
    return this.firestore
      .collection('users')
      .valueChanges()
      .pipe(
        map((users) => {
          return this.processUsersByDepartment(users);
        })
      );
  }

  private processUsersByMonth(users: any[]): any[] {
    return [];
  }

  private processUsersByDepartment(users: any[]): any[] {
    return [];
  }

  getPendingPosts(): Observable<any[]> {
    return this.firestore
      .collection('posts', (ref) =>
        ref.where('approved', '==', false).orderBy('timestamp', 'desc')
      )
      .valueChanges();
  }

  approvePost(postId: string): Promise<void> {
    return this.firestore
      .collection('posts')
      .doc(postId)
      .update({ approved: true });
  }

  declinePost(postId: string): Promise<void> {
    return this.firestore.collection('posts').doc(postId).delete();
  }
}
