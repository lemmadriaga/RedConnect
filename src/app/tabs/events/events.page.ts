import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthenticationService } from 'src/app/authentication.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-events-page',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
})
export class EventsPage implements OnInit {
  events: any[] = [];

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.getUserRole$().subscribe((role) => {
      console.log('User role:', role);

      this.firestore
        .collection('events')
        .snapshotChanges()
        .subscribe((events) => {
          const currentTime = new Date().getTime();

          this.events = events
            .map((event) => {
              const data = event.payload.doc.data() as { [key: string]: any };
              const id = event.payload.doc.id;

              const eventDate = new Date(data['date'] + 'T' + data['time']);
              const durationInMs = (data['duration'] || 0) * 60 * 60 * 1000;
              const eventEndTime = eventDate.getTime() + durationInMs;

              if (currentTime < eventEndTime) {
                return { id, ...data };
              }

              return null;
            })
            .filter((event: any) => event && event.invited.includes(role));

          console.log('Filtered events:', this.events);
        });
    });
  }

  registerEvent(event: any) {
    if (event.id) {
      this.router.navigate(['/event-details', event.id]);
    } else {
      console.error('Event ID is undefined:', event);
    }
  }
}
