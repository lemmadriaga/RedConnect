import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthenticationService } from '../../authentication.service';
import { Observable } from 'rxjs';
import { AlertController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
})
export class EditProfilePage implements OnInit {
  editForm: FormGroup;
  userData$: Observable<any>;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthenticationService,
    private alertController: AlertController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.userData$ = this.authService.getUserData$();
    this.initializeForm();
  }

  initializeForm() {
    this.editForm = this.formBuilder.group({
      fullName: ['', Validators.required],
      contact: ['', [Validators.required, Validators.pattern('^09\\d{9}$')]],
      department: ['', Validators.required],
    });

    this.userData$.subscribe((userData) => {
      if (userData) {
        this.editForm.patchValue({
          fullName: userData.fullName,
          contact: userData.contact,
          department: userData.department,
        });
      }
    });
  }

  async uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const userId = await this.authService.getCurrentUserId();
        if (userId) {
          try {
            await this.authService.uploadProfilePicture(userId, file).toPromise();
            this.presentAlert('Success', 'Profile picture updated successfully.');
          } catch (error) {
            this.presentAlert('Error', 'Failed to update profile picture. Please try again.');
          }
        }
      }
    };
    input.click();
  }

  async updateProfile() {
    if (this.editForm.valid) {
      const { fullName, contact, department } = this.editForm.value;
      const userId = await this.authService.getCurrentUserId();
      if (userId) {
        await this.authService.updateUserProfile(userId, { fullName, contact, department });
        this.presentAlert('Success', 'Profile updated successfully.');
        this.navCtrl.back();
      }
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }


  goBack() {
    this.navCtrl.back(); 
  }
}
