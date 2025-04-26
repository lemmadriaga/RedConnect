import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
})
export class SplashScreenComponent implements OnInit {
  showSplash = true;
  constructor() {}

  ngOnInit(): void {
    setTimeout(() => {
      this.showSplash = false;
    }, 3000);
  }
}
