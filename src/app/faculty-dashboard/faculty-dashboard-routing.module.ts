import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FacultyDashboardPage } from './faculty-dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: FacultyDashboardPage,
    children:[
      {
        path: 'profile',
        loadChildren: () => import('../student-dashboard/profile/profile.module').then( m => m.ProfilePageModule)
      },
      {
        path: 'chat',
        loadChildren:() => import('../tabs/chat/chat.module').then( m => m.ChatPageModule)
      },
      {
        path: 'forum',
        loadChildren: () => import('../tabs/forum/forum.module').then( m => m.ForumPageModule)
      },
      {
        path: 'events',
        loadChildren: () => import('../tabs/events/events.module').then( m => m.EventsPageModule)
      },
      {
        path: 'event-details',
        loadChildren: () => import('../tabs/event-details/event-details.module').then( m => m.EventDetailsPageModule)
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FacultyDashboardPageRoutingModule {}
