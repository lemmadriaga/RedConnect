import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../authentication.service';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
})
export class ResetPasswordPage {
  resetPasswordForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthenticationService,
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.resetPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async goToLogin() {
    return this.router.navigate(['/authentication']);
  }

  async resetPassword() {
    if (this.resetPasswordForm.valid) {
      const email = this.resetPasswordForm.value.email;
      try {
        await this.authService.sendPasswordResetEmail(email);
        const toast = await this.toastController.create({
          message: 'Password reset email sent.',
          duration: 2000,
          color: 'success',
        });
        await toast.present();
      } catch (error) {
        const toast = await this.toastController.create({
          message: 'Error sending password reset email.',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
      }
    }
  }
}
