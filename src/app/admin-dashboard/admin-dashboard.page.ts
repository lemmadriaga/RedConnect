import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ForumService, Post } from '../forum.service';
import { AuthenticationService } from '../authentication.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { FeedbackService } from '../feedback.service';
import { Chart } from 'chart.js/auto';
import { ReportService } from '../report.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import * as L from 'leaflet';
import 'leaflet-control-geocoder';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { HostListener } from '@angular/core';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { map } from 'rxjs/operators';

interface TabItem {
  label: string;
  icon: string;
  active: boolean;
}
interface Event {
  id?: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  registrations?: number;
  attendees?: number;
  [key: string]: any;
}

interface Attendee {
  department?: string;
  name?: string;
  section?: string;
  status: 'registered' | 'present';
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
})
export class AdminDashboardPage implements OnInit, AfterViewInit {
  showDashboardEventDetailsModal: boolean = false;
  selectedDashboardEvent: Event | null = null;

  sortedEvents: Event[] = [];
  averageRegistrationGrowthRate: number = 0;
  averageAttendeeGrowthRate: number = 0;
  lastRegistrations: number = 0;
  lastAttendees: number = 0;
  predictedRegistrations: number = 0;
  predictedAttendees: number = 0;

  reportCurrentPage: number = 1;
  reportTotalPages: number[] = [];
  feedbackCurrentPage: number = 1;
  feedbackTotalPages: number[] = [];
  events: any[] = [];
  rankedEvents: any[] = [];
  monthlyRegistrationsChart: any;
  selectedInvitedType: string = '';
  filteredEvents: any[] = [];
  uniqueSections: string[] = [];
  selectedSection: string | null = null;
  uniqueDepartments: string[] = [];
  selectedDepartment: string | null = null;
  selectedStatus: string | null = null;
  selectedReport: any = null;
  showReportDetailsModal: boolean = false;
  isSidebarVisible = true;
  isLargeScreen = window.innerWidth >= 1024;
  showEventDetailsModall = false;
  showEventDetailsModal = false;
  map: L.Map | null = null;
  marker: L.Marker | null = null;
  mapReady: boolean = false;
  feedbackList: any[] = [];
  paginatedFeedbackList: any[] = [];
  ratingsChart: any;
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number[] = [];
  reports: any[] = [];
  paginatedReportList: any[] = [];
  departmentChart: any;
  showEventForm = false;
  eventForm = {
    title: '',
    date: '',
    time: '',
    duration: '',
    location: '',
    invited: [],
    description: '',
    thumbnailUrl: '',
    latitude: 14.073856,
    longitude: 121.2612608,
  };

  selectedEventId: string | null = null;
  attendeeList: any[] = [];
  attendeesDepartmentChart: any;
  calendarOptions: any;
  selectedEvent: any;

  tabs: TabItem[] = [
    { label: 'Dashboard', icon: 'grid', active: true },
    { label: 'Postings', icon: 'newspaper', active: false },
    { label: 'Calendar', icon: 'calendar', active: false },
    { label: 'Events', icon: 'calendar', active: false },
    { label: 'Reports', icon: 'bar-chart', active: false },
  ];

  currentTab = 'Dashboard';
  totalUsers: number = 0;
  pendingPosts$: Observable<Post[]>;

  constructor(
    private forumService: ForumService,
    private authService: AuthenticationService,
    private router: Router,
    private feedbackService: FeedbackService,
    private reportService: ReportService,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage
  ) {
    this.pendingPosts$ = this.forumService.getPostsForApproval();
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  eventDetails(eventId: string) {
    if (eventId) {
      this.selectedEventId = eventId;
      this.showEventDetailsModal = true;
      this.loadAttendeeDetails();
    } else {
      console.error('Invalid eventId passed to eventDetails:', eventId);
    }
  }

  closeEventDetailsModal() {
    this.showEventDetailsModal = false;
    if (this.attendeesDepartmentChart) {
      this.attendeesDepartmentChart.destroy();
    }
  }
  closeEventDetailsModall() {
    this.showEventDetailsModall = false;
    if (this.attendeesDepartmentChart) {
      this.attendeesDepartmentChart.destroy();
    }
  }

  ngOnInit() {
    this.fetchEvents();
    this.loadSortedEvents();
    this.loadEventAnalytics();
    this.loadMonthlyRegistrationChart();
    this.loadEvents();
    this.loadAttendeeDetails();
    this.loadEvents();
    this.initializeCalendar();

    this.authService.getUserRole$().subscribe((role) => {
      if (role !== 'admin') {
        this.router.navigate(['/home']);
      }
    });
    this.authService.getUserDepartmentCounts().subscribe((departmentCounts) => {
      this.createDepartmentChart(departmentCounts);
    });

    this.authService.getTotalUserCount().subscribe((count) => {
      this.totalUsers = count;
    });
    this.feedbackService.getFeedbackRatings().subscribe((feedbacks: any[]) => {
      this.feedbackList = feedbacks;
      this.calculateFeedbackTotalPages();
      this.updatePaginatedFeedbackList();
      this.createRatingsChart(feedbacks.map((feedback) => feedback.rating));
    });

    this.reportService.getReports().subscribe((reports) => {
      this.reports = reports;
      this.calculateReportTotalPages();
      this.updatePaginatedReportList();
    });

    this.fetchReports();

    this.firestore
      .collection('events')
      .snapshotChanges()
      .subscribe((events: any[]) => {
        this.events = events.map((e) => {
          return {
            id: e.payload.doc.id,
            ...e.payload.doc.data(),
          };
        });
      });
  }

  ngAfterViewInit() {
    if (this.showEventForm) {
      this.initializeMapWithDelay();
    }
  }
  initializeCalendar() {
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
      initialView: window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
      },
      editable: true,
      selectable: true,
      weekends: true,
      height: 'auto',
      aspectRatio: 1.2,
      eventDisplay: 'block',
      contentHeight: 'auto',
      events: [],
      eventClick: this.handleEventClick.bind(this),
    };
  }

  handleDateSelect(arg: any) {
    console.log('Date selected:', arg);
  }
  loadEvents() {
    this.firestore
      .collection('events')
      .snapshotChanges()
      .subscribe((events) => {
        const calendarEvents = events.map((e) => {
          const data: any = e.payload.doc.data();
          const start = new Date(`${data.date}T${data.time}`);

          return {
            id: e.payload.doc.id,
            title: data.title,
            start: start,
            extendedProps: {
              time: data.time,
              location: data.location,
              description: data.description,
              duration: data.duration,
              invited: data.invited,
            },
          };
        });

        const philippineHolidays = [
          { title: "New Year's Day", date: '2024-01-01' },
          { title: 'Independence Day', date: '2024-06-12' },
          { title: 'Bonifacio Day', date: '2024-11-30' },
        ];

        this.calendarOptions.events = [
          ...calendarEvents,
          ...philippineHolidays,
        ];
      });
  }
  convertToDate(timestamp: any): Date {
    if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    return timestamp;
  }

  handleEventClick(eventClickInfo) {
    this.selectedEvent = {
      title: eventClickInfo.event.title,
      date: eventClickInfo.event.start,
      duration: eventClickInfo.event.extendedProps.duration,
      invited: eventClickInfo.event.extendedProps.invited,
      location: eventClickInfo.event.extendedProps.location,
      description: eventClickInfo.event.extendedProps.description,
    };
    this.showEventDetailsModall = true;
  }

  calculateTotalPages() {
    const pageCount = Math.ceil(this.feedbackList.length / this.itemsPerPage);
    this.totalPages = Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePaginatedFeedbackList();
  }

  selectTab(tab: TabItem) {
    this.tabs.forEach((t) => (t.active = false));
    tab.active = true;
    this.currentTab = tab.label;
  }

  async approvePost(postId: string) {
    try {
      await this.forumService.approvePost(postId);
    } catch (error) {
      console.error('Error approving post:', error);
    }
  }

  async deletePost(postId: string) {
    try {
      await this.forumService.deletePost(postId);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }

  async logout() {
    try {
      await this.authService.logoutUser();
      this.router.navigate(['/authentication']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  createRatingsChart(ratings: number[]) {
    const ratingCounts = [0, 0, 0, 0, 0];

    ratings.forEach((rating) => {
      ratingCounts[rating - 1] += 1;
    });

    const ctx = document.getElementById('ratingsChart') as HTMLCanvasElement;

    this.ratingsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
        datasets: [
          {
            label: 'Number of Ratings',
            data: ratingCounts,
            backgroundColor: '#990008',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }

  markAsSolved(reportId: string) {
    this.reportService.markReportAsSolved(reportId).then(() => {
      alert('Report marked as solved.');
      this.fetchReports();

      this.reportService.notifyUserSolved(reportId);
    });
  }

  fetchReports() {
    this.reportService.getReports().subscribe((reports) => {
      this.reports = reports || [];
      this.calculateReportPages();
      this.updatePaginatedReportList();
    });
  }
  calculateReportPages() {
    const pageCount = Math.ceil(this.reports.length / this.itemsPerPage);
    this.totalPages = Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  createDepartmentChart(departmentCounts: { [department: string]: number }) {
    const ctx = document.getElementById('departmentChart') as HTMLCanvasElement;
    const labels = Object.keys(departmentCounts);
    const data = Object.values(departmentCounts);

    this.departmentChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Users per Department',
            data: data,
            backgroundColor: [
              '#3498db',
              '#e74c3c',
              '#f39c12',
              '#f1c40f',
              '#1abc9c',
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.2,
        plugins: {
          legend: {
            position: 'top',
          },
        },
      },
    });
  }

  uploadThumbnail(event: any) {
    const file = event.target.files[0];
    const filePath = `thumbnails/${new Date().getTime()}_${file.name}`;
    const fileRef = this.storage.ref(filePath);

    fileRef.put(file).then(() => {
      fileRef.getDownloadURL().subscribe((url) => {
        this.eventForm.thumbnailUrl = url;
      });
    });
  }

  loadAttendeeDetails() {
    if (this.selectedEventId) {
      this.firestore
        .collection('events')
        .doc(this.selectedEventId)
        .collection('attendees')
        .valueChanges()
        .subscribe((attendees: any[]) => {
          this.attendeeList = attendees;
          this.uniqueDepartments = [
            ...new Set(attendees.map((att) => att.department)),
          ];
          this.uniqueSections = [
            ...new Set(attendees.map((att) => att.section)),
          ];

          this.updateDepartmentChart(attendees);
        });
    }
  }

  updateDepartmentChart(attendees: any[]) {
    const presentAttendees = attendees.filter(
      (attendee) => attendee.status === 'present'
    );

    const departmentCounts = this.countAttendeesByDepartment(presentAttendees);
    const departments = Object.keys(departmentCounts);
    const counts = Object.values(departmentCounts);

    const ctx = document.getElementById(
      'attendeesDepartmentChart'
    ) as HTMLCanvasElement;

    if (this.attendeesDepartmentChart) {
      this.attendeesDepartmentChart.destroy();
    }

    if (ctx) {
      this.attendeesDepartmentChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: departments,
          datasets: [
            {
              data: counts,
              backgroundColor: [
                '#3498db',
                '#e74c3c',
                '#f39c12',
                '#2ecc71',
                '#9b59b6',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
          },
        },
      });
    } else {
      console.error('Canvas element for attendeesDepartmentChart not found');
    }
  }

  private countAttendeesByDepartment(attendees: any[]) {
    const departmentCounts: { [key: string]: number } = {};

    attendees.forEach((attendee) => {
      const department = attendee.department;
      departmentCounts[department] = (departmentCounts[department] || 0) + 1;
    });

    return departmentCounts;
  }
  openEventForm() {
    this.showEventForm = true;

    setTimeout(() => {
      this.initializeMapWithDelay();
    }, 500);
  }

  closeEventForm() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    if (this.marker) {
      this.marker = null;
    }
    this.showEventForm = false;
  }

  submitEventForm() {
    if (
      this.eventForm.title &&
      this.eventForm.date &&
      this.eventForm.time &&
      this.eventForm.thumbnailUrl
    ) {
      const { date, time } = this.eventForm;
      const [hours, minutes] = time.split(':').map(Number);
      const [year, month, day] = date.split('-').map(Number);
      const timestamp = new Date(
        Date.UTC(year, month - 1, day, hours, minutes)
      ).getTime();

      this.eventForm.invited = this.eventForm.invited.map((role: string) =>
        role.toLowerCase()
      );

      const eventDoc = this.selectedEventId
        ? this.firestore.collection('events').doc(this.selectedEventId)
        : this.firestore.collection('events').doc();

      eventDoc
        .set({ ...this.eventForm, timestamp }, { merge: true })
        .then(() => {
          this.showEventForm = false;
          this.selectedEventId = null;

          this.eventForm = {
            title: '',
            date: '',
            time: '',
            duration: '',
            location: '',
            invited: [],
            description: '',
            thumbnailUrl: '',
            latitude: 0,
            longitude: 0,
          };

          this.fetchEvents();
        })
        .catch((error) => {
          console.error('Error submitting event:', error);
          alert('Failed to submit the event. Please try again.');
        });
    } else {
      alert('Please complete all required fields.');
    }
  }

  initializeMapWithDelay() {
    if (this.map) {
      this.map.remove();
    }

    setTimeout(() => {
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error('Map container not found');
        return;
      }

      try {
        this.map = L.map('map', {
          center: [this.eventForm.latitude, this.eventForm.longitude],
          zoom: 13,
          layers: [
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap contributors',
            }),
          ],
        });

        this.marker = L.marker(
          [this.eventForm.latitude, this.eventForm.longitude],
          {
            draggable: true,
          }
        ).addTo(this.map);

        this.marker.on('dragend', (event) => {
          const marker = event.target;
          const position = marker.getLatLng();
          this.eventForm.latitude = position.lat;
          this.eventForm.longitude = position.lng;
        });

        setTimeout(() => {
          this.map?.invalidateSize();
        }, 250);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 500);
  }
  addTimestampsToExistingEvents() {
    this.firestore
      .collection('events')
      .get()
      .subscribe((snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data() as Event;
          if (data.date && data.time) {
            const timestamp = new Date(`${data.date}T${data.time}`).getTime();
            this.firestore
              .collection('events')
              .doc(doc.id)
              .update({ timestamp })
              .then(() => {
                console.log(`Timestamp added for event: ${doc.id}`);
              })
              .catch((error) => {
                console.error(`Error updating event ${doc.id}:`, error);
              });
          }
        });
      });
  }

  updateMarkerPosition() {
    if (
      this.map &&
      this.marker &&
      this.eventForm.latitude &&
      this.eventForm.longitude
    ) {
      const newLatLng = L.latLng(
        this.eventForm.latitude,
        this.eventForm.longitude
      );
      this.marker.setLatLng(newLatLng);
      this.map.setView(newLatLng, this.map.getZoom());
    }
  }

  setLocationFromAddress() {
    if (!this.eventForm.location || !this.map || !this.marker) return;

    const geocoder = L.Control.Geocoder.nominatim();

    geocoder.geocode(this.eventForm.location, (results) => {
      if (results && results.length > 0) {
        const latlng = results[0].center;
        this.eventForm.latitude = latlng.lat;
        this.eventForm.longitude = latlng.lng;

        this.marker.setLatLng(latlng);
        this.map.setView(latlng, this.map.getZoom());
      } else {
        alert('Address not found. Please enter a valid location.');
      }
    });
  }

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  filterEvents() {
    if (this.selectedInvitedType) {
      this.filteredEvents = this.events.filter(
        (event) =>
          event.invited.includes(this.selectedInvitedType) &&
          !event.invited.includes('alumni')
      );
    } else {
      this.filteredEvents = this.events.filter(
        (event) => !event.invited.includes('alumni')
      );
    }
  }

  downloadPDF() {
    const doc = new jsPDF();
    doc.text('Event Attendees', 10, 10);

    const headers = [['Name', 'Department', 'Section', 'Status']];

    const filteredAttendees = this.attendeeList.filter((attendee) => {
      const matchesDepartment =
        !this.selectedDepartment ||
        attendee.department === this.selectedDepartment;
      const matchesSection =
        !this.selectedSection || attendee.section === this.selectedSection;
      const matchesStatus =
        !this.selectedStatus ||
        (this.selectedStatus === 'registered' &&
          attendee.status.toLowerCase() === 'registered') ||
        (this.selectedStatus === 'present' &&
          attendee.status.toLowerCase() === 'present');

      return matchesDepartment && matchesSection && matchesStatus;
    });

    const data = filteredAttendees.map((attendee) => [
      attendee.name,
      attendee.department,
      attendee.section,
      attendee.status,
    ]);

    if (data.length === 0) {
      alert('No attendees match the selected filters.');
      return;
    }

    doc.autoTable({
      head: headers,
      body: data,
      startY: 20,
    });

    doc.save('Event_Attendees.pdf');
  }

  editEvent(event: any) {
    this.eventForm = {
      ...event,
      invited: [...event.invited],
    };
    this.selectedEventId = event.id;
    this.showEventForm = true;
  }
  async deleteEvent(eventId: string) {
    if (
      confirm('Are you sure you want to delete this event and its attendees?')
    ) {
      try {
        const attendeesRef = this.firestore.collection(
          `events/${eventId}/attendees`
        );

        const attendeesSnapshot = await attendeesRef.get().toPromise();
        const batch = this.firestore.firestore.batch();

        attendeesSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();

        await this.firestore.collection('events').doc(eventId).delete();
        alert('Event and its attendees deleted successfully');

        this.loadEvents();
      } catch (error) {
        console.error('Error deleting event and attendees:', error);
      }
    }
  }
  viewReportDetails(report: any) {
    this.selectedReport = report;
    this.showReportDetailsModal = true;
  }

  closeReportDetailsModal() {
    this.showReportDetailsModal = false;
    this.selectedReport = null;
  }
  loadMonthlyRegistrationChart() {
    this.authService
      .getMonthlyRegistrationCounts()
      .subscribe((monthlyCounts) => {
        const ctx = document.getElementById(
          'monthlyRegistrationsChart'
        ) as HTMLCanvasElement;
        this.monthlyRegistrationsChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: [
              'January',
              'February',
              'March',
              'April',
              'May',
              'June',
              'July',
              'August',
              'September',
              'October',
              'November',
              'December',
            ],
            datasets: [
              {
                label: 'User Registrations',
                data: monthlyCounts,
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              y: { beginAtZero: true },
            },
            responsive: true,
            plugins: {
              legend: { display: false },
            },
          },
        });
      });
  }

  rankEvents() {
    this.rankedEvents = [...this.events].sort((a, b) => {
      const attendeesComparison = b.attendees - a.attendees;
      if (attendeesComparison !== 0) return attendeesComparison;
      return b.registrations - a.registrations;
    });

    this.loadEventChart();
  }

  loadEventChart() {
    const ctx = document.getElementById('eventChart') as HTMLCanvasElement;

    const topEvents = this.rankedEvents.slice(0, 5);
    const labels = topEvents.map((event) => event.title);
    const registrationsData = topEvents.map((event) => event.registrations);
    const attendeesData = topEvents.map((event) => event.attendees);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Registrations',
            data: registrationsData,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          },
          {
            label: 'Attendees',
            data: attendeesData,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }
  calculateFeedbackTotalPages() {
    const pageCount = Math.ceil(this.feedbackList.length / this.itemsPerPage);
    this.feedbackTotalPages = Array.from(
      { length: pageCount },
      (_, i) => i + 1
    );
  }

  updatePaginatedFeedbackList() {
    const startIndex = (this.feedbackCurrentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedFeedbackList = this.feedbackList.slice(startIndex, endIndex);
  }

  goToFeedbackPage(page: number) {
    this.feedbackCurrentPage = page;
    this.updatePaginatedFeedbackList();
  }

  calculateReportTotalPages() {
    const pageCount = Math.ceil(this.reports.length / this.itemsPerPage);
    this.reportTotalPages = Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  updatePaginatedReportList() {
    const startIndex = (this.reportCurrentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedReportList = this.reports.slice(startIndex, endIndex);
  }

  goToReportPage(page: number) {
    this.reportCurrentPage = page;
    this.updatePaginatedReportList();
  }
  async loadEventAnalytics() {
    const eventsSnapshot = await this.firestore
      .collection('events')
      .get()
      .toPromise();

    const eventPromises = eventsSnapshot.docs.map(async (doc) => {
      const eventData = doc.data() as Event;
      const attendeesSnapshot = await this.firestore
        .collection(`events/${doc.id}/attendees`)
        .get()
        .toPromise();

      const statusCounts = attendeesSnapshot.docs.reduce(
        (counts, attendeeDoc) => {
          const attendeeData = attendeeDoc.data() as Attendee;
          const status = attendeeData.status.toLowerCase();
          counts[status] = (counts[status] || 0) + 1;
          return counts;
        },
        { registered: 0, present: 0 }
      );

      return {
        id: doc.id,
        title: eventData.title,
        date: eventData.date,
        registrations: statusCounts.registered,
        attendees: statusCounts.present,
        ...eventData,
      };
    });

    this.events = await Promise.all(eventPromises);

    this.calculatePredictions();
    this.rankEvents();
  }

  calculatePredictions() {
    if (this.events.length < 2) {
      console.warn('Not enough data to calculate predictions.');
      this.predictedRegistrations = 0;
      this.predictedAttendees = 0;
      return;
    }

    const sortedEvents = this.events
      .filter((event) => event.timestamp)
      .sort((a, b) => a.timestamp - b.timestamp);

    let totalRegistrationGrowth = 0;
    let totalAttendeeGrowth = 0;
    let validRegistrationChanges = 0;
    let validAttendeeChanges = 0;

    for (let i = 1; i < sortedEvents.length; i++) {
      const prevEvent = sortedEvents[i - 1];
      const currentEvent = sortedEvents[i];

      if (prevEvent.registrations && currentEvent.registrations) {
        const registrationGrowth =
          (currentEvent.registrations - prevEvent.registrations) /
          prevEvent.registrations;

        if (isFinite(registrationGrowth)) {
          totalRegistrationGrowth += registrationGrowth;
          validRegistrationChanges++;
        }
      }

      if (prevEvent.attendees && currentEvent.attendees) {
        const attendeeGrowth =
          (currentEvent.attendees - prevEvent.attendees) / prevEvent.attendees;

        if (isFinite(attendeeGrowth)) {
          totalAttendeeGrowth += attendeeGrowth;
          validAttendeeChanges++;
        }
      }
    }

    this.averageRegistrationGrowthRate =
      validRegistrationChanges > 0
        ? totalRegistrationGrowth / validRegistrationChanges
        : 0;
    this.averageAttendeeGrowthRate =
      validAttendeeChanges > 0 ? totalAttendeeGrowth / validAttendeeChanges : 0;

    const lastEvent = sortedEvents[sortedEvents.length - 1];
    this.lastRegistrations = lastEvent.registrations || 0;
    this.lastAttendees = lastEvent.attendees || 0;

    this.predictedRegistrations = Math.round(
      this.lastRegistrations * (1 + this.averageRegistrationGrowthRate)
    );
    this.predictedAttendees = Math.round(
      this.lastAttendees * (1 + this.averageAttendeeGrowthRate)
    );
  }

  loadSortedEvents() {
    this.sortedEvents = this.events
      .filter((event) => event.timestamp)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  viewEventDetails(eventId: string) {
    const selectedEvent = this.events.find((event) => event.id === eventId);

    if (selectedEvent) {
      this.selectedDashboardEvent = selectedEvent;
      this.showDashboardEventDetailsModal = true;
    } else {
      console.error('Event not found:', eventId);
    }
  }
  closeDashboardEventDetailsModal() {
    this.showDashboardEventDetailsModal = false;
    this.selectedDashboardEvent = null;
  }

  fetchEvents() {
    this.firestore
      .collection('events', (ref) => ref.orderBy('timestamp', 'desc'))
      .snapshotChanges()
      .subscribe({
        next: (snapshot) => {
          this.events = snapshot.map((doc) => {
            const data = doc.payload.doc.data() as Event;
            const id = doc.payload.doc.id;
            return { id, ...data };
          });

          this.sortedEvents = [...this.events];
          console.log('Sorted Events:', this.sortedEvents);
        },
        error: (error) => {
          console.error('Error fetching events:', error);
        },
      });
  }
}
