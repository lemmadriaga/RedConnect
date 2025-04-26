import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import firebase from 'firebase/compat/app';
import { from, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import 'firebase/compat/auth';
import { PushNotifications } from '@capacitor/push-notifications';

interface UserData {
  uid: string;
  email: string;
  fullName: string;
  contact: string;
  role: string;
  profilePictureUrl?: string;
  department?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage
  ) {}

  async saveFCMToken(userId: string) {
    PushNotifications.register();

    PushNotifications.addListener('registration', async (tokenData) => {
      const fcmToken = tokenData.value;

      await this.firestore.collection('users').doc(userId).update({
        fcmToken: fcmToken,
      });
    });
  }

  // registerUser(
  //   email: string,
  //   password: string,
  //   fullName: string,
  //   contact: string,
  //   department: string
  // ): Promise<any> {
  //   return this.afAuth
  //     .createUserWithEmailAndPassword(email, password)
  //     .then((userCredential) => {
  //       const user = userCredential.user;
  //       if (user) {
  //         const userData = {
  //           uid: user.uid,
  //           email,
  //           fullName,
  //           contact,
  //           role: 'student',
  //           department,
  //           createdAt: new Date()
  //         };

  //         return this.firestore
  //           .collection('users')
  //           .doc(user.uid)
  //           .set(userData)
  //           .then(() => {
  //             return this.firestore
  //               .collection('userStatus')
  //               .doc(user.uid)
  //               .set({
  //                 uid: user.uid,
  //                 online: false,
  //                 lastActive: new Date(),
  //               })
  //               .then(async () => {
  //                 await this.saveFCMToken(user.uid);
  //                 return userData;
  //               });
  //           });
  //       } else {
  //         throw new Error('User creation failed');
  //       }
  //     })
  //     .catch((error) => {
  //       console.error('Error during registration:', error);
  //       throw error;
  //     });
  // }
  registerUser(
    email: string,
    password: string,
    fullName: string,
    contact: string,
    department: string
  ): Promise<any> {
    return this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if (user) {
          const userData = {
            uid: user.uid,
            email,
            fullName,
            contact,
            role: 'student',
            department,
          
          };

          return this.firestore
            .collection('users')
            .doc(user.uid)
            .set(
              {
                ...userData,
                createdAt: new Date(),
              },
              { merge: true }
            )
            .then(() => {
              return this.firestore.collection('userStatus').doc(user.uid).set({
                uid: user.uid,
                online: false,
                lastActive: new Date(),
              });
            })
            .then(async () => {
              await this.saveFCMToken(user.uid);
              return userData;
            });
        } else {
          throw new Error('User creation failed');
        }
      })
      .catch((error) => {
        console.error('Error during registration:', error);
        throw error;
      });
  }

  loginUser(
    email: string,
    password: string
  ): Promise<firebase.auth.UserCredential> {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        if (user && user.emailVerified) {
          await this.updateUserStatus(user.uid, true);
          await this.saveFCMToken(user.uid);
          return userCredential;
        } else {
          throw new Error('Please verify your email before logging in.');
        }
      });
  }

  updateUserStatus(userId: string, online: boolean): Promise<void> {
    return this.firestore.collection('userStatus').doc(userId).set(
      {
        uid: userId,
        isOnline: online,
        lastActive: new Date(),
      },
      { merge: true }
    );
  }

  googleSignIn(): Promise<firebase.auth.UserCredential> {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.afAuth.signInWithPopup(provider);
  }

  getUserRole$(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore
            .collection('users')
            .doc(user.uid)
            .get()
            .pipe(
              map((doc) => {
                const data = doc.data() as UserData;
                return data ? data.role : null;
              })
            );
        } else {
          return from([null]);
        }
      })
    );
  }

  resetPassword(email: string): Promise<void> {
    return this.afAuth.sendPasswordResetEmail(email);
  }

  logoutUser(): Promise<void> {
    return this.afAuth.currentUser.then((user) => {
      if (user) {
        this.updateUserStatus(user.uid, false);
      }
      return this.afAuth.signOut();
    });
  }

  async sendPasswordResetEmail(email: string) {
    return await this.afAuth.sendPasswordResetEmail(email);
  }

  getUserData$(): Observable<any> {
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore
            .doc(`users/${user.uid}`)
            .valueChanges()
            .pipe(
              map((userData) => {
                return userData;
              })
            );
        } else {
          console.warn('No authenticated user');
          return of(null);
        }
      })
    );
  }

  uploadProfilePicture(userId: string, file: File): Observable<string> {
    const filePath = `profile_pictures/${userId}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    return from(task).pipe(
      switchMap(() => fileRef.getDownloadURL()),
      tap((url) => {
        this.firestore.collection('users').doc(userId).update({
          profilePictureUrl: url,
        });
      })
    );
  }

  async getCurrentUserId(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.uid : null;
  }

  getTotalUserCount(): Observable<number> {
    return this.firestore
      .collection('users')
      .get()
      .pipe(map((snapshot) => snapshot.size));
  }

  updateUserProfile(
    userId: string,
    profileData: Partial<UserData>
  ): Promise<void> {
    return this.firestore.collection('users').doc(userId).update(profileData);
  }

  getUserDepartmentCounts(): Observable<{ [department: string]: number }> {
    return this.firestore
      .collection('users')
      .valueChanges()
      .pipe(
        map((users: any[]) => {
          return users.reduce((acc, user) => {
            const department = user.department || 'Unknown';
            acc[department] = (acc[department] || 0) + 1;
            return acc;
          }, {} as { [department: string]: number });
        })
      );
  }

  getUserId(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      switchMap((user) => (user ? of(user.uid) : of(null)))
    );
  }

  getUserName(): Observable<string | null> {
    return this.getUserId().pipe(
      switchMap((userId) => {
        if (userId) {
          return this.firestore
            .collection('users')
            .doc(userId)
            .valueChanges()
            .pipe(map((userData: any) => userData?.fullName ?? null));
        }
        return of(null);
      })
    );
  }

  getUserDepartment(): Observable<string | null> {
    return this.getUserId().pipe(
      switchMap((userId) => {
        if (userId) {
          console.log('User ID in getUserDepartment:', userId);
          return this.firestore
            .collection('users')
            .doc(userId)
            .valueChanges()
            .pipe(
              map((userData: any) => {
                console.log('User data from Firestore:', userData);
                return userData?.department ?? null;
              })
            );
        }
        return of(null);
      })
    );
  }

  async sendVerificationEmail(): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (user) {
      return user.sendEmailVerification();
    } else {
      throw new Error('No user is currently logged in');
    }
  }
  getMonthlyRegistrationCounts(): Observable<number[]> {
    return this.firestore
      .collection('users')
      .valueChanges()
      .pipe(
        map((users: any[]) => {
          const monthlyCounts = Array(12).fill(0); 
          users.forEach((user) => {
            const createdAt = user.createdAt?.toDate(); 
            if (createdAt) {
              const month = createdAt.getMonth(); 
              monthlyCounts[month]++;
            }
          });
          return monthlyCounts;
        })
      );
  }
}
