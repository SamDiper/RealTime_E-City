import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './components/toast/toast';
import { PollingService } from '../Services/pollingService';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css','../output.css']
})
export class App implements OnInit, OnDestroy { 
  router = inject(Router);
  pollingService = inject(PollingService);
  refreshInterval: any;

  sidebarOpen = signal(false);

  isPolling = signal(true);
  lastPollingTime = signal(new Date());

  sidebarClasses = computed(() => {
    const isOpen = this.sidebarOpen();
    return `
      fixed lg:static
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      h-full z-40
    `.trim();
  });

  ngOnInit(): void {
    this.startGlobalPolling();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.pollingService.stopPolling();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

    private startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      if (this.router.url !== '/login') {
        window.location.reload();
      }
    }, 1200000);// 20min
  }

  private startGlobalPolling() {
    this.pollingService.subscriptions$.subscribe({
      next: () => {
        this.lastPollingTime.set(new Date());
      }
    });

    this.pollingService.startSubscriptionsPolling(300000);// 5min
  }

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