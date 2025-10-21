import { Component, signal, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './components/toast/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css','../output.css']
})
export class App {
  router = inject(Router);
  
  sidebarOpen = signal(false);

  sidebarClasses = computed(() => {
    const isOpen = this.sidebarOpen();
    return `
      fixed lg:static
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      h-full
    `.trim();
  });

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  navigateAndClose(route: string) {
    this.closeSidebar();
  }
}