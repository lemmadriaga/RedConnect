import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './guards/admin.guard';
import { EventsPage } from './tabs/events/events.page';
import { EventDetailsPage } from './tabs/event-details/event-details.page';
import { ChatRoomComponent } from './components/chat-room/chat-room.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'authentication',
    loadChildren: () =>
      import('./authentication/authentication.module').then(
        (m) => m.AuthenticationPageModule
      ),
  },
  {
    path: 'tabs',
    loadChildren: () =>
      import('./tabs/tabs.module').then((m) => m.TabsPageModule),
  },
  {
    path: 'student-dashboard',
    loadChildren: () =>
      import('./student-dashboard/student-dashboard.module').then(
        (m) => m.StudentDashboardPageModule
      ),
  },
  {
    path: 'alumni-dashboard',
    loadChildren: () =>
      import('./alumni-dashboard/alumni-dashboard.module').then(
        (m) => m.AlumniDashboardPageModule
      ),
  },
  {
    path: 'admin-dashboard',
    loadChildren: () =>
      import('./admin-dashboard/admin-dashboard.module').then(
        (m) => m.AdminDashboardPageModule
      ),
    canActivate: [AdminGuard],
  },
  {
    path: 'faculty-dashboard',
    loadChildren: () =>
      import('./faculty-dashboard/faculty-dashboard.module').then(
        (m) => m.FacultyDashboardPageModule
      ),
  },
  {
    path: 'forum',
    loadChildren: () =>
      import('./tabs/forum/forum.module').then((m) => m.ForumPageModule),
  },
  { path: 'events', component: EventsPage },
  { path: 'event-details/:id', component: EventDetailsPage },

  {
    path: 'chat-room/:id',
    loadChildren: () =>
      import('./components/chat-room/chat-room.module').then(
        (m) => m.ChatRoomModule
      ),
  },
  {
    path: 'reset-password',
    loadChildren: () =>
      import('./reset-password/reset-password.module').then(
        (m) => m.ResetPasswordPageModule
      ),
  },
  {
    path: 'splash',
    loadChildren: () =>
      import('./splash/splash.module').then((m) => m.SplashPageModule),
  },
  {
    path: 'feedback-modal',
    loadChildren: () => import('./feedback-modal/feedback-modal.module').then( m => m.FeedbackModalPageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./student-dashboard/profile/profile.module').then( m => m.ProfilePageModule)
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
