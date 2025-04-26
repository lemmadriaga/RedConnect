import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, map } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';

export interface Post {
  id?: string;
  userId: string;
  content: string;
  timestamp: Date;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  approved: boolean;
  likes: string[];
  dislikes: string[];
  imageUrl?: string;
}

export interface Comment {
  id?: string;
  postId: string;
  userId: string;
  content: string;
  timestamp: Date;
  authorName: string;
  authorAvatar?: string;
  parentCommentId?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  constructor(
    private firestore: AngularFirestore,
    private authService: AuthenticationService,
    private storage: AngularFireStorage
  ) {}

  async createPost(
    content: string,
    userData: any,
    imageUrl: string | null = null
  ): Promise<void> {
    const profilePictureUrl = await this.getProfilePictureUrl(userData.uid);
    const post: Post = {
      userId: userData.uid,
      content,
      timestamp: new Date(),
      authorName: userData.fullName,
      authorRole: userData.role,
      authorAvatar: profilePictureUrl || './assets/profile-placeholder.jpg',
      approved: userData.role === 'faculty',
      likes: [],
      dislikes: [],
      ...(imageUrl && { imageUrl }),
    };

    try {
      await this.firestore.collection('posts').add(post);
      console.log('Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  getPosts(): Observable<Post[]> {
    return this.firestore
      .collection('posts', (ref) => ref.orderBy('timestamp', 'desc'))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Post;
            const id = a.payload.doc.id;
            return { ...data, id };
          })
        ),
        map((posts) => posts.filter((post) => post.approved))
      );
  }

  getPostsForApproval(): Observable<Post[]> {
    return this.firestore
      .collection('posts', (ref) =>
        ref.where('approved', '==', false).orderBy('timestamp', 'desc')
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Post;
            const id = a.payload.doc.id;
            return { ...data, id };
          })
        )
      );
  }

  approvePost(postId: string): Promise<void> {
    return this.firestore.collection('posts').doc(postId).update({
      approved: true,
    });
  }

  deletePost(postId: string): Promise<void> {
    return this.firestore.collection('posts').doc(postId).delete();
  }

  async addComment(
    postId: string,
    content: string,
    userData: any,
    parentCommentId: string | null = null
  ): Promise<void> {
    const profilePictureUrl = await this.getProfilePictureUrl(userData.uid);
    const comment: Comment = {
      postId,
      userId: userData.uid,
      content,
      timestamp: new Date(),
      authorName: userData.fullName,
      authorAvatar: profilePictureUrl,
      parentCommentId,
    };

    try {
      await this.firestore.collection('comments').add(comment);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  getComments(postId: string): Observable<Comment[]> {
    return this.firestore
      .collection('comments', (ref) =>
        ref.where('postId', '==', postId).orderBy('timestamp', 'asc')
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Comment;
            const id = a.payload.doc.id;
            return { ...data, id };
          })
        )
      );
  }

  async toggleLike(postId: string, userId: string): Promise<void> {
    try {
      const doc = await this.firestore
        .collection('posts')
        .doc(postId)
        .get()
        .toPromise();
      if (!doc) throw new Error('Post not found');

      const post = doc.data() as Post;
      const likes = post.likes || [];
      const dislikes = post.dislikes || [];

      if (likes.includes(userId)) {
        likes.splice(likes.indexOf(userId), 1);
      } else {
        likes.push(userId);
        if (dislikes.includes(userId)) {
          dislikes.splice(dislikes.indexOf(userId), 1);
        }
      }

      await doc.ref.update({ likes, dislikes });
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  async toggleDislike(postId: string, userId: string): Promise<void> {
    try {
      const doc = await this.firestore
        .collection('posts')
        .doc(postId)
        .get()
        .toPromise();
      if (!doc) throw new Error('Post not found');

      const post = doc.data() as Post;
      const likes = post.likes || [];
      const dislikes = post.dislikes || [];

      if (dislikes.includes(userId)) {
        dislikes.splice(dislikes.indexOf(userId), 1);
      } else {
        dislikes.push(userId);
        if (likes.includes(userId)) {
          likes.splice(likes.indexOf(userId), 1);
        }
      }

      await doc.ref.update({ likes, dislikes });
    } catch (error) {
      console.error('Error toggling dislike:', error);
      throw error;
    }
  }

  private async getProfilePictureUrl(userId: string): Promise<string | null> {
    const filePath = `profile_pictures/${userId}`;
    const fileRef = this.storage.ref(filePath);
    try {
      return await fileRef.getDownloadURL().toPromise();
    } catch (error) {
      console.error('Error retrieving profile picture URL:', error);
      return null;
    }
  }
}
