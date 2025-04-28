import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DarkModeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    // Retrieve dark mode setting from localStorage (or Firebase if you prefer)
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.darkModeSubject.next(savedDarkMode);

    // Update the body class based on dark mode status
    if (savedDarkMode) {
      document.body.classList.add('dark');
    }
  }

  toggleDarkMode() {
    const currentMode = this.darkModeSubject.value;
    const newMode = !currentMode;

    this.darkModeSubject.next(newMode);
    localStorage.setItem('darkMode', newMode.toString());

    if (newMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  getDarkModeStatus() {
    return this.darkModeSubject.asObservable();
  }
}
