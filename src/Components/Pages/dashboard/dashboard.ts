import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { PayPadResponse, PayPad } from '../../../Interfaces/locations';
import { Api } from '../../../Services/apiService';
import { Router } from '@angular/router';
import { Transaction, TransactionResponse } from '../../../Interfaces/transactions';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  private map: L.Map | undefined;
  private markers: L.Marker[] = [];
  private _api = inject(Api);
  paypads: PayPad[] = [];
  transactions: Transaction[] = [];
  contador:number=0;
  route = inject(Router);
  http = inject(HttpClient);
  _currentYear: number = new Date().getFullYear();
  _totalWhitDrawal:number=0;
  _totalTransactions:number=0;
  _totalPyas:number=0;
  idPayPad:number=20;

  
  Exit() {
    localStorage.clear();
    this.route.navigate(["/login"]);
  }
  
  ngOnInit(): void {
      let _user= localStorage.getItem("User");
      if(_user==null){
        this.Exit();
        return;
      }
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.cargarUbicaciones();
    this.cargarTransacciones();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
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
        this.paypads = data.response??[];
        console.log(this.paypads)
        this.addMarkers(this.paypads);
      },
      error: (err) => console.error('Error al cargar ubicaciones:', err)
    });
  }

    private cargarTransacciones(): void {
    this._api.GetAllTransactions(this.idPayPad).subscribe({
      next: (data: TransactionResponse) => {
        this.transactions = data.response??[];
        console.log(this.paypads)
        this.addMarkers(this.paypads);
      },
      error: (err) => console.error('Error al cargar ubicaciones:', err)
    });
  }

  private addMarkers(ubicaciones: PayPad[]): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    ubicaciones.forEach(ubicacion => {
    const lat = ubicacion.latitude;
    const lng = ubicacion.longitude;


    // console.log(ubicacion.id," | ",ubicacion.username," | Longitud: ",Number(ubicacion.longitude),"| Latitud: ",Number(ubicacion.latitude));

    // Filtra inválidos y 0,0 (si aplica)
    // if (!this.isValidLat(Number(lat)) || !this.isValidLng(Number(lng))) return;
    // if (Number(lat) === 0 && Number(lng) === 0) return;
    var markerIcn = ""
        switch (ubicacion.status) {
          case 1:
            markerIcn = "https://maps.google.com/mapfiles/ms/icons/green.png";
            break;
          case 0:
            markerIcn = "https://maps.google.com/mapfiles/ms/icons/red.png";
            this.contador++;

            break;
          default:
            markerIcn = "https://maps.google.com/mapfiles/ms/icons/blue.png";
            break;            
        }
      const markerIcon = L.icon({

        iconUrl: markerIcn, 
        iconSize: [30, 30],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
      
      const marker = L.marker([Number(ubicacion.longitude),Number(ubicacion.latitude)], { icon: markerIcon })
        .addTo(this.map!)
        .bindPopup(`<b>${ubicacion.id}</b><br>
                    <b>${ubicacion.username}</b><br>
                    <b>Latitud ${ubicacion.latitude}</b><br>
                    <b>Longitud ${ubicacion.longitude}</b>
          `);

      this.markers.push(marker);
    });
    console.log(this.contador);

  }
  
}

