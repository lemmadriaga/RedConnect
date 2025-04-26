import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-components',
  templateUrl: './components.component.html',
  styleUrls: ['./components.component.scss'],
})
export class ComponentsComponent implements OnInit {
  showSplash = true;
  constructor() {}

  ngOnInit(): void {
    setTimeout(() => {
      this.showSplash = false;
    }, 3000);
  }
}
