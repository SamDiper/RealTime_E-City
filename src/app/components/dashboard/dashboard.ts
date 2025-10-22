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
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Api } from '../../../Services/apiService';
import {
  PayPadResponse,
  PayPad,
  SubscriptionResponse,
  PaypadAlert,
} from '../../../Interfaces/locations';
import { Transaction, TransactionResponse } from '../../../Interfaces/transactions';
import { PollingService } from '../../../Services/pollingService';
import { ToastService } from '../../../Services/toastService';

type PaymentOption = { label: string; value: string | null };
type MarkerWithUrl = L.Marker & { customIconUrl: string; paypadId: number };

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
  pollingService = inject(PollingService);
  toastService = inject(ToastService);

  _currentYear: number = new Date().getFullYear();

  private defaultIconSize: [number, number] = [30, 30];
  private bigIconSize: [number, number] = [50, 50];
  private currentFocusedMarkerId: number | null = null;

  paypads: PayPad[] = [];
  subscriptions: PaypadAlert[] = [];
  filteredPaypads: PayPad[] = [];

  private filterState = -1;

  selectedPayPad = signal<PayPad | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  showModal = signal(false);

  transactions = signal<Transaction[]>([]);
  cantIniciada = 0;
  cantCancelada = 0;
  cantAprobada = 0;
  totalAmount = 0;

  selectedPaymentType = signal<string | null>(null);

  paymentTypeOptions = computed<PaymentOption[]>(() => {
    const txs = this.transactions();
    if (!txs.length) return [{ label: 'Todos', value: null }];
    const unique = Array.from(new Set(txs.map((t) => t.typePayment).filter(Boolean)));
    return [{ label: 'Todos', value: null }, ...unique.map((v) => ({ label: v!, value: v! }))];
  });

  filteredTransactions = computed<Transaction[]>(() => {
    this.cantAprobada = 0;
    this.cantCancelada = 0;
    this.cantIniciada = 0;
    this.totalAmount = 0;

    const type = this.selectedPaymentType();
    const txs = this.transactions();
    const list = type ? txs.filter((t) => t.typePayment === type) : txs;

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

  totalTransacciones = computed(() => this.filteredTransactions().length);
  totalRecaudado = computed(() =>
    this.filteredTransactions().reduce((acc, t) => acc + this.num(t.incomeAmount ?? 0), 0)
  );
  totalRetirado = computed(() =>
    this.filteredTransactions().reduce((acc, t) => acc + this.num(t.returnAmount ?? 0), 0)
  );

  ngOnInit(): void {
    const _user = localStorage.getItem('User');
    if (_user == null) {
      this.Exit();
      return;
    }
    
    this.cargarUbicaciones();
    this.startRealtimeMonitoring();
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
    this.pollingService.stopPolling(); 
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
    this.deselectPaypad();
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
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
  }

  private async cargarUbicaciones(): Promise<void> {
    try {
      const paypads$ = await this._api.GetAllPaypads();
      const subs$ = await this._api.GetAllSubscriptions();

      forkJoin([paypads$, subs$]).subscribe({
        next: ([paypadsRes, subsRes]: [PayPadResponse, SubscriptionResponse]) => {
          this.paypads = paypadsRes.response ?? [];
          this.subscriptions = subsRes.response ?? [];

          this.mergeSubscriptions();
          this.applyFilter();
          this.redrawMarkers();

        },
        error: (err) => {
          console.error('Error al cargar paypads o subscriptions:', err);
        },
      });
    } catch (err) {
      console.error('Error en cargarUbicaciones:', err);
    }
    
  }

  private redrawMarkers(): void {
    if (!this.map) return;

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
          className: `marker-wrapper transition-all duration-300 ${ubicacion.status !== 1 ? 'bounce' : ''}`,
          html: `<img src="${iconUrl}" alt="paypad" class="marker-icon transition-all duration-300" style="width:30px;height:30px;" />`,
          iconSize: this.defaultIconSize,
          iconAnchor: [15, 30],
        }),
        title: ubicacion.username,
      }) as MarkerWithUrl;

      marker.customIconUrl = iconUrl;
      marker.paypadId = ubicacion.id;

      marker.on('click', () => this.zone.run(() => this.onMarkerClick(ubicacion)));

      marker.addTo(this.map);
      this.markers.push(marker);
      this.markersMap.set(ubicacion.id, marker);
    }
  }

  focusOnPaypad(paypad: PayPad) {
    this.selectedPayPad.set(paypad);
    
    this.resetAllMarkersSize();

    const marker = this.markersMap.get(paypad.id);
    if (marker) {
      this.enlargeMarker(marker);
      
      this.currentFocusedMarkerId = paypad.id;

      this.map?.flyTo(
        [Number(paypad.longitude), Number(paypad.latitude)], 
        16, // zoom level
        {
          animate: true,
          duration: 0.8, 
          easeLinearity: 0.1,
        }
      );
    }
  }

  deselectPaypad() {
    this.selectedPayPad.set(null);
    this.resetAllMarkersSize();
    this.currentFocusedMarkerId = null;
    
    this.map?.flyTo([4.59806, -74.0758], 5, {
      animate: true,
      duration: 1.5,
      easeLinearity: 0.25,
    });
  }

  private iconForStatus(status?: number): string {
    switch (status) {
      case 1:
        return 'ActiveMarker-removebg-preview.png';
      case 0:
        return 'offMarker-removebg-preview.png';
      case 2:
        return 'NoConnectionMarker-removebg-preview.png';
      case 3:
        return 'NoInternetMarker-removebg-preview.png';
      case 4:
        return 'NoMoneyMarker-removebg-preview.png';
      default:
        return 'AllMarker-removebg-preview.png';
    }
  }

  private async onMarkerClick(ubicacion: PayPad) {
    if (this.selectedPayPad()?.id !== ubicacion.id) {
      this.selectedPaymentType.set(null);
    }

    this.selectedPayPad.set(ubicacion);
    
    this.resetAllMarkersSize();
    const marker = this.markersMap.get(ubicacion.id);
    if (marker) {
      this.enlargeMarker(marker);
      this.currentFocusedMarkerId = ubicacion.id;
    }

    await this.fetchTransactions(ubicacion.id);
  }

  private async fetchTransactions(paypadId: number) {
    this.loading.set(true);
    this.error.set(null);
    this.transactions.set([]);
    this.showModal.set(true);

    (await this._api.GetTransactionsById(paypadId)).subscribe({
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

  closeModal() {
    this.showModal.set(false);
  }

  private enlargeMarker(marker: MarkerWithUrl) {
    const icon = marker.getIcon() as L.DivIcon;
    const newIcon = L.divIcon({
      className: icon.options.className,
      html: `<img src="${marker.customIconUrl}" alt="paypad" class="marker-icon transition-all duration-300" style="width:${this.bigIconSize[0]}px;height:${this.bigIconSize[1]}px;" />`,
      iconSize: this.bigIconSize,
      iconAnchor: [this.bigIconSize[0] / 2, this.bigIconSize[1]],
    });
    marker.setIcon(newIcon);
  }

  private resetAllMarkersSize() {
    this.markers.forEach((marker) => {
      const icon = marker.getIcon() as L.DivIcon;
      const newIcon = L.divIcon({
        className: icon.options.className,
        html: `<img src="${marker.customIconUrl}" alt="paypad" class="marker-icon transition-all duration-300" style="width:${this.defaultIconSize[0]}px;height:${this.defaultIconSize[1]}px;" />`,
        iconSize: this.defaultIconSize,
        iconAnchor: [this.defaultIconSize[0] / 2, this.defaultIconSize[1]],
      });
      marker.setIcon(newIcon);
    });
  }

  private num(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  private markersMap = new Map<number, MarkerWithUrl>();

  private mapAlertToStatus(idAlert: number): number {
    if (idAlert === 1) return 4;
    return idAlert;
  }

  private mergeSubscriptions(): void {
    if (!this.subscriptions || !this.subscriptions.length || !this.paypads.length) return;

    const alertsByPaypad = new Map<number, PaypadAlert[]>();
    for (const s of this.subscriptions) {
      if (!s.idPayPad) continue;
      const arr = alertsByPaypad.get(s.idPayPad) ?? [];
      arr.push(s);
      alertsByPaypad.set(s.idPayPad, arr);
    }

    for (const p of this.paypads) {
      const alerts = alertsByPaypad.get(p.id);
      if (!alerts || !alerts.length) continue;

      const chosenAlert = alerts[alerts.length - 1];
      p.status = this.mapAlertToStatus(chosenAlert.idAlert);
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

  lastPollingTime = signal<Date>(new Date());
  isPolling = signal<boolean>(false);

  private startRealtimeMonitoring() {
    this.pollingService.subscriptions$.subscribe({
      next: (subs) => {
        this.lastPollingTime.set(new Date()); 
        this.subscriptions = subs;
        this.mergeSubscriptions();
        this.applyFilter();
        this.redrawMarkers();
      }
    });

    this.isPolling.set(true);
    this.pollingService.startSubscriptionsPolling(60000);
  
  }
  
}