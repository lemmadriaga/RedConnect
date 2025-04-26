import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AuthenticationService } from './authentication.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthenticationService
  ) {}

  async createReport(report: { title: string; description: string }, file: File) {
    const currentUser = await this.authService.getCurrentUserId();

    
    const userDoc = await this.firestore.collection('users').doc(currentUser).get().toPromise();
    const userData = userDoc.data();

    const reportData = {
      ...report,
      userId: currentUser,
      userName: userData ? userData['fullName'] : 'Anonymous', 
      createdAt: new Date(),
      solved: false,
    };

    const reportRef = await this.firestore.collection('reports').add(reportData);
    if (file) {
      const filePath = `reports/${reportRef.id}/${file.name}`;
      const fileRef = this.storage.ref(filePath);
      await this.storage.upload(filePath, file);

      const downloadURL = await fileRef.getDownloadURL().toPromise();
      await reportRef.update({ imageUrl: downloadURL });
    }
  }

  getReports() {
    return this.firestore
      .collection('reports', (ref) => ref.orderBy('createdAt', 'desc'))
      .snapshotChanges()
      .pipe(
        map((actions) => actions.map((a) => {
          const data = a.payload.doc.data() as any;
          const id = a.payload.doc.id;
          if (data.createdAt && data.createdAt.toDate) {
            data.createdAt = data.createdAt.toDate();
          }
          return { id, ...data };
        }))
      );
  }

  markReportAsSolved(reportId: string) {
    return this.firestore.collection('reports').doc(reportId).update({ solved: true });
  }

  notifyUserSolved(reportId: string) {
    return this.firestore
      .collection('reports')
      .doc(reportId)
      .update({ userNotified: true });
  }

  
  
}
