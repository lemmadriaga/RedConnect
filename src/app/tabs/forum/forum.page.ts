import { Component, OnInit } from '@angular/core';
import { ForumService, Post, Comment } from '../../forum.service';
import { AuthenticationService } from '../../authentication.service';
import { AlertController } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { Timestamp } from 'firebase/firestore';
import { PushNotifications } from '@capacitor/push-notifications';
import { CommentModalComponent } from 'src/app/components/comment-modal/comment-modal.component';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-forum',
  templateUrl: './forum.page.html',
  styleUrls: ['./forum.page.scss'],
})
export class ForumPage implements OnInit {
  posts: Post[] = [];
  userData: any;
  newPostContent: string = '';
  selectedImageUrl: string | null = null;
  selectedImageFile: File | null = null;

  constructor(
    private modalController: ModalController,
    private forumService: ForumService,
    private authService: AuthenticationService,
    private alertController: AlertController,
    private storage: AngularFireStorage
  ) {}

  ngOnInit() {
    this.authService.getUserData$().subscribe((data) => {
      this.userData = data;
    });

    this.forumService.getPosts().subscribe((posts) => {
      this.posts = posts;
    });
    this.listenForNotifications();
  }
  listenForNotifications() {
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('Push notification received:', notification);

        if (notification.data.type === 'chat') {
          alert(
            `New message from ${notification.data.senderName}: ${notification.body}`
          );
        } else if (notification.data.type === 'forum') {
          alert(`New forum post: ${notification.body}`);
        }
      }
    );
  }
  async showNotificationAlert(title: string, message: string) {
    const alert = await this.alertController.create({
      header: title,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  onImageSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      this.selectedImageFile = fileInput.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImageUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  async createPost() {
    if (!this.newPostContent.trim() && !this.selectedImageUrl) return;

    let imageUrl: string | null = null;

    const authorAvatar = this.userData?.avatar || null;

    if (this.selectedImageFile) {
      const filePath = `posts/${Date.now()}_${this.selectedImageFile.name}`;
      const fileRef = this.storage.ref(filePath);
      const uploadTask = this.storage.upload(filePath, this.selectedImageFile);

      await uploadTask
        .snapshotChanges()
        .pipe(
          finalize(async () => {
            imageUrl = await fileRef.getDownloadURL().toPromise();
            this.savePost(imageUrl, authorAvatar);
          })
        )
        .toPromise();
    } else {
      this.savePost(null, authorAvatar);
    }
  }

  private async savePost(imageUrl: string | null, authorAvatar: string | null) {
    try {
      await this.forumService.createPost(
        this.newPostContent,
        this.userData,
        imageUrl
      );
      this.newPostContent = '';
      this.selectedImageUrl = null;
      this.selectedImageFile = null;

      if (this.userData.role !== 'faculty') {
        const alert = await this.alertController.create({
          header: 'Post Submitted',
          message: 'Your post has been submitted for approval.',
          buttons: ['OK'],
        });
        await alert.present();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  }

  async addComment(post: Post, commentContent: string) {
    if (!commentContent.trim()) return;

    try {
      await this.forumService.addComment(
        post.id!,
        commentContent,
        this.userData
      );
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  async deletePost(post: Post) {
    if (post.userId === this.userData.uid) {
      const alert = await this.alertController.create({
        header: 'Confirm Delete',
        message: 'Are you sure you want to delete this post?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Delete',
            handler: () => {
              this.forumService.deletePost(post.id!);
            },
          },
        ],
      });
      await alert.present();
    }
  }

  toggleLike(post: Post) {
    this.forumService.toggleLike(post.id!, this.userData.uid);
  }

  toggleDislike(post: Post) {
    this.forumService.toggleDislike(post.id!, this.userData.uid);
  }

  convertTimestampToDate(timestamp: Timestamp | undefined): Date | null {
    if (!timestamp || !timestamp.seconds) {
      return null;
    }
    return new Date(timestamp.seconds * 1000);
  }
  async openCommentModal(postId: string) {
    const modal = await this.modalController.create({
      component: CommentModalComponent,
      componentProps: { postId },
    });
    await modal.present();
  }
}
