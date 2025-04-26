import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-custom-alert',
  templateUrl: './custom-alert.component.html',
  styleUrls: ['./custom-alert.component.scss'],
})
export class CustomAlertComponent {
  @Input() header: string = 'Alert';
  @Input() message: string = '';
  @Input() buttonText: string = 'Close';

  constructor(private modalController: ModalController) {}

  async close() {
    await this.modalController.dismiss();
  }
}
