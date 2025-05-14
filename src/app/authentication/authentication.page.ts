import {
  Component,
  OnInit,
  Renderer2,
  AfterViewInit,
  ElementRef,
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
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
export class AuthenticationPage implements OnInit, AfterViewInit {
  regForm: FormGroup;
  loginForm: FormGroup;
  errorMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword = false;
  isSignUpMode: boolean = false;

  // Input field focus state tracking
  emailFocused: boolean = false;
  passwordFocused: boolean = false;
  fullnameFocused: boolean = false;
  regEmailFocused: boolean = false;
  contactFocused: boolean = false;
  regPasswordFocused: boolean = false;
  confirmPasswordFocused: boolean = false;
  // departmentFocused: boolean = false;  // Temporarily commented out

  constructor(
    private formBuilder: FormBuilder,
    private renderer: Renderer2,
    private el: ElementRef,
    private router: Router,
    public loadingCtrl: LoadingController,
    public authService: AuthenticationService,
    public alertCtrl: AlertController
  ) {
    // Initialize login form
    this.loginForm = this.formBuilder.group({
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(
            '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$'
          ),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern('^.{8,}$'), // At least 8 characters
        ],
      ],
    });

    // Initialize registration form
    this.regForm = this.formBuilder.group(
      {
        fullname: ['', Validators.required],
        email: [
          '',
          [
            Validators.required,
            Validators.pattern(
              '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$'
            ),
          ],
        ],
        contact: [
          '',
          [
            Validators.required,
            Validators.pattern('^[0-9]{11}$'), // 11 digits
          ],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.pattern('^.{8,}$'), // At least 8 characters
          ],
        ],
        confirmPassword: ['', Validators.required],
        // department: ['', Validators.required],  // Temporarily commented out
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  ngOnInit() {
    this.setupFormSubscriptions();
  }

  ngAfterViewInit() {
    // Get sign up button from the DOM
    const signUpBtn = this.el.nativeElement.querySelector('#sign-up-btn');
    // Get sign in button from the DOM
    const signInBtn = this.el.nativeElement.querySelector('#sign-in-btn');

    if (signUpBtn) {
      this.renderer.listen(signUpBtn, 'click', () => {
        this.toggleMode(true);
      });
    }

    if (signInBtn) {
      this.renderer.listen(signInBtn, 'click', () => {
        this.toggleMode(false);
      });
    }
  }

  toggleMode(isSignUp: boolean) {
    this.isSignUpMode = isSignUp;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  signIn() {
    if (this.loginForm.valid) {
      this.signInWithEmail();
    } else {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Please check your input fields';
    }
  }

  async signUp() {
    const loading = await this.loadingCtrl.create();
    await loading.present();
    if (this.regForm?.valid) {
      const email = this.regForm.value.email;
      const password = this.regForm.value.password;
      const fullName = this.regForm.value.fullname;
      const contact = this.regForm.value.contact;
      // const department = this.regForm.value.department;  // Temporarily commented out

      try {
        const user = await this.authService.registerUser(
          email,
          password,
          fullName,
          contact
          // department  // Temporarily commented out
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

  resetPassword() {
    // Handle password reset logic
    console.log('Reset password requested');
    // Implement password reset functionality
  }

  // Validation helper methods
  getInputFieldClass(controlName: string, formGroup: FormGroup) {
    const control = formGroup.get(controlName);
    if (!control) return {};

    // Get the appropriate focus state based on the control name
    let isFocused = false;
    switch (controlName) {
      case 'email':
        isFocused = this.emailFocused;
        break;
      case 'password':
        isFocused = this.passwordFocused;
        break;
      case 'fullname':
        isFocused = this.fullnameFocused;
        break;
      case 'contact':
        isFocused = this.contactFocused;
        break;
      // case 'department':  // Temporarily commented out
      //   isFocused = this.departmentFocused;
      //   break;
    }

    return {
      focused: isFocused,
      'has-content': control.value,
      'valid-input': control.valid && control.touched,
      'invalid-input': control.invalid && control.touched,
    };
  }

  // Custom validator to check if password and confirmPassword match
  passwordsMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      // Only clear mismatch error if there are no other errors
      if (form.get('confirmPassword')?.hasError('mismatch')) {
        const confirmPasswordControl = form.get('confirmPassword');
        confirmPasswordControl?.setErrors(null);
      }
      return null;
    }
  }

  async signInWithEmail() {
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
          this.errorMessage = 'Invalid email and password';
        }
      } catch (error) {
        this.errorMessage = 'Invalid email and password';
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

  tabs() {
    this.router.navigate(['tabs']);
  }

  setupFloatingLabels() {
    // Apply 'has-value' class to inputs with values
    const applyHasValueClass = () => {
      const inputs = document.querySelectorAll('ion-input');
      inputs.forEach((input) => {
        const ionInput = input as HTMLIonInputElement;

        // Check if input has value and add class accordingly
        ionInput.getInputElement().then((inputEl) => {
          if (inputEl.value !== '') {
            ionInput.classList.add('has-value');
          } else {
            ionInput.classList.remove('has-value');
          }
        });

        // Listen for changes
        ionInput.addEventListener('ionChange', () => {
          ionInput.getInputElement().then((inputEl) => {
            if (inputEl.value !== '') {
              ionInput.classList.add('has-value');
            } else {
              ionInput.classList.remove('has-value');
            }
          });
        });
      });
    };

    // Initial setup
    setTimeout(applyHasValueClass, 500);

    // Update when form values change
    this.loginForm.valueChanges.subscribe(() => {
      setTimeout(applyHasValueClass, 100);
    });

    this.regForm.valueChanges.subscribe(() => {
      setTimeout(applyHasValueClass, 100);
    });
  }

  setupFormSubscriptions() {
    this.regForm.valueChanges.subscribe(() => {
      console.log('Form Valid:', this.regForm.valid);
      console.log('Form Errors:', this.regForm.errors);
      console.log('Form Values:', this.regForm.value);
    });
  }
}
