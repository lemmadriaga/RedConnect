import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AlumniDashboardPage } from './alumni-dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: AlumniDashboardPage,
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
export class AlumniDashboardPageRoutingModule {}
