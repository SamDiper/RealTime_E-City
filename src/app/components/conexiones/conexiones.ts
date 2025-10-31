import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { Api } from '../../../Services/apiService';
import { PayPad, PayPadResponse } from '../../../Interfaces/locations';
import { ToastService } from '../../../Services/toastService';

type FieldKey = 'anydesk' | 'teamviewer';

interface PaypadRow {
  id: number;
  username: string;
  anydesk: string;
  teamviewer: string;
  isEditing: boolean;
}

@Component({
  selector: 'app-conexiones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './conexiones.html',
  styleUrls: ['../../../output.css']
})
export class Conexiones implements OnInit {
  // Inyecciones
  private _api = inject(Api);
  private router = inject(Router);
  private toast = inject(ToastService);

  // Estado
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Filas de la tabla (vista)
  rows = signal<PaypadRow[]>([]);

  ngOnInit(): void {
    const user = localStorage.getItem('User');
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadPaypads();
  }

  loadPaypads(): void {
    this.loading.set(true);
    this.error.set(null);

    this._api.GetAllPaypads().subscribe({
      next: (res: PayPadResponse) => {
        const list: PayPad[] = res.response ?? [];
        const mapped: PaypadRow[] = list.map(p => ({
          id: p.id,
          username: p.username,
          anydesk: '1',     
          teamviewer: '1',  
          isEditing: false
        }));
        this.rows.set(mapped);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar paypads:', err);
        this.error.set('No fue posible cargar la lista de Pay+');
        this.loading.set(false);
      }
    });
  }

  startEdit(rowId: number) {
    this.rows.update(list =>
      list.map(r => r.id === rowId ? { ...r, isEditing: true } : r)
    );
  }

  saveRow(rowId: number) {
    const row = this.rows().find(r => r.id === rowId);
    if (!row) return;

    if (!row.isEditing) {
      this.toast.warning('Aviso', 'Primero pulsa "Editar"');
      return;
    }

    // this._api.UpdateRemoteCodes(row.id, { anydesk: row.anydesk, teamviewer: row.teamviewer }).subscribe( ... )

    // Simulamos guardado local
    this.rows.update(list =>
      list.map(r => r.id === rowId ? { ...r, isEditing: false } : r)
    );
    this.toast.success('Guardado', `Conexiones actualizadas para "${row.username}"`);
  }

  onChange(rowId: number, field: FieldKey, value: string) {
    this.rows.update(list =>
      list.map(r => r.id === rowId ? { ...r, [field]: value } as PaypadRow : r)
    );
  }

  openAnyDesk(row: PaypadRow) {
    if (!row.anydesk?.trim()) {
      this.toast.warning('Anydesk', 'No hay código de Anydesk');
      return;
    }
    this.toast.info('Anydesk', `Conectar a ${row.username} (código: ${row.anydesk})`);
  }

  openTeamViewer(row: PaypadRow) {
    if (!row.teamviewer?.trim()) {
      this.toast.warning('TeamViewer', 'No hay código de TeamViewer');
      return;
    }
    this.toast.info('TeamViewer', `Conectar a ${row.username} (código: ${row.teamviewer})`);
  }

  copyName(row: PaypadRow) {
    if (!navigator?.clipboard) {
      this.toast.warning('Aviso', 'Copiado no soportado en este navegador');
      return;
    }
    navigator.clipboard.writeText(row.username).then(() => {
      this.toast.success('Copiado', `Nombre copiado: ${row.username}`);
    }).catch(() => {
      this.toast.error('Error', 'No se pudo copiar el nombre');
    });
  }

  copyId(row: PaypadRow) {
    if (!navigator?.clipboard) {
      this.toast.warning('Aviso', 'Copiado no soportado en este navegador');
      return;
    }
    navigator.clipboard.writeText(String(row.id)).then(() => {
      this.toast.success('Copiado', `ID copiado: ${row.id}`);
    }).catch(() => {
      this.toast.error('Error', 'No se pudo copiar el ID');
    });
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }

  refresh() {
    this.toast.info('Actualizando', 'Obteniendo listado de Pay+');
    this.loadPaypads();
  }
}