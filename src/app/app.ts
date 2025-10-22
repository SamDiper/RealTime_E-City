// app.component.ts
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
  private pollingService = inject(PollingService);
  
  sidebarOpen = signal(false);

  isPolling = signal(true);
  lastPollingTime = signal(new Date());

  sidebarClasses = computed(() => {
    const isOpen = this.sidebarOpen();
    return `
      fixed lg:static
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      h-full
    `.trim();
  });

  ngOnInit(): void {
    console.log('🚀 App Component inicializado - Iniciando polling global');
    this.startGlobalPolling();
  }

  ngOnDestroy(): void {
    console.log('🛑 App Component destruido - Deteniendo polling global');
    this.pollingService.stopPolling();
  }

  private startGlobalPolling() {
    this.pollingService.subscriptions$.subscribe({
      next: () => {
        this.lastPollingTime.set(new Date());
      }
    });

    this.pollingService.startSubscriptionsPolling(60000);
    
    console.log('✅ Polling global iniciado - Los toasts se mostrarán automáticamente');
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