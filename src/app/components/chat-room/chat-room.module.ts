import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { ChatRoomComponent } from './chat-room.component';

const routes: Routes = [
  {
    path: '',
    component: ChatRoomComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes) 
  ],
  declarations: [ChatRoomComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ChatRoomModule {}
