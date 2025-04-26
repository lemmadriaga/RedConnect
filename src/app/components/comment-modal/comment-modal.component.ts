import { Component, Input, OnInit } from '@angular/core';
import { ForumService, Comment } from '../../forum.service';
import { AuthenticationService } from '../../authentication.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-comment-modal',
  templateUrl: './comment-modal.component.html',
  styleUrls: ['./comment-modal.component.scss'],
})
export class CommentModalComponent implements OnInit {
  @Input() postId!: string;
  comments: Comment[] = [];
  newCommentContent: string = '';
  replyingToCommentId: string | null = null; // Track the comment being replied to
  userData: any = {}; // Initialize as an empty object to avoid undefined errors

  constructor(
    private forumService: ForumService,
    private authService: AuthenticationService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadComments();
  }

  loadUserData() {
    this.authService.getUserData$().subscribe((data) => {
      this.userData = data;
    });
  }

  loadComments() {
    this.forumService.getComments(this.postId).subscribe((comments) => {
      this.comments = comments;
    });
  }

  replyToComment(commentId: string) {
    this.replyingToCommentId = commentId; // Set the comment ID for inline reply
  }

  async addComment() {
    if (!this.newCommentContent.trim() || !this.userData) return;

    await this.forumService.addComment(
      this.postId,
      this.newCommentContent,
      {
        uid: this.userData.uid,
        fullName: this.userData.fullName,
        profilePictureUrl: this.userData.profilePictureUrl || './assets/profile-placeholder.jpg',
      },
      this.replyingToCommentId // Associate the reply with the parent comment
    );

    this.newCommentContent = '';
    this.replyingToCommentId = null; // Reset the replying ID after posting
    this.loadComments(); // Refresh comments to display the new reply
  }

  closeModal() {
    this.modalController.dismiss();
  }

  // Helper to get replies for a comment
  getReplies(commentId: string): Comment[] {
    return this.comments.filter(comment => comment.parentCommentId === commentId);
  }
}
