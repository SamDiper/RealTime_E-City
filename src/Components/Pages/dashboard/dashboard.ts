import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Input,
  inject,
  NgZone,
  signal,
  computed
} from '@angular/core';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { Api } from '../../../Services/apiService';
import { PayPadResponse, PayPad } from '../../../Interfaces/locations';
import { Transaction, TransactionResponse } from '../../../Interfaces/transactions';

type PaymentOption = { label: string; value: string | null };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  private map: L.Map | undefined;
  private markers: L.Marker[] = [];
  private _api = inject(Api);
  private zone = inject(NgZone);

  route = inject(Router);
  http = inject(HttpClient);

  _currentYear: number = new Date().getFullYear();

  // Datos base
  paypads: PayPad[] = [];
  filteredPaypads: PayPad[] = [];

  // Filtro por estado (interno). -1 = Todas
  private filterState = -1;

  // También soporta Input desde un padre (opcional)
  @Input() markerState: number | null = null;

  // Estado de UI detalle
  selectedPayPad = signal<PayPad | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Transacciones del PayPad seleccionado
  transactions = signal<Transaction[]>([]);
  cantIniciada = 0;
  cantCancelada = 0;
  cantAprobada = 0;
  totalAmount = 0;

  selectedPaymentType = signal<string | null>(null);

  // Opciones de medio de pago derivadas de las transacciones
  paymentTypeOptions = computed<PaymentOption[]>(() => {
    const txs = this.transactions();
    if (!txs.length) return [{ label: 'Todos', value: null }];
    const unique = Array.from(new Set(txs.map(t => t.typePayment).filter(Boolean)));
    return [{ label: 'Todos', value: null }, ...unique.map(v => ({ label: v!, value: v! }))];
  });

  // Transacciones filtradas + recálculo de contadores
  filteredTransactions = computed<Transaction[]>(() => {
    this.cantAprobada = 0;
    this.cantCancelada = 0;
    this.cantIniciada = 0;
    this.totalAmount = 0;

    const type = this.selectedPaymentType();
    const txs = this.transactions();
    const list = type ? txs.filter(t => t.typePayment === type) : txs;

    for (const el of list) {
      if (el.stateTransaction === 'Cancelada' || el.stateTransaction === 'Cancelada Error Devuelta') {
        this.cantCancelada++;
      }
      if (
        el.stateTransaction === 'Aprobada' ||
        el.stateTransaction === 'Aprobada Error Devuelta' ||
        el.stateTransaction === 'Aprobada Sin Notificar'
      ) {
        this.cantAprobada++;
        this.totalAmount += this.num(el.totalAmount);
      }
      if (el.stateTransaction === 'Iniciada') {
        this.cantIniciada++;
      }
    }
    return list;
  });

  // Totales derivados
  totalTransacciones = computed(() => this.filteredTransactions().length);
  totalRecaudado = computed(() => this.filteredTransactions().reduce((acc, t) => acc + this.num(t.incomeAmount ?? 0), 0));
  totalRetirado = computed(() => this.filteredTransactions().reduce((acc, t) => acc + this.num(t.returnAmount ?? 0), 0));

  // Estados (para referencia, si quieres iterarlos)
  states = [
    { label: 'Todas', value: -1, icon: 'https://maps.google.com/mapfiles/ms/icons/blue.png' },
    { label: 'Activas', value: 1, icon: 'https://maps.google.com/mapfiles/ms/icons/green.png' },
    { label: 'Periférico Desconectado', value: 2, icon: 'https://maps.google.com/mapfiles/ms/icons/yellow.png' },
    { label: 'Apagadas', value: 0, icon: 'https://maps.google.com/mapfiles/ms/icons/red.png' },
    { label: 'Sin Internet', value: 3, icon: 'https://maps.google.com/mapfiles/ms/icons/purple.png' },
    { label: 'Sin Dinero', value: 4, icon: 'http://maps.google.com/mapfiles/ms/icons/grey.png' },
  ];

  // Ciclo de vida
  ngOnInit(): void {
    const _user = localStorage.getItem('User');
    if (_user == null) {
      this.Exit();
      return;
    }
    this.cargarUbicaciones();
  }

  ngAfterViewInit(): void {
    this.initMap();
    // Si ya cargaron paypads antes del mapa, dibuja ahora
    this.redrawMarkers();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reacciona a cambios de @Input markerState desde un padre
    if (changes['markerState']) {
      const curr = changes['markerState'].currentValue;
      if (curr !== undefined && curr !== null) {
        this.filterState = Number(curr);
        this.applyFilter();
        this.redrawMarkers();
      }
    }
  }

  // Acciones top
  Exit() { localStorage.clear(); this.route.navigate(['/login']); }
  Charts() { this.route.navigate(['/charts']); }
  verMapa() { document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

  public setState(state: number) {
    this.filterState = state;
    // this.applyFilter();
    this.redrawMarkers();
  }

  private initMap(): void {
    const colombiaBounds = L.latLngBounds(
      L.latLng(-4.2316872, -79.0237629),
      L.latLng(12.4373032, -66.8511907)
    );

    this.map = L.map('map', {
      center: [4.59806, -74.0758],
      zoom: 5,
      maxBounds: colombiaBounds,
      maxBoundsViscosity: 0.7
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
  }

  private cargarUbicaciones(): void {
    this._api.GetAllPaypads().subscribe({
      next: (data: PayPadResponse) => {
        this.paypads = data.response ?? [];
        this.applyFilter();
        this.redrawMarkers();
      },
      error: (err) => console.error('Error al cargar ubicaciones:', err)
    });
  }

  private applyFilter(): void {
    this.filteredPaypads = this.filterState === -1
      ? this.paypads
      : this.paypads.filter(p => p.status === this.filterState);
  }

  private redrawMarkers(): void {
    if (!this.map) return;

    // limpiar marcadores previos
    this.markers.forEach(m => m.remove());
    this.markers = [];

    for (const ubicacion of this.filteredPaypads) {
      const lat = Number(ubicacion.latitude);
      const lng = Number(ubicacion.longitude);
      if (isNaN(lat) || isNaN(lng)) continue;

      const marker = L.marker([lng, lat], {
        icon: L.icon({
          iconUrl: this.iconForStatus(this.filterState),
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        }),
        title: ubicacion.username
      }).addTo(this.map!);
      
      marker.on('click', () => this.zone.run(() => this.onMarkerClick(ubicacion)));
      this.markers.push(marker);
    }
  }

  private iconForStatus(status?: number): string {
    switch (status) {
      case 1: return 'https://maps.google.com/mapfiles/ms/icons/green.png';   // Activas
      case 0: return 'https://maps.google.com/mapfiles/ms/icons/red.png';     // Apagadas
      case 2: return 'https://maps.google.com/mapfiles/ms/icons/yellow.png';  // Periférico desconectado
      case 3: return 'https://maps.google.com/mapfiles/ms/icons/purple.png';  // Sin Internet
      case 4: return 'https://maps.google.com/mapfiles/ms/icons/grey.png';    // Sin dinero
      default: return 'https://maps.google.com/mapfiles/ms/icons/blue.png';   // Todas
    }
  }

  private onMarkerClick(ubicacion: PayPad) {
    if (this.selectedPayPad()?.id !== ubicacion.id) {
      this.selectedPaymentType.set(null);
    }

    this.selectedPayPad.set(ubicacion);
    this.loading.set(true);
    this.error.set(null);
    this.transactions.set([]);

    this._api.GetTransactionsById(ubicacion.id).subscribe({
      next: (data: TransactionResponse) => {
        const txs = (data.response ?? []).slice();
        txs.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
        this.transactions.set(txs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar transacciones:', err);
        this.error.set('No fue posible cargar las transacciones.');
        this.loading.set(false);
      }
    });
  }

  // Utils
  private num(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }
}