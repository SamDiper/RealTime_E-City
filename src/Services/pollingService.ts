// Services/pollingService.ts

import { Injectable, inject } from '@angular/core';
import { interval, Subject, BehaviorSubject } from 'rxjs';
import { switchMap, startWith, catchError, takeUntil, distinctUntilChanged, tap } from 'rxjs/operators';
import { Api } from './apiService';
import { PaypadAlert } from '../Interfaces/locations';
import { ToastService } from './toastService';

@Injectable({
  providedIn: 'root'
})
export class PollingService {
  private _api = inject(Api);
  private toastService = inject(ToastService);  
  private destroy$ = new Subject<void>();
  
  subscriptions$ = new BehaviorSubject<PaypadAlert[]>([]);
  
  private previousSubscriptions: PaypadAlert[] = [];
  private pollingCounter = 0;

  startSubscriptionsPolling(intervalTime: number = 120000) {

    return interval(intervalTime)
      .pipe(
        startWith(0),
        tap(() => {
          this.pollingCounter++;
        }),
        switchMap(() => this._api.GetAllSubscriptions()),
        distinctUntilChanged((prev, curr) => {
          const isEqual = JSON.stringify(prev.response) === JSON.stringify(curr.response);
          return isEqual;
        }),
        takeUntil(this.destroy$),
        catchError((error) => {
          this.toastService.error(
            '❌ Error de Conexión',
            'No se pudo obtener el estado de los kioskos'
          );
          
          return [];
        })
      )
      .subscribe({
        next: (response) => {
          const newSubs = response.response ?? [];
          this.subscriptions$.next(newSubs);
          
          if (this.previousSubscriptions.length > 0) {
            const changes = this.detectChanges(this.previousSubscriptions, newSubs);
            this.notifyChanges(changes);  
          } 
          
          this.previousSubscriptions = newSubs;
        }
      });
  }


  private detectChanges(oldSubs: PaypadAlert[], newSubs: PaypadAlert[]) {
    // Nuevas alertas
    const newAlerts = newSubs.filter(
      newS => !oldSubs.find(oldS => oldS.id === newS.id)
    );

    // Alertas resueltas
    const resolvedAlerts = oldSubs.filter(
      oldS => !newSubs.find(newS => newS.id === oldS.id)
    );

    // Cambios de estado
    const changedAlerts = newSubs.filter(newS => {
      const oldS = oldSubs.find(old => old.id === newS.id);
      return oldS && oldS.idAlert !== newS.idAlert;
    });

    // Alertas críticas (Apagado o Sin Dinero)
    const criticalAlerts = newAlerts.filter(
      alert => alert.idAlert === 0 || alert.idAlert === 1
    );

    return { newAlerts, resolvedAlerts, changedAlerts, criticalAlerts };
  }


  private notifyChanges(changes: ReturnType<typeof this.detectChanges>) {
    const { newAlerts, resolvedAlerts, changedAlerts, criticalAlerts } = changes;

    if (criticalAlerts.length > 0) {
      criticalAlerts.forEach(alert => {
        this.toastService.error(
          ` ALERTA CRÍTICA`,
          `${alert.paypad}: ${alert.alert}`,
          10000  // 10 segundos
        );
      });

    }

    const normalAlerts = newAlerts.filter(
      alert => alert.idAlert !== 0 && alert.idAlert !== 1
    );
    
    if (normalAlerts.length > 0) {
      normalAlerts.forEach(alert => {
        this.toastService.warning(
          `Nueva Alerta`,
          `${alert.paypad}: ${alert.alert}`,
          7000
        );
      });
    }

    if (resolvedAlerts.length > 0) {
      if (resolvedAlerts.length === 1) {
        this.toastService.success(
          'Alerta Resuelta',
          `${resolvedAlerts[0].paypad} volvió a la normalidad`,
          5000
        );
      } else {
        this.toastService.success(
          'Alertas Resueltas',
          `${resolvedAlerts.length} kiosko(s) volvieron a la normalidad`,
          5000
        );
      }
    }

    if (changedAlerts.length > 0) {
      changedAlerts.forEach(alert => {
        const oldAlert = this.previousSubscriptions.find(old => old.id === alert.id);
        
        this.toastService.info(
          `Cambio de Estado`,
          `${alert.paypad}: ${oldAlert?.alert} → ${alert.alert}`,
          6000
        );
      });
    }

  }


  private getAlertColor(idAlert: number): string {
    const colors: Record<number, string> = {
      0: '#F44336',  // Rojo - Apagado
      1: '#FF9800',  // Naranja - Sin Dinero
      2: '#FFC107',  // Amarillo - Fallo Periférico
      3: '#2196F3',  // Azul - Sin Internet
    };
    return colors[idAlert] || '#9E9E9E';
  }

  stopPolling() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}