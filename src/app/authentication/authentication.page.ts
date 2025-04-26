import { AfterViewInit, Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AuthenticationService } from '../authentication.service';
import { take } from 'rxjs';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.page.html',
  styleUrls: ['./authentication.page.scss'],
})
export class AuthenticationPage implements AfterViewInit {
  regForm: FormGroup;
  loginForm: FormGroup;
  errorMessage: string | null = null;
  showPassword = false;

  constructor(
    public formBuilder: FormBuilder,
    private router: Router,
    public loadingCtrl: LoadingController,
    public authService: AuthenticationService,
    public alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.initializeForms();
  }

  private initializeForms() {
    this.regForm = this.formBuilder.group({
      fullname: ['', [Validators.required]],
      contact: ['', [Validators.required, Validators.pattern('^09\\d{9}$')]],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern('^[a-z0-9._%+-]+@g\\.batstate-u\\.edu\\.ph$'),
        ],
      ],
      password: ['', [Validators.required, Validators.pattern('.{8,}')]],
      department: ['', [Validators.required]],
    });

    this.loginForm = this.formBuilder.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern('^[a-z0-9._%+-]+@g\\.batstate-u\\.edu\\.ph$'),
        ],
      ],
      password: ['', [Validators.required, Validators.pattern('.{8,}')]],
    });
  }
  get errorControl() {
    return this.regForm?.controls, this.loginForm?.controls;
  }
  async signUp() {
    const loading = await this.loadingCtrl.create();
    await loading.present();
    if (this.regForm?.valid) {
      const email = this.regForm.value.email;
      const password = this.regForm.value.password;
      const fullName = this.regForm.value.fullname;
      const contact = this.regForm.value.contact;
      const department = this.regForm.value.department;

      try {
        const user = await this.authService.registerUser(
          
          email,
          password,
          fullName,
          contact,
          department
        );
        if (user) {
          await this.authService.sendVerificationEmail();
          loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Verify Your Email',
            message:
              'We have sent you an email. Please verify your account before logging in.',
            buttons: ['OK'],
          });
          await alert.present();
          this.regForm.reset();
        }
      } catch (error) {
        console.error('Registration error:', error);
        loading.dismiss();
      }
    } else {
      loading.dismiss();
    }
  }

  async signIn() {
    const loading = await this.loadingCtrl.create();
    await loading.present();

    if (this.loginForm?.valid) {
      try {
        const user = await this.authService.loginUser(
          this.loginForm.value.email,
          this.loginForm.value.password
        );

        if (user) {
          const role = await this.authService
            .getUserRole$()
            .pipe(take(1))
            .toPromise();

          if (role) {
            switch (role) {
              case 'admin':
                await this.router.navigate(['/admin-dashboard']);
                break;
              case 'student':
                await this.router.navigate(['/student-dashboard/forum']);
                break;
              case 'alumni':
                await this.router.navigate(['/alumni-dashboard/forum']);
                break;
              case 'faculty':
                await this.router.navigate(['/faculty-dashboard/forum']);
                break;
              default:
                this.errorMessage = 'Invalid role';
                await this.router.navigate(['/authentication']);
                break;
            }
          } else {
            this.errorMessage = 'No role found';
            await this.router.navigate(['/authentication']);
          }
          this.loginForm.reset();
        } else {
          this.errorMessage = 'Please check your email and password';
        }
      } catch (error) {
        this.errorMessage = 'Please check your email and password';
        console.error('Error during sign-in:', error);
        await this.router.navigate(['/authentication']);
      } finally {
        loading.dismiss();
      }
    }
  }

  async googleSignIn() {
    const loading = await this.loadingCtrl.create();
    await loading.present();

    try {
      const user = await this.authService.googleSignIn();
      if (user) {
        console.log('User successfully logged in with Google:', user);

        const role = await this.authService
          .getUserRole$()
          .pipe(take(1))
          .toPromise();
        console.log('User role:', role);

        switch (role) {
          case 'admin':
            await this.router.navigate(['/admin-dashboard']);
            break;
          case 'student':
            await this.router.navigate(['/student-dashboard/forum']);
            break;
          case 'alumni':
            await this.router.navigate(['/alumni-dashboard/forum']);
            break;
          case 'faculty':
            await this.router.navigate(['/faculty-dashboard/forum']);
            break;
          default:
            console.error('Invalid role');
            await this.router.navigate(['/authentication']);
            break;
        }
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      await this.router.navigate(['/authentication']);
    } finally {
      loading.dismiss();
    }
  }

  async resetPassword() {
    return this.router.navigate(['/reset-password']);
  }

  ngAfterViewInit() {
    const sign_in_btn = document.querySelector('#sign-in-btn');
    const sign_up_btn = document.querySelector('#sign-up-btn');
    const container = document.querySelector('.container');

    if (sign_up_btn && container) {
      sign_up_btn.addEventListener('click', () => {
        container.classList.add('sign-up-mode');
      });
    }

    if (sign_in_btn && container) {
      sign_in_btn.addEventListener('click', () => {
        container.classList.remove('sign-up-mode');
      });
    }
  }

  tabs() {
    this.router.navigate(['tabs']);
  }
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
