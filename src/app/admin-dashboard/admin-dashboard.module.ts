import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardPage } from './admin-dashboard.page';
import { FormsModule } from '@angular/forms';
import { PostManagementComponent } from '../components/post-management/post-management.component';

import { FullCalendarModule } from '@fullcalendar/angular';


const routes: Routes = [
  {
    path: '',
    component: AdminDashboardPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    FullCalendarModule
  ],
  declarations: [AdminDashboardPage, PostManagementComponent],
})
export class AdminDashboardPageModule {}
