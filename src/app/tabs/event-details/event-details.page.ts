import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthenticationService } from 'src/app/authentication.service';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.page.html',
  styleUrls: ['./event-details.page.scss'],
})
export class EventDetailsPage implements OnInit {
  event: any;
  isRegistered: boolean = false;
  isAttended: boolean = false;
  userId: string | null = null;
  userName: string | null = null;
  userDepartment: string | null = null;
  userSection: string | null = null;
  isSectionValid: boolean = true;
  isSectionLocked: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private authService: AuthenticationService,
    public router: Router
  ) {}

  ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.authService.getUserId().subscribe((id) => {
        this.userId = id;
      });
      this.authService.getUserName().subscribe((name) => {
        this.userName = name;
      });
      this.authService.getUserDepartment().subscribe((department) => {
        this.userDepartment = department;
      });

      this.firestore
        .collection('events')
        .doc(eventId)
        .valueChanges()
        .subscribe((eventData) => {
          if (eventData && typeof eventData === 'object') {
            this.event = { ...(eventData as object), id: eventId };
            this.checkIfRegistered(eventId);
          }
        });
    }
  }

  // checkIfRegistered(eventId: string) {
  //   if (this.userId) {
  //     this.firestore
  //       .collection('events')
  //       .doc(eventId)
  //       .collection('attendees')
  //       .doc(this.userId)
  //       .get()
  //       .subscribe((doc) => {
  //         this.isRegistered = doc.exists;
  //         if (this.isRegistered) {
  //           this.isAttended = doc.data()?.['status'] === 'Attended';
  //         }
  //       });
  //   }
  // }
  checkIfRegistered(eventId: string) {
    if (this.userId) {
      this.firestore
        .collection('events')
        .doc(eventId)
        .collection('attendees')
        .doc(this.userId)
        .get()
        .subscribe((doc) => {
          this.isRegistered = doc.exists;
          this.isAttended = doc.data()?.['status'] === 'Attended';
          this.isSectionLocked = this.isRegistered;
          console.log('isRegistered:', this.isRegistered, 'isAttended:', this.isAttended);
        });
    }
  }
  validateSection(value: string) {
    const trimmedValue = value.trim();
    const regex = /^[A-Z0-9-]+$/;
    this.isSectionValid = regex.test(trimmedValue);
    this.userSection = trimmedValue;
  }
  registerToEvent() {
    if (
      !this.isRegistered &&
      this.userId &&
      this.userName &&
      this.userDepartment &&
      this.userSection &&
      this.isSectionValid
    ) {
      const attendeeData = {
        name: this.userName,
        department: this.userDepartment,
        section: this.userSection,
        status: 'Registered',
      };

      this.firestore
        .collection('events')
        .doc(this.event.id)
        .collection('attendees')
        .doc(this.userId)
        .set(attendeeData)
        .then(() => {
          this.isRegistered = true;
          this.isSectionLocked = true; 
        })
        .catch((error) => console.error('Error registering attendee:', error));
    } else {
      console.error('Invalid section input or already registered.');
    }
  }
  // isEventToday(): boolean {
  //   const today = new Date();
  //   const eventDate = new Date(this.event.date);
  //   return (
  //     today.getFullYear() === eventDate.getFullYear() &&
  //     today.getMonth() === eventDate.getMonth() &&
  //     today.getDate() === eventDate.getDate()
  //   );
  // }
  // // isEventToday(): boolean {
  // //   const today = new Date();
  // //   const eventDate = new Date(this.event.date);
  // //   const eventStart = new Date(eventDate.getTime());
  // //   const eventEnd = new Date(
  // //     eventDate.getTime() + this.event.duration * 60 * 60 * 1000
  // //   );

  // //   return today >= eventStart && today <= eventEnd;
  // // }
  isEventToday(): boolean {
    if (!this.event || !this.event.date || !this.event.time || !this.event.duration) {
      return false;
    }
  
    const eventStart = new Date(`${this.event.date}T${this.event.time}`);
    const eventEnd = new Date(eventStart.getTime() + this.event.duration * 60 * 60 * 1000);
  
    const now = new Date();
    console.log('Event Start:', eventStart, 'Event End:', eventEnd, 'Now:', now);
  
    return now >= eventStart && now <= eventEnd;
  }
  
  async checkLocationAndMarkAttendance() {
    if (
      navigator.geolocation &&
      this.event?.latitude &&
      this.event?.longitude
    ) {
      try {
        const position = await Geolocation.getCurrentPosition();
        const distance = this.calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          this.event.latitude,
          this.event.longitude
        );

        if (distance <= 0.1) {
          this.markAttendance();
        } else {
          alert('You need to be at the event location to mark attendance.');
        }
      } catch (error) {
        console.error('Error getting location:', error);
        alert(
          'Could not get location. Please ensure location services are enabled.'
        );
      }
    } else {
      alert('Event location not set or location services not available.');
    }
  }

  markAttendance() {
    if (this.userId && this.event?.id) {
      this.firestore
        .collection('events')
        .doc(this.event.id)
        .collection('attendees')
        .doc(this.userId)
        .update({ status: 'present' })
        .then(() => {
          this.isAttended = true;
          console.log('Attendance marked as attended.');
        })
        .catch((error) => console.error('Error marking attendance:', error));
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
