import { Injectable, inject } from '@angular/core';
import { interval, Subject, BehaviorSubject } from 'rxjs';
import { switchMap, startWith, catchError, takeUntil, distinctUntilChanged, tap } from 'rxjs/operators';
import { Api } from './apiService';
import { PaypadAlert } from '../Interfaces/locations';

@Injectable({
  providedIn: 'root'
})
export class PollingService {
  private _api = inject(Api);
  private destroy$ = new Subject<void>();
  
  subscriptions$ = new BehaviorSubject<PaypadAlert[]>([]);
  
  private previousSubscriptions: PaypadAlert[] = [];
  private pollingCounter = 0; // ← Contador de polls

  startSubscriptionsPolling(intervalTime: number = 120000) {
    console.log(
      `%c🚀 Polling iniciado - Intervalo: ${intervalTime / 1000}s (${intervalTime / 60000}min)`,
      'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
    );

    return interval(intervalTime)
      .pipe(
        startWith(0),
        tap(() => {
          this.pollingCounter++;
          console.log(
            `%c🔄 Polling #${this.pollingCounter} - ${new Date().toLocaleTimeString()}`,
            'background: #2196F3; color: white; padding: 3px 8px; border-radius: 3px;'
          );
          console.log(`⏱️ Próximo polling en ${intervalTime / 1000}s`);
        }),
        switchMap(() => this._api.GetAllSubscriptions()),
        tap((response) => {
          console.log(
            `%c✅ Respuesta recibida - Total subscriptions: ${response.response?.length || 0}`,
            'background: #8BC34A; color: white; padding: 3px 8px; border-radius: 3px;'
          );
          console.table(response.response?.slice(0, 5)); // Muestra las primeras 5
        }),
        distinctUntilChanged((prev, curr) => {
          const isEqual = JSON.stringify(prev.response) === JSON.stringify(curr.response);
          if (isEqual) {
            console.log(
              `%c⚪ Sin cambios detectados`,
              'background: #9E9E9E; color: white; padding: 3px 8px; border-radius: 3px;'
            );
          } else {
            console.log(
              `%c🔔 ¡CAMBIOS DETECTADOS!`,
              'background: #FF9800; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;'
            );
          }
          return isEqual;
        }),
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error(
            `%c❌ Error en polling #${this.pollingCounter}`,
            'background: #F44336; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;',
            error
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
            this.logChanges(changes);
          } else {
            console.log(
              `%c📊 Primera carga - ${newSubs.length} subscriptions`,
              'background: #673AB7; color: white; padding: 3px 8px; border-radius: 3px;'
            );
          }
          
          this.previousSubscriptions = newSubs;
          console.log('─'.repeat(80)); // Separador visual
        }
      });
  }

  /**
   * Detecta cambios entre estados anterior y actual
   */
  private detectChanges(oldSubs: PaypadAlert[], newSubs: PaypadAlert[]) {
    const newAlerts = newSubs.filter(
      newS => !oldSubs.find(oldS => oldS.id === newS.id)
    );

    const resolvedAlerts = oldSubs.filter(
      oldS => !newSubs.find(newS => newS.id === oldS.id)
    );

    const changedAlerts = newSubs.filter(newS => {
      const oldS = oldSubs.find(old => old.id === newS.id);
      return oldS && oldS.idAlert !== newS.idAlert;
    });

    return { newAlerts, resolvedAlerts, changedAlerts };
  }

  /**
   * Log detallado de cambios
   */
  private logChanges(changes: ReturnType<typeof this.detectChanges>) {
    const { newAlerts, resolvedAlerts, changedAlerts } = changes;
    
    if (newAlerts.length > 0) {
      console.log(
        `%c🆕 ${newAlerts.length} Nuevas alertas`,
        'background: #FF5722; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;'
      );
      console.table(newAlerts);
    }

    if (resolvedAlerts.length > 0) {
      console.log(
        `%c✅ ${resolvedAlerts.length} Alertas resueltas`,
        'background: #4CAF50; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;'
      );
      console.table(resolvedAlerts);
    }

    if (changedAlerts.length > 0) {
      console.log(
        `%c🔄 ${changedAlerts.length} Alertas modificadas`,
        'background: #FFC107; color: black; padding: 3px 8px; border-radius: 3px; font-weight: bold;'
      );
      console.table(changedAlerts);
    }

    if (newAlerts.length === 0 && resolvedAlerts.length === 0 && changedAlerts.length === 0) {
      console.log(
        `%c✓ Sin cambios en alertas`,
        'background: #607D8B; color: white; padding: 3px 8px; border-radius: 3px;'
      );
    }
  }

  /**
   * Detiene el polling
   */
  stopPolling() {
    console.log(
      `%c🛑 Polling detenido - Total de polls realizados: ${this.pollingCounter}`,
      'background: #F44336; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
    );
    this.destroy$.next();
    this.destroy$.complete();
  }
}