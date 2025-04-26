import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../chat.service';
import { AuthenticationService } from '../../authentication.service';
import { Observable, Subscription, from, of } from 'rxjs';
import { IonContent, IonTextarea } from '@ionic/angular';
import { Location } from '@angular/common';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss'],
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content: IonContent;
  @ViewChild('messageInput') messageInput: IonTextarea;

  chatId: string;
  messages: any[] = [];
  newMessage: string = '';
  maxMessageLength: number = 1000; 
  otherUser: any;
  currentUserId: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private authService: AuthenticationService,
    private location: Location
  ) {}

  ngOnInit() {
    this.chatId = this.route.snapshot.paramMap.get('id');
    this.loadMessages();
    this.loadOtherUser();
    this.subscriptions.push(
      from(this.authService.getCurrentUserId()).subscribe(userId => {
        this.currentUserId = userId;
        if (userId) {
          this.chatService.updateUserStatus(userId, true);
        }
        console.log('Current user ID:', this.currentUserId); // Debug log
      })
    );
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // Remove or comment out this line
    // if (this.currentUserId) {
    //   this.chatService.updateUserStatus(this.currentUserId, false);
    // }
  }
  
  

  goBack() {
    this.location.back();
  }


  loadMessages() {
    this.subscriptions.push(
      this.chatService.getMessages(this.chatId).subscribe(
        (messages) => {
          this.messages = messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp?.toDate()
          }));
          this.scrollToBottom();
        },
        (error) => {
          console.error('Error loading messages:', error);
        }
      )
    );
  }

  loadOtherUser() {
    this.subscriptions.push(
      this.chatService.getOtherUser(this.chatId).subscribe(
        (user) => {
          this.otherUser = user;
        },
        (error) => {
          console.error('Error loading other user:', error);
        }
      )
    );
  }

  async sendMessage() {
    if (this.newMessage?.trim()) {
      const messageText = this.newMessage.trim();
      this.newMessage = ''; // Clear input first for better UX
      
      try {
        await this.chatService.sendMessage(this.chatId, messageText).toPromise();
        // Reset the input height
        const textarea = await this.messageInput.getInputElement();
        textarea.style.height = 'auto';
        this.scrollToBottom();
      } catch (error) {
        console.error('Error sending message:', error);
        // Optionally show an error toast/alert
      }
    }
  }
  async onInputChange(event: any) {
    // Resize the input field as needed
    const textarea = await this.messageInput.getInputElement();
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    
    // Optional: Enforce character limit
    if (this.newMessage.length > this.maxMessageLength) {
      this.newMessage = this.newMessage.substring(0, this.maxMessageLength);
    }
    
    // Scroll to bottom when input grows
    this.scrollToBottom();
  }

  // Improve scroll behavior
  scrollToBottom(duration: number = 300) {
    setTimeout(() => {
      this.content?.scrollToBottom(duration);
    }, 100);
  }

  // Add this method to handle initial loading
  async ionViewDidEnter() {
    this.scrollToBottom(0);
    // Focus the input if needed
    setTimeout(() => {
      this.messageInput?.setFocus();
    }, 500);
  }

  // Optional: Add method to handle Shift+Enter
  async handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await this.sendMessage();
    }
  }

  getUserLabel(userId: string): string {
    return userId === this.currentUserId ? 'You' : this.otherUser?.name || 'User';
  }
}
