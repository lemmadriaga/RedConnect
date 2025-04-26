import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthenticationService } from './authentication.service';
import { Observable, combineLatest, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import { Timestamp } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import 'firebase/compat/firestore';
import { serverTimestamp } from '@angular/fire/firestore';

interface UserStatus {
  isOnline: boolean;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
}

interface Chat {
  id?: string;
  participants: string[];
  createdAt?: firebase.firestore.Timestamp;
  otherParticipant?: {
    uid: string;
    fullName?: string;
    profilePictureUrl?: string;
  };
  lastMessage?: {
    content: string;
    senderId?: string;
    timestamp?: firebase.firestore.Timestamp;
  };
  unreadCount?: number;
}

interface User {
  uid: string;
  fullName: string;
  role: string;
  profilePictureUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(
    private firestore: AngularFirestore,
    private authService: AuthenticationService
  ) {}

  private lastMessagesSubject = new BehaviorSubject<{
    [chatId: string]: string;
  }>({});

  updateLastMessage(chatId: string, message: string) {
    const currentMessages = this.lastMessagesSubject.value;
    this.lastMessagesSubject.next({
      ...currentMessages,
      [chatId]: message,
    });
  }

  getLastMessages(): Observable<{ [chatId: string]: string }> {
    return this.lastMessagesSubject.asObservable();
  }

  getMessages(chatId: string): Observable<any[]> {
    return this.firestore
      .collection(`chats/${chatId}/messages`, (ref) => ref.orderBy('timestamp'))
      .valueChanges({ idField: 'id' });
  }

  getChatMessages(chatId: string): Observable<Message[]> {
    return this.firestore
      .collection<Message>(`chats/${chatId}/messages`, (ref) =>
        ref.orderBy('timestamp', 'asc')
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        switchMap((messages) => {
          const userIds = [...new Set(messages.map((m) => m.senderId))];
          return combineLatest([
            of(messages),
            ...userIds.map((id) =>
              this.firestore.doc(`users/${id}`).valueChanges()
            ),
          ]);
        }),
        map(([messages, ...users]) => {
          const userMap = users.reduce((acc, user: any) => {
            if (user && user.uid) {
              acc[user.uid] = user;
            }
            return acc;
          }, {});
          return messages.map((message) => ({
            ...message,
            sender: userMap[message.senderId] || {},
          }));
        }),
        catchError((error) => {
          console.error('Error fetching chat messages:', error);
          return of([]);
        })
      );
  }

  sendMessage(chatId: string, content: string): Observable<any> {
    return from(this.authService.getCurrentUserId()).pipe(
      switchMap((userId) => {
        if (!userId) throw new Error('User not authenticated');
        const message = {
          content,
          senderId: userId,
          timestamp: serverTimestamp(),
        };

        return from(
          this.firestore.collection(`chats/${chatId}/messages`).add(message)
        ).pipe(
          switchMap(() =>
            this.firestore
              .collection('chats')
              .doc(chatId)
              .update({ lastMessage: message })
          )
        );
      }),
      catchError((error) => {
        console.error('Error sending message:', error);
        return of(null);
      })
    );
  }

  getOtherUser(chatId: string): Observable<any> {
    return combineLatest([
      this.firestore.doc(`chats/${chatId}`).valueChanges(),
      from(this.authService.getCurrentUserId()),
    ]).pipe(
      switchMap(([chat, currentUserId]: [any, string | null]) => {
        if (!currentUserId) throw new Error('User not authenticated');
        const otherUserId = chat.participants.find(
          (id) => id !== currentUserId
        );

        if (!otherUserId) return of({ fullName: 'User', isOnline: false });

        const userDoc$ = this.firestore
          .doc<User>(`users/${otherUserId}`)
          .valueChanges();
        const statusDoc$ = this.firestore
          .doc<UserStatus>(`userStatus/${otherUserId}`)
          .valueChanges();

        return combineLatest([userDoc$, statusDoc$]).pipe(
          map(([user, status]) => ({
            uid: otherUserId,
            fullName: user?.fullName || 'User',
            profilePictureUrl:
              user?.profilePictureUrl || './assets/profile-placeholder.jpg',
            isOnline: status?.isOnline || false,
          }))
        );
      }),
      catchError((error) => {
        console.error('Error loading other user:', error);
        return of({ fullName: 'User', isOnline: false });
      })
    );
  }

  getRecentChats(): Observable<Chat[]> {
    return this.authService.getUserData$().pipe(
      switchMap((profile) => {
        const userId = profile?.uid;
        if (!userId) {
          console.error('User ID not found');
          throw new Error('User ID not found');
        }

        const query = (ref) =>
          ref.where('participants', 'array-contains', userId);

        return this.firestore
          .collection<Chat>('chats', query)
          .valueChanges({ idField: 'id' })
          .pipe(
            switchMap((chats) => {
              const userObservables = chats.map((chat) => {
                const otherUserId = chat.participants.find(
                  (id) => id !== userId
                );

                if (otherUserId) {
                  console.log(
                    'Fetching user document:',
                    `users/${otherUserId}`
                  );

                  return this.firestore
                    .doc<User>(`users/${otherUserId}`)
                    .valueChanges()
                    .pipe(
                      map((otherUser) => {
                        console.log('Fetched user data:', otherUser);
                        return {
                          ...chat,
                          otherParticipant: {
                            uid: otherUserId,
                            fullName: otherUser?.fullName || 'Unknown User',
                            profilePictureUrl:
                              otherUser?.profilePictureUrl &&
                              otherUser.profilePictureUrl.trim() !== ''
                                ? otherUser.profilePictureUrl
                                : './assets/profile-placeholder.jpg',
                          },
                          lastMessage: chat.lastMessage || {
                            content: 'No messages yet',
                          },
                        };
                      })
                    );
                }

                return of({
                  ...chat,
                  otherParticipant: {
                    uid: '',
                    fullName: 'Unknown User',
                    profilePictureUrl: './assets/profile-placeholder.jpg',
                  },
                  lastMessage: chat.lastMessage || {
                    content: 'No messages yet',
                  },
                });
              });

              return combineLatest(userObservables);
            }),
            map((chats) => {
              console.log('Final processed chats:', chats);
              return chats;
            }),
            catchError((error) => {
              console.error('Error fetching recent chats:', error);
              return of([]);
            })
          );
      })
    );
  }

  getActiveUsers(): Observable<any[]> {
    const activeUsersQuery = this.firestore.collection('userStatus', (ref) =>
      ref.where('isOnline', '==', true)
    );

    return combineLatest([
      activeUsersQuery.valueChanges({ idField: 'id' }),
      this.firestore.collection('users').valueChanges({ idField: 'id' }),
    ]).pipe(
      map(([activeStatuses, users]) => {
        return users.filter((user) =>
          activeStatuses.some((status) => status.id === user.id)
        );
      })
    );
  }

  async createOrGetChat(userId: string): Promise<string | null> {
    console.log('Creating or getting chat with userId:', userId);

    try {
      const currentUserId = await this.authService.getCurrentUserId();
      if (!currentUserId) {
        console.error('User is not authenticated');
        return null;
      }

      const participants = [currentUserId, userId].sort();
      console.log('Participants:', participants);

      const chatQuery = this.firestore.collection('chats', (ref) =>
        ref.where('participants', '==', participants)
      );

      const chatDoc = await chatQuery.get().toPromise();
      if (!chatDoc.empty) {
        console.log('Existing chat found with ID:', chatDoc.docs[0].id);
        return chatDoc.docs[0].id;
      } else {
        console.log('No existing chat, creating a new one');

        const newChat = await this.firestore.collection('chats').add({
          participants: participants,
        });

        await this.firestore.collection('chats').doc(newChat.id).update({
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        console.log('New chat created with ID:', newChat.id);
        return newChat.id;
      }
    } catch (error) {
      console.error('Error executing Firestore query or creating chat:', error);
      return null;
    }
  }

  async testCreateChatDocument() {
    try {
      const testChat = await this.firestore.collection('chats').add({
        participants: ['testUserId1', 'testUserId2'],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log('Test chat created with ID:', testChat.id);
    } catch (error) {
      console.error('Error creating test chat document:', error);
    }
  }

  getUserNameById(id: string): Observable<string> {
    return this.firestore
      .doc(`users/${id}`)
      .valueChanges()
      .pipe(
        map((user: any) => user?.name || `User #${id}`),
        catchError(() => of(`User #${id}`))
      );
  }

  updateUserStatus(userId: string, isOnline: boolean) {
    return this.firestore
      .collection('userStatus')
      .doc(userId)
      .set({ isOnline }, { merge: true });
  }
}
