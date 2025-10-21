// components/transactions/transactions.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../../Services/toastService';
import { Transaction } from '../../../Interfaces/transactions';
import { PayPad } from '../../../Interfaces/locations';
import { Api } from '../../../Services/apiService';



@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions.html',
  styleUrls: ['../../../output.css']
})
export class Transactions implements OnInit {
  private _api = inject(Api);
  private router = inject(Router);
  private toastService = inject(ToastService);

  transactions = signal<Transaction[]>([]);
  paypads = signal<PayPad[]>([]);
  loading = signal(false);
  
  private excludedPayPadIds = signal<number[]>([]);

  recentTransactions = computed(() => {
    const excluded = this.excludedPayPadIds();
    
    const filtered = this.transactions().filter(tx => 
      !excluded.includes(tx.idPayPad)
    );
    
    return filtered.slice(0, 10);
  });

  stats = computed(() => {
    const txs = this.recentTransactions();
    
    const aprobadas = txs.filter(t => 
      t.stateTransaction === 'Aprobada' || 
      t.stateTransaction === 'Aprobada Error Devuelta' ||
      t.stateTransaction === 'Aprobada Sin Notificar'
    );
    
    const canceladas = txs.filter(t => 
      t.stateTransaction === 'Cancelada' || 
      t.stateTransaction === 'Cancelada Error Devuelta'
    );

    const iniciadas = txs.filter(t => t.stateTransaction === 'Iniciada');

    const totalRecaudado = aprobadas.reduce((acc, t) => 
      acc + this.num(t.totalAmount), 0
    );

    const totalRetirado = aprobadas.reduce((acc, t) => 
      acc + this.num(t.returnAmount), 0
    );

    return {
      total: txs.length,
      aprobadas: aprobadas.length,
      canceladas: canceladas.length,
      iniciadas: iniciadas.length,
      totalRecaudado,
      totalRetirado
    };
  });

  ngOnInit(): void {
    const user = localStorage.getItem('User');
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadData();
    this.startAutoRefresh();
  }

  async loadData() {
    this.loading.set(true);

    try {
      const paypadsRes = await this._api.GetAllPaypads().toPromise();
      if (paypadsRes?.response) {
        this.paypads.set(paypadsRes.response);
        
        const excludedNames = ['Pay+ Prueba1'];
        const excludedIds = paypadsRes.response
          .filter(p => excludedNames.includes(p.username))
          .map(p => p.id);
        
        this.excludedPayPadIds.set(excludedIds);

      }

      const txsRes = await this._api.GetAllTransactions().toPromise();
      if (txsRes?.response) {
        const sorted = txsRes.response.slice().sort((a, b) => 
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
        );
        
        this.transactions.set(sorted);

      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.toastService.error(
        '❌ Error',
        'No se pudieron cargar las transacciones'
      );
    } finally {
      this.loading.set(false);
    }
  }

  private startAutoRefresh() {
    setInterval(() => {
      this.loadData();
    }, 120000); // 2 minutos
  }

  getPayPadName(id: number): string {
    return this.paypads().find(p => p.id === id)?.username || `Kiosko #${id}`;
  }

  getStateClass(state: string): string {
    if (state.includes('Aprobada')) return 'bg-green-100 text-green-800 border-green-200';
    if (state.includes('Cancelada')) return 'bg-red-100 text-red-800 border-red-200';
    if (state.includes('Iniciada')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  }


  refresh() {
    this.toastService.info('Actualizando', 'Obteniendo últimas transacciones...');
    this.loadData();
  }

  private num(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  Exit() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}