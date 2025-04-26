import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AlumniDashboardPageRoutingModule } from './alumni-dashboard-routing.module';

import { AlumniDashboardPage } from './alumni-dashboard.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AlumniDashboardPageRoutingModule
  ],
  declarations: [AlumniDashboardPage]
})
export class AlumniDashboardPageModule {}
