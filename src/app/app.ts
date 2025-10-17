import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,
      RouterLinkActive,
      RouterLink
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css','../output.css']
})
export class App {
  router= inject(Router);

  protected readonly title = signal('RealTime');
}
