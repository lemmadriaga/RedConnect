import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
})
export class SplashPage implements AfterViewInit {
  showSplash = true;
  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.showSplash = false;
      this.router.navigate(['/authentication'])
    }, 3000);
  }
}
