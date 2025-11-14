import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

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
export class Conexiones implements OnInit, OnDestroy {
  private _api = inject(Api);
  private router = inject(Router);
  private toast = inject(ToastService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // ========== SIGNALS ==========
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  showModal = signal<boolean>(false);
  conexiones = signal<Conexion[]>([]);
  paypads = signal<PayPad[]>([]); 
  terminoBusqueda = signal<string>('');

  // ========== CONSTANTES ==========
  private readonly EXCLUDED_PAYPAD_NAMES = ['Pay+ Prueba1'];
  private readonly EMPTY_FORM: ConexionDto = {
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
  };

  formData = signal<ConexionDto>({ ...this.EMPTY_FORM });

  // ========== COMPUTED SIGNALS ==========

  paypadsFiltrados = computed(() => {
    return this.paypads().filter(p => 
      !this.EXCLUDED_PAYPAD_NAMES.includes(p.username)
    );
  });

  gruposPorPaypadCompleto = computed<PaypadGroup[]>(() => {
    const data = this.conexiones();
    const grupos: Record<string, PaypadGroup> = {};

    data.forEach(conexion => {
      const paypadNombre = conexion.paypad || 'Sin PayPad';
      const idPaypad = conexion.idPaypad || 0;
      const claveGrupo = `${idPaypad}|${paypadNombre}`;
      
      if (!grupos[claveGrupo]) {
        grupos[claveGrupo] = {
          paypad: paypadNombre,
          idPaypad: idPaypad,
          conexiones: []
        };
      }
      
      grupos[claveGrupo].conexiones.push(conexion);
    });

    return Object.values(grupos).sort((a, b) => {
      if (a.paypad === 'Sin PayPad') return 1;
      if (b.paypad === 'Sin PayPad') return -1;
      return a.paypad.localeCompare(b.paypad);
    });
  });

  gruposPorPaypad = computed<PaypadGroup[]>(() => {
    const grupos = this.gruposPorPaypadCompleto();
    const termino = this.terminoBusqueda().toLowerCase().trim();

    if (!termino) return grupos;

    return grupos.map(grupo => {
      const conexionesFiltradas = grupo.conexiones.filter(conexion => {
        return (
          grupo.paypad.toLowerCase().includes(termino) ||
          conexion.name.toLowerCase().includes(termino) ||
          conexion.description.toLowerCase().includes(termino) ||
          (conexion.userName && conexion.userName.toLowerCase().includes(termino)) ||
          (conexion.pwd && conexion.pwd.toLowerCase().includes(termino))
        );
      });

      return { ...grupo, conexiones: conexionesFiltradas };
    }).filter(grupo => grupo.conexiones.length > 0);
  });

  totalResultados = computed(() => {
    return this.gruposPorPaypad().reduce((total, grupo) => 
      total + grupo.conexiones.length, 0
    );
  });

  // ========== LIFECYCLE ==========

  ngOnInit(): void {
    const user = localStorage.getItem('User');
    
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.inicializarBusqueda();
    this.cargarPaypads();
    this.cargarConexiones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  // ========== BÚSQUEDA ==========

  private inicializarBusqueda(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(termino => {
      this.terminoBusqueda.set(termino);
    });
  }

  actualizarBusqueda(termino: string): void {
    this.searchSubject.next(termino);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
    this.searchSubject.next('');
  }

  // ========== CARGA DE DATOS ==========

  cargarPaypads(): void {
    this._api.GetAllPaypads()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: PayPadResponse) => {
          if (res.statusCode === 200 && res.response) {
            this.paypads.set(res.response);
            console.log('📦 PayPads cargados:', res.response.length);
          }
        },
        error: (err) => {
          console.error('❌ Error al cargar PayPads:', err);
          this.toast.error('Error', 'No se pudieron cargar los PayPads');
        }
      });
  }

  cargarConexiones(): void {
    this.loading.set(true);
    this.error.set(null);

    this._api.GetAllConexiones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: ConexionesResponse) => {
          if (res.statusCode === 200) {
            const conexionesConEdicion = res.response.map(c => ({
              ...c,
              isEditing: false
            }));
            
            this.conexiones.set(conexionesConEdicion);
            this.toast.success('Éxito', `${res.response.length} conexiones cargadas`);
            console.log('📊 Conexiones cargadas:', res.response.length);
          } else {
            this.error.set(res.message);
            this.toast.error('Error', res.message);
          }
          
          this.loading.set(false);
        },
        error: (err) => {
          console.error('❌ Error al cargar conexiones:', err);
          this.toast.error('Error', 'No se pudieron cargar las conexiones');
          this.loading.set(false);
        }
      });
  }

  // ========== MODAL ==========

  abrirModal(): void {
    this.resetFormData();
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
    this.resetFormData();
  }

  // ========== 🔥 PARSER DE FORMATO "Nombre | ID" ==========

  actualizarPaypad(valor: string): void {
    // Si está vacío, limpiar
    if (!valor || valor.trim() === '') {
      this.formData.update(f => ({ ...f, paypad: '', idPaypad: 0 }));
      console.log('🔄 PayPad limpiado');
      return;
    }

    const valorTrimmed = valor.trim();
    console.log('🔍 Procesando PayPad:', valorTrimmed);
    
    // 🔥 DETECTAR FORMATO: "Nombre | ID"
    if (valorTrimmed.includes('|')) {
      const partes = valorTrimmed.split('|').map(p => p.trim());
      
      if (partes.length >= 2) {
        const nombre = partes[0];
        const idStr = partes[1];
        const id = parseInt(idStr, 10);
        
        if (nombre && !isNaN(id) && id > 0) {
          // ✅ Formato válido: "Nombre | 123"
          console.log('✅ Formato pipe detectado:', { nombre, id });
          
          this.formData.update(f => ({ 
            ...f, 
            paypad: nombre,
            idPaypad: id 
          }));
          
          this.toast.success('PayPad', `Formato detectado: ${nombre} (ID: ${id})`);
          console.log('📋 FormData actualizado:', this.formData());
          return;
        } else {
          console.warn('⚠️ Formato pipe inválido - ID debe ser número > 0');
        }
      }
    }
    
    // Si no tiene |, buscar en la lista de PayPads
    const paypadEncontrado = this.paypads().find(
      p => p.username.toLowerCase() === valorTrimmed.toLowerCase()
    );
    
    if (paypadEncontrado) {
      // ✅ PayPad encontrado en la lista
      console.log('✅ PayPad encontrado en lista:', paypadEncontrado);
      
      this.formData.update(f => ({ 
        ...f, 
        paypad: paypadEncontrado.username,
        idPaypad: paypadEncontrado.id 
      }));
      
      this.toast.success('PayPad', `Seleccionado: ${paypadEncontrado.username}`);
      console.log('📋 FormData actualizado:', this.formData());
    } else {
      // ⚠️ Texto libre sin ID
      console.log('⚠️ Texto libre (no existe en lista):', valorTrimmed);
      
      this.formData.update(f => ({ 
        ...f, 
        paypad: valorTrimmed,
        idPaypad: 0 
      }));
      
      this.toast.warning('PayPad Nuevo', 'Este PayPad no existe (idPaypad = 0)');
      console.log('📋 FormData actualizado:', this.formData());
    }
  }

  // ========== VALIDACIONES ==========

  private validarFormulario(): { valido: boolean; errores: string[] } {
    const data = this.formData();
    const errores: string[] = [];

    console.log('🔍 Validando formulario completo:', {
      paypad: data.paypad,
      idPaypad: data.idPaypad,
      name: data.name,
      description: data.description
    });

    if (!data.paypad || data.paypad.trim() === '') {
      errores.push('El nombre del PayPad es obligatorio');
    }

    if (!data.name || data.name.trim() === '') {
      errores.push('El tipo de conexión es obligatorio');
    }

    if (!data.description || data.description.trim() === '') {
      errores.push('El código de conexión es obligatorio');
    }

    if (data.description && data.description.length > 500) {
      errores.push('El código de conexión es demasiado largo (máx. 500 caracteres)');
    }

    console.log(errores.length === 0 ? '✅ Validación OK' : '❌ Errores:', errores);

    return { valido: errores.length === 0, errores };
  }

  // ========== CRUD: CREAR ==========

  crearConexion(): void {
    const validacion = this.validarFormulario();
    
    if (!validacion.valido) {
      validacion.errores.forEach(err => 
        this.toast.warning('Validación', err)
      );
      return;
    }

    const data = this.formData();
    this.loading.set(true);

    // 🔥 PAYLOAD CON VALORES GARANTIZADOS
    const payload: ConexionDto = {
      id: 0,
      idUserCreated: 1,
      userCreated: 'Admin',
      dateCreated: new Date().toISOString(),
      idUserUpdated: 1,
      userUpdated: 'Admin',
      dateUpdated: new Date().toISOString(),
      idPaypad: data.idPaypad || 0,
      paypad: (data.paypad || '').trim(),
      name: (data.name || '').trim(),
      userName: (data.userName || '').trim(),
      pwd: (data.pwd || '').trim(),
      description: (data.description || '').trim(),
      icon: (data.icon || '').trim()
    };

    console.log('📤 PAYLOAD A ENVIAR:');
    console.log(JSON.stringify(payload, null, 2));

    this._api.CreateConexion(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: ConexionSingleResponse) => {
          if (res.statusCode === 200) {
            console.log('✅ Conexión creada exitosamente:', res.response);
            
            this.conexiones.update(list => [
              ...list, 
              { ...res.response, isEditing: false }
            ]);
            
            this.toast.success('Creado', 'Conexión creada exitosamente');
            this.cerrarModal();
          } else {
            console.error('⚠️ Error en respuesta:', res);
            this.toast.error('Error', res.message);
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('❌ Error HTTP:', err);
          this.toast.error('Error', 'No se pudo crear la conexión');
          this.loading.set(false);
        }
      });
  }

  // ========== EDICIÓN ==========

  habilitarEdicion(id: number): void {
    this.conexiones.update(list =>
      list.map(c => ({ ...c, isEditing: c.id === id }))
    );
  }

  cancelarEdicion(id: number): void {
    this.conexiones.update(list =>
      list.map(c => ({
        ...c,
        isEditing: c.id === id ? false : c.isEditing
      }))
    );
    this.cargarConexiones();
  }

  actualizarValor(id: number, campo: keyof Conexion, valor: string): void {
    this.conexiones.update(list =>
      list.map(c => 
        c.id === id ? { ...c, [campo]: valor } : c
      )
    );
  }

  guardarConexion(conexion: Conexion): void {
    if (!conexion.isEditing) {
      this.toast.warning('Aviso', 'Primero habilita la edición');
      return;
    }

    this.loading.set(true);

    const payload: ConexionDto = {
      id: conexion.id,
      idUserCreated: conexion.idUserCreated,
      userCreated: conexion.userCreated || 'Admin',
      dateCreated: conexion.dateCreated,
      idUserUpdated: 1,
      userUpdated: 'Admin',
      dateUpdated: new Date().toISOString(),
      idPaypad: conexion.idPaypad || 0,
      paypad: (conexion.paypad || '').trim(),
      name: (conexion.name || '').trim(),
      userName: (conexion.userName || '').trim(),
      pwd: (conexion.pwd || '').trim(),
      description: (conexion.description || '').trim(),
      icon: (conexion.icon || '').trim()
    };


    this._api.UpdateConexion(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
          console.error('❌ Error al actualizar:', err);
          this.toast.error('Error', 'No se pudo guardar la conexión');
          this.loading.set(false);
        }
      });
  }

  // ========== ELIMINAR ==========

  eliminarConexion(id: number, nombre: string): void {
    if (!confirm(`¿Estás seguro de eliminar la conexión "${nombre}"?`)) {
      return;
    }

    this.loading.set(true);

    this._api.DeleteConexion(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
          console.error('❌ Error al eliminar:', err);
          this.toast.error('Error', 'No se pudo eliminar la conexión');
          this.loading.set(false);
        }
      });
  }

  // ========== UTILIDADES ==========

  actualizarFormData(campo: keyof ConexionDto, valor: any): void {
    this.formData.update(f => ({ ...f, [campo]: valor || '' }));
  }

  resetFormData(): void {
    this.formData.set({ ...this.EMPTY_FORM });
    console.log('🔄 Formulario reseteado');
  }

  copiarCodigo(texto: string, tipo: string): void {
    if (!navigator?.clipboard) {
      this.toast.warning('Aviso', 'Copiado no soportado');
      return;
    }

    navigator.clipboard.writeText(texto)
      .then(() => {
        const textoCorto = texto.length > 50 
          ? texto.substring(0, 50) + '...' 
          : texto;
        this.toast.info(tipo, `Copiado: ${textoCorto}`);
      })
      .catch((err) => {
        console.error('❌ Error al copiar:', err);
        this.toast.error('Error', 'No se pudo copiar');
      });
  }

  refresh(): void {
    this.toast.info('Actualizando', 'Recargando conexiones...');
    this.cargarConexiones();
  }
}