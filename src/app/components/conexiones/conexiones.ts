import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { PayPad, PayPadResponse } from '../../../Interfaces/locations';
import { Api } from '../../../Services/apiService';
import { ToastService } from '../../../Services/toastService';
import { 
  Conexion, 
  ConexionesResponse, 
  PaypadGroup,
  ConexionDto,
  ConexionSingleResponse
} from '../../../Interfaces/conexiones';

@Component({
  selector: 'app-conexiones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conexiones.html',
  styleUrls: ['../../../output.css']
})
export class Conexiones implements OnInit {
  private _api = inject(Api);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  showModal = signal<boolean>(false);

  conexiones = signal<Conexion[]>([]);
  paypads = signal<PayPad[]>([]); 

  private excludedPayPadNames = ['Pay+ Prueba1'];

  formData = signal<Partial<ConexionDto>>({
    id: 0,
    idUserCreated: 1,
    userCreated: 'Admin',
    dateCreated: new Date().toISOString(),
    idUserUpdated: 1,
    userUpdated: 'Admin',
    dateUpdated: new Date().toISOString(),
    idPaypad: 0, 
    paypad: '',
    name: '',
    userName: '',
    pwd: '',
    description: '',
    icon: ''
  });

  // ✅ Filtrar PayPads excluyendo los de prueba
  paypadsFiltrados = computed(() => {
    return this.paypads().filter(p => 
      !this.excludedPayPadNames.includes(p.username)
    );
  });

  // ✅ CORREGIDO: Agrupar SOLO por idPaypad y obtener nombre de la lista de PayPads
  gruposPorPaypad = computed<PaypadGroup[]>(() => {
    const data = this.conexiones();
    const paypadsList = this.paypads();
    const grupos: Record<number, PaypadGroup> = {};

    data.forEach(conexion => {
      const idPaypad = conexion.idPaypad || 0;
      
      if (!grupos[idPaypad]) {
        // 🔥 BUSCAR el nombre del PayPad en la lista cargada
        const paypadInfo = paypadsList.find(p => p.id === idPaypad);
        
        grupos[idPaypad] = {
          paypad: paypadInfo ? paypadInfo.username : `PayPad ${idPaypad}`,
          idPaypad: idPaypad,
          conexiones: []
        };
      }
      
      grupos[idPaypad].conexiones.push(conexion);
    });

    return Object.values(grupos).sort((a, b) => {
      if (a.idPaypad === 0) return 1;
      if (b.idPaypad === 0) return -1;
      return a.paypad.localeCompare(b.paypad);
    });
  });

  ngOnInit(): void {
    const user = localStorage.getItem('User');
    
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.cargarPaypads();
    this.cargarConexiones();
  }

  cargarPaypads() {
    this._api.GetAllPaypads().subscribe({
      next: (res: PayPadResponse) => {
        if (res.statusCode === 200 && res.response) {
          this.paypads.set(res.response); 
          console.log('✅ PayPads cargados:', res.response.length);
        } else {
          console.warn('⚠️ No se pudieron cargar PayPads');
        }
      },
      error: (err) => {
        this.toast.error('Error', 'No se pudieron cargar los PayPads');
      }
    });
  }

  cargarConexiones() {
    this.loading.set(true);
    this.error.set(null);

    this._api.GetAllConexiones().subscribe({
      next: (res: ConexionesResponse) => {
        if (res.statusCode === 200) {
          const conexionesConEdicion = res.response.map(c => ({
            ...c,
            isEditing: false
          }));
          
          this.conexiones.set(conexionesConEdicion);
          this.toast.success('Éxito', `${res.response.length} conexiones cargadas`);
          
          // 🔍 DEBUG: Ver cómo vienen los datos
          console.log('📊 Conexiones cargadas:', res.response);
        } else {
          this.error.set(res.message);
          this.toast.error('Error', res.message);
        }
        
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Error', 'No se pudieron cargar las conexiones');
        this.loading.set(false);
      }
    });
  }

  abrirModal() {
    this.resetFormData();
    this.showModal.set(true);
  }

  cerrarModal() {
    this.showModal.set(false);
    this.resetFormData();
  }

  // ✅ Función para seleccionar PayPad
  seleccionarPaypad(event: Event) {
    const select = event.target as HTMLSelectElement;
    const idPaypad = parseInt(select.value);
    
    if (!idPaypad || idPaypad === 0) {
      this.actualizarFormData('idPaypad', 0);
      this.actualizarFormData('paypad', '');
      return;
    }

    const paypadSeleccionado = this.paypads().find(p => p.id === idPaypad);
    
    if (paypadSeleccionado) {
      this.actualizarFormData('idPaypad', paypadSeleccionado.id);
      this.actualizarFormData('paypad', paypadSeleccionado.username);
      
      console.log('✅ PayPad seleccionado:', {
        id: paypadSeleccionado.id,
        username: paypadSeleccionado.username
      });
    }
  }

  crearConexion() {
    const data = this.formData();
    
    // Validaciones
    if (!data.idPaypad || data.idPaypad === 0) {
      this.toast.warning('Validación', 'Debes seleccionar un PayPad');
      return;
    }

    if (!data.name) {
      this.toast.warning('Validación', 'Debes seleccionar el tipo de conexión');
      return;
    }

    if (!data.description) {
      this.toast.warning('Validación', 'Debes ingresar el código de conexión');
      return;
    }

    this.loading.set(true);

    // 🔥 ASEGURAR que se envíe el username del PayPad
    const paypadSeleccionado = this.paypads().find(p => p.id === data.idPaypad);
    
    const payload: ConexionDto = {
      id: 0,
      idUserCreated: 1,
      userCreated: 'Admin',
      dateCreated: new Date().toISOString(),
      idUserUpdated: 1,
      userUpdated: 'Admin',
      dateUpdated: new Date().toISOString(),
      idPaypad: data.idPaypad,
      paypad: paypadSeleccionado ? paypadSeleccionado.username : '', // 🔥 FORZAR el username
      name: data.name || '',
      userName: data.userName || '',
      pwd: data.pwd || '',
      description: data.description || '',
      icon: data.icon || ''
    };

    console.log('📤 Enviando payload:', payload);

    this._api.CreateConexion(payload).subscribe({
      next: (res: ConexionSingleResponse) => {
        if (res.statusCode === 200) {
          this.conexiones.update(list => [...list, { ...res.response, isEditing: false }]);
          this.toast.success('Creado', 'Conexión creada exitosamente');
          this.cerrarModal();
        } else {
          this.toast.error('Error', res.message);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Error al crear conexión:', err);
        this.toast.error('Error', 'No se pudo crear la conexión');
        this.loading.set(false);
      }
    });
  }

  habilitarEdicion(id: number) {
    this.conexiones.update(list =>
      list.map(c => ({
        ...c,
        isEditing: c.id === id ? true : c.isEditing
      }))
    );
  }

  cancelarEdicion(id: number) {
    this.conexiones.update(list =>
      list.map(c => ({
        ...c,
        isEditing: c.id === id ? false : c.isEditing
      }))
    );
    
    this.cargarConexiones();
  }

  actualizarValor(id: number, campo: keyof Conexion, valor: string) {
    this.conexiones.update(list =>
      list.map(c => 
        c.id === id ? { ...c, [campo]: valor } : c
      )
    );
  }

  guardarConexion(conexion: Conexion) {
    if (!conexion.isEditing) {
      this.toast.warning('Aviso', 'Primero habilita la edición');
      return;
    }

    this.loading.set(true);

    // 🔥 ASEGURAR que se envíe el username del PayPad al actualizar
    const paypadSeleccionado = this.paypads().find(p => p.id === conexion.idPaypad);

    const payload: ConexionDto = {
      id: conexion.id,
      idUserCreated: conexion.idUserCreated,
      userCreated: conexion.userCreated || 'Admin',
      dateCreated: conexion.dateCreated,
      idUserUpdated: 1,
      userUpdated: 'Admin',
      dateUpdated: new Date().toISOString(),
      idPaypad: conexion.idPaypad,
      paypad: paypadSeleccionado ? paypadSeleccionado.username : '', // 🔥 FORZAR el username
      name: conexion.name,
      userName: conexion.userName,
      pwd: conexion.pwd,
      description: conexion.description,
      icon: conexion.icon
    };

    this._api.UpdateConexion(payload).subscribe({
      next: (res: ConexionSingleResponse) => {
        if (res.statusCode === 200) {
          this.conexiones.update(list =>
            list.map(c => 
              c.id === conexion.id 
                ? { ...res.response, isEditing: false } 
                : c
            )
          );
          
          this.toast.success('Guardado', 'Conexión actualizada exitosamente');
        } else {
          this.toast.error('Error', res.message);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Error', 'No se pudo guardar la conexión');
        this.loading.set(false);
      }
    });
  }

  eliminarConexion(id: number, nombre: string) {
    if (!confirm(`¿Estás seguro de eliminar la conexión "${nombre}"?`)) {
      return;
    }

    this.loading.set(true);

    this._api.DeleteConexion(id).subscribe({
      next: (res: ConexionSingleResponse) => {
        if (res.statusCode === 200) {
          this.conexiones.update(list => list.filter(c => c.id !== id));
          this.toast.success('Eliminado', `Conexión "${nombre}" eliminada`);
        } else {
          this.toast.error('Error', res.message);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Error', 'No se pudo eliminar la conexión');
        this.loading.set(false);
      }
    });
  }

  // 🔍 FUNCIÓN DE DEBUG para ver los datos
  debugConexiones() {
    console.log('🔍 DEBUG - Conexiones:', this.conexiones());
    console.log('🔍 DEBUG - PayPads:', this.paypads());
    console.log('🔍 DEBUG - Grupos:', this.gruposPorPaypad());
  }

  // ========== UTILIDADES ==========

  actualizarFormData(campo: keyof ConexionDto, valor: any) {
    this.formData.update(f => ({ ...f, [campo]: valor }));
  }

  resetFormData() {
    this.formData.set({
      id: 0,
      idUserCreated: 1,
      userCreated: 'Admin',
      dateCreated: new Date().toISOString(),
      idUserUpdated: 1,
      userUpdated: 'Admin',
      dateUpdated: new Date().toISOString(),
      idPaypad: 0,
      paypad: '',
      name: '',
      userName: '',
      pwd: '',
      description: '',
      icon: ''
    });
  }

  copiarCodigo(texto: string, tipo: string) {
    if (!navigator?.clipboard) {
      this.toast.warning('Aviso', 'Copiado no soportado');
      return;
    }

    navigator.clipboard.writeText(texto).then(() => {
      this.toast.info(tipo, `Código copiado: ${texto}`);
    }).catch(() => {
      this.toast.error('Error', 'No se pudo copiar');
    });
  }

  refresh() {
    this.toast.info('Actualizando', 'Recargando conexiones...');
    this.cargarConexiones();
  }
}