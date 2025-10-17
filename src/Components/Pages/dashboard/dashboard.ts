import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
  NgZone,
  signal,
  computed,
} from '@angular/core';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { Api } from '../../../Services/apiService';
import { PayPadResponse, PayPad } from '../../../Interfaces/locations';
import { Transaction, TransactionResponse } from '../../../Interfaces/transactions';
// import { SubscriptionResponse } from '../../../Interfaces/Subscriptions';
// import { AlertsHubService } from '../../../Services/hubServices';

type PaymentOption = { label: string; value: string | null };

// Extensión de L.Marker para almacenar la URL del icono
type MarkerWithUrl = L.Marker & { customIconUrl: string };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['../../../output.css'],
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  private map: L.Map | undefined;
  private markers: MarkerWithUrl[] = [];
  private _api = inject(Api);
  private zone = inject(NgZone);

  route = inject(Router);
  http = inject(HttpClient);

  // constructor(private alertsHub: AlertsHubService) {}

  _currentYear: number = new Date().getFullYear();

  // Tamaños de iconos
  private defaultIconSize: [number, number] = [30, 30];
  private bigIconSize: [number, number] = [60, 60];

  // Datos base
  paypads: PayPad[] = [];
  filteredPaypads: PayPad[] = [];
  subscriptions: any;

  private filterState = -1;

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

  // Opciones de medio de pago
  paymentTypeOptions = computed<PaymentOption[]>(() => {
    const txs = this.transactions();
    if (!txs.length) return [{ label: 'Todos', value: null }];
    const unique = Array.from(new Set(txs.map((t) => t.typePayment).filter(Boolean)));
    return [{ label: 'Todos', value: null }, ...unique.map((v) => ({ label: v!, value: v! }))];
  });

  // Transacciones filtradas y totales
  filteredTransactions = computed<Transaction[]>(() => {
    this.cantAprobada = 0;
    this.cantCancelada = 0;
    this.cantIniciada = 0;
    this.totalAmount = 0;

    const type = this.selectedPaymentType();
    const txs = this.transactions();
    const list = type ? txs.filter((t) => t.typePayment === type) : txs;

    for (const el of list) {
      if (
        el.stateTransaction === 'Cancelada' ||
        el.stateTransaction === 'Cancelada Error Devuelta'
      ) {
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

  totalTransacciones = computed(() => this.filteredTransactions().length);
  totalRecaudado = computed(() =>
    this.filteredTransactions().reduce((acc, t) => acc + this.num(t.incomeAmount ?? 0), 0)
  );
  totalRetirado = computed(() =>
    this.filteredTransactions().reduce((acc, t) => acc + this.num(t.returnAmount ?? 0), 0)
  );

  // Ciclo de vida
  ngOnInit(): void {
    const _user = localStorage.getItem('User');
    if (_user == null) {
      this.Exit();
      return;
    }

    this.cargarUbicaciones();
    // this.cargarSubscripciones();
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.redrawMarkers();
    this.map?.whenReady(() => {
      requestAnimationFrame(() => this.map?.invalidateSize());
      setTimeout(() => this.map?.invalidateSize(), 250);
    });
    
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  ngOnChanges(changes: SimpleChanges) {
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
  Exit() {
    localStorage.clear();
    this.route.navigate(['/login']);
  }

  Charts() {
    this.route.navigate(['/charts']);
  }

  verMapa() {
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => this.map?.invalidateSize(), 0);
    setTimeout(() => this.map?.invalidateSize(), 250);
  }

  public setState(state: number) {
    this.filterState = state;
    this.applyFilter();
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
      maxBoundsViscosity: 0.7,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
  }

  private async cargarUbicaciones(): Promise<void> {
    (await this._api.GetAllPaypads()).subscribe({
      next: (data: PayPadResponse) => {
        this.paypads = data.response ?? [];
        this.applyFilter();
        this.redrawMarkers();
      },
      error: (err) => {
        console.error('Error al cargar ubicaciones:', err);
      },
    });
  }

  // private async cargarSubscripciones(): Promise<void> {
  //   (await this._api.GetAllSubscriptions()).subscribe({
  //     next: (data: SubscriptionResponse) => {
  //       this.subscriptions = data.response;
  //       this.mergeSubscriptions();
  //       this.applyFilter();
  //       this.redrawMarkers();
  //     },
  //     error: (err) => {
  //       console.error('Error al cargar subscripciones:', err);
  //     },
  //   });
  // }

  /**
   * Redibuja los marcadores en el mapa
   */
  private redrawMarkers(): void {
    if (!this.map) return;

    // Remover marcadores anteriores
    this.markers.forEach((m) => m.remove());
    this.markers = [];
    this.markersMap.clear();

    for (const ubicacion of this.filteredPaypads) {
      const lat = Number(ubicacion.latitude);
      const lng = Number(ubicacion.longitude);
      if (isNaN(lat) || isNaN(lng)) continue;

      const iconUrl = this.iconForStatus(ubicacion.status);

      const marker = L.marker([lng, lat], {
        icon: L.divIcon({
          className: `marker-wrapper ${ubicacion.status !== 1 ? 'bounce' : ''}`,
          html: `<img src="${iconUrl}" alt="paypad" style="width:30px;height:30px;" />`,
          iconSize: this.defaultIconSize,
          iconAnchor: [15, 30],
        }),
        title: ubicacion.username,
      }) as MarkerWithUrl;

      marker.customIconUrl = iconUrl;

      marker.on('click', () => this.zone.run(() => this.onMarkerClick(ubicacion)));

      marker.addTo(this.map);
      this.markers.push(marker);
      this.markersMap.set(ubicacion.id, marker);
    }
  }

  /**
   * Centrar y resaltar marcador seleccionado
   */
  focusOnPaypad(paypad: PayPad) {
    // Quitar rebote de todos
    this.markers.forEach((marker) => {
      const el = marker.getElement();
      if (el) el.classList.remove('bounce');
    });

    // Agregar rebote solo al seleccionado
    const marker = this.markersMap.get(paypad.id);
    if (marker) {
      const el = marker.getElement();
      if (el) el.classList.add('bounce');

      this.map?.setView([Number(paypad.latitude), Number(paypad.longitude)], 18);
      marker.fire('click');
    }
  }

  /**
   * Restaura tamaño al deseleccionar
   */
  deselectPaypad() {
    this.selectedPayPad.set(null);
  }


  private iconForStatus(status?: number): string {
    switch (status) {
      case 1:
        return 'ActiveMarker-removebg-preview.png'; // Activas
      case 0:
        return 'offMarker-removebg-preview.png'; // Apagadas
      case 2:
        return 'NoConnectionMarker-removebg-preview.png'; // Periférico desconectado
      case 3:
        return 'NoInternetMarker-removebg-preview.png'; // Sin Internet
      case 4:
        return 'NoMoneyMarker-removebg-preview.png'; // Sin dinero
      default:
        return 'AllMarker-removebg-preview.png'; // Todas
    }
  }

  /**
   * Click en marcador: carga transacciones
   */
  private async onMarkerClick(ubicacion: PayPad) {
    if (this.selectedPayPad()?.id !== ubicacion.id) {
      this.selectedPaymentType.set(null);
    }

    this.selectedPayPad.set(ubicacion);
    this.loading.set(true);
    this.error.set(null);
    this.transactions.set([]);

    (await this._api.GetTransactionsById(ubicacion.id)).subscribe({
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
      },
    });
  }

  // Helpers
  private num(v: any): number {
    const n = Number(v);
    return isNaN(n) ? n : 0;
  }

  // Map id -> marker
  private markersMap = new Map<number, MarkerWithUrl>();

  private mergeSubscriptions(): void {
    if (!this.subscriptions || !this.paypads.length) return;

    for (const s of this.subscriptions) {
      const p = this.paypads.find((pp) => pp.id === s.idPayPad);
      if (p) {
        if (s.idAlert == 1) {
          s.idAlert = 4;
        }
        p.status = s.idAlert;
      }
    }
  }

  private applyFilter(): void {
    this.filteredPaypads =
      this.filterState === -1
        ? this.paypads
        : this.paypads.filter((p) => p.status === this.filterState);
  }

  onSelectIdChange(id: number | '') {
    if (!id) return;
    const p = this.filteredPaypads?.find((pp) => pp.id === id);
    if (p) this.focusOnPaypad(p);
  }
}
    