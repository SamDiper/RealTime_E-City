import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { PayPad } from '../../../Interfaces/locations';
import { Api } from '../../../Services/apiService';
import { ToastService } from '../../../Services/toastService';
import { 
  Conexion, 
  PaypadGroup,
  ConexionDto,
  ConexionSingleResponse
} from '../../../Interfaces/conexiones';
import { conexionesQuemadas } from '../../../Services/conexionesQuemadas';

@Component({
  selector: 'app-conexiones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conexiones.html',
  styleUrls: ['../../../output.css']
})
export class Conexiones implements OnInit, OnDestroy {
  //  INYECCIONES 
  private _api = inject(Api);
  private router = inject(Router);
  private toast = inject(ToastService);
  private sanitizer = inject(DomSanitizer);
  private mockConexiones = inject(conexionesQuemadas);

  //  SUBJECTS 
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  //  SIGNALS DE ESTADO 
  loading = signal(false);
  error = signal<string | null>(null);
  showModal = signal(false);
  showVideoModal = signal(false);
  videoUrl = signal('');
  videoTitle = signal('');
  terminoBusqueda = signal('');

  //  SIGNALS DE DATOS 
  private conexionesRealesRaw = signal<Conexion[]>([]);
  private paypadsRaw = signal<PayPad[]>([]);
  formData = signal<ConexionDto>(this.getEmptyForm());

  //  CONSTANTES 
  private readonly EXCLUDED_PAYPAD_NAMES = ['Pay+ Prueba1'];

  //  COMPUTED 
  
  safeVideoUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.videoUrl();
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  private paypadMap = computed(() => {
    const map = new Map<number, string>();
    this.paypadsRaw().forEach(p => {
      if (!this.EXCLUDED_PAYPAD_NAMES.includes(p.username)) {
        map.set(p.id, p.username);
      }
    });
    return map;
  });

  paypadsFiltrados = computed(() => 
    this.paypadsRaw().filter(p => !this.EXCLUDED_PAYPAD_NAMES.includes(p.username))
  );

  private conexionesRaw = computed(() => [
    ...this.conexionesRealesRaw(),
    ...this.mockConexiones.getMockConexiones() as Conexion[]
  ]);

  conexiones = computed(() => {
    const paypadMap = this.paypadMap();
    return this.conexionesRaw().map(conexion => ({
      ...conexion,
      paypad: conexion.paypad || paypadMap.get(conexion.idPaypad) || null
    }));
  });

  gruposPorPaypadCompleto = computed<PaypadGroup[]>(() => {
    const grupos = new Map<string, PaypadGroup>();

    this.conexiones().forEach(conexion => {
      const paypadNombre = conexion.paypad || 'Sin PayPad';
      const idPaypad = conexion.idPaypad || 0;
      const claveGrupo = `${idPaypad}|${paypadNombre}`;
      
      if (!grupos.has(claveGrupo)) {
        grupos.set(claveGrupo, { paypad: paypadNombre, idPaypad, conexiones: [] });
      }
      grupos.get(claveGrupo)!.conexiones.push(conexion);
    });

    return Array.from(grupos.values()).sort((a, b) => {
      if (a.paypad === 'Sin PayPad') return 1;
      if (b.paypad === 'Sin PayPad') return -1;
      return a.paypad.localeCompare(b.paypad);
    });
  });

  gruposPorPaypad = computed<PaypadGroup[]>(() => {
    const grupos = this.gruposPorPaypadCompleto();
    const termino = this.terminoBusqueda().toLowerCase().trim();

    if (!termino) return grupos;

    return grupos
      .map(grupo => ({
        ...grupo,
        conexiones: grupo.conexiones.filter(conexion => 
          grupo.paypad.toLowerCase().includes(termino) ||
          conexion.name.toLowerCase().includes(termino) ||
          conexion.description.toLowerCase().includes(termino) ||
          conexion.userName?.toLowerCase().includes(termino) ||
          conexion.pwd?.toLowerCase().includes(termino)
        )
      }))
      .filter(grupo => grupo.conexiones.length > 0);
  });

  totalResultados = computed(() => 
    this.gruposPorPaypad().reduce((total, grupo) => total + grupo.conexiones.length, 0)
  );

  //  CICLO DE VIDA 

  ngOnInit(): void {
    if (!localStorage.getItem('User')) {
      this.router.navigate(['/login']);
      return;
    }
    this.inicializarBusqueda();
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  //  MÉTODOS PRIVADOS 

  private getEmptyForm(): ConexionDto {
    return {
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
  }

  private inicializarBusqueda(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(termino => this.terminoBusqueda.set(termino));
  }

  private validarFormulario(): string[] {
    const data = this.formData();
    const errores: string[] = [];

    if (!data.paypad?.trim()) errores.push('El nombre del PayPad es obligatorio');
    if (!data.name?.trim()) errores.push('El tipo de conexión es obligatorio');
    if (!data.description?.trim()) errores.push('El código de conexión es obligatorio');
    if (data.description && data.description.length > 500) errores.push('El código es demasiado largo (máx. 500 caracteres)');

    return errores;
  }

  //  BÚSQUEDA 

  actualizarBusqueda(termino: string): void {
    this.searchSubject.next(termino);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
  }

  //  CARGA DE DATOS 

  cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      paypads: this._api.GetAllPaypads(),
      conexiones: this._api.GetAllConexiones()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ paypads, conexiones }) => {
        if (paypads.statusCode === 200 && paypads.response) {
          this.paypadsRaw.set(paypads.response);
        }

        if (conexiones.statusCode === 200) {
          const conexionesConEdicion = conexiones.response.map(c => ({ ...c, isEditing: false }));
          this.conexionesRealesRaw.set(conexionesConEdicion);
          
          const total = conexionesConEdicion.length + this.mockConexiones.getMockConexiones().length;
          this.toast.success('Éxito', `${total} conexiones cargadas`);
        } else {
          this.error.set(conexiones.message);
          this.toast.error('Error', conexiones.message);
        }

        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error', 'No se pudieron cargar los datos');
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.toast.info('Actualizando', 'Recargando datos...');
    this.cargarDatos();
  }

  //  MODAL CONEXIÓN 

  abrirModal(): void {
    this.formData.set(this.getEmptyForm());
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
  }

  //  MODAL VIDEO 

  abrirModalVideo(conexion: Conexion): void {
    this.videoUrl.set(conexion.icon || '');
    this.videoTitle.set(`Video Tutorial - ${conexion.name}`);
    this.showVideoModal.set(true);
  }

  cerrarModalVideo(): void {
    this.showVideoModal.set(false);
    this.videoUrl.set('');
    this.videoTitle.set('');
  }

  //  FORM DATA 

  actualizarPaypad(valor: string): void {
    if (!valor?.trim()) {
      this.formData.update(f => ({ ...f, paypad: '', idPaypad: 0 }));
      return;
    }

    const valorTrimmed = valor.trim();
    const paypadEncontrado = this.paypadsRaw().find(
      p => p.username.toLowerCase() === valorTrimmed.toLowerCase()
    );
    
    if (paypadEncontrado) {
      this.formData.update(f => ({ 
        ...f, 
        paypad: paypadEncontrado.username,
        idPaypad: paypadEncontrado.id 
      }));
    } else {
      this.formData.update(f => ({ ...f, paypad: valorTrimmed, idPaypad: 0 }));
    }
  }

  actualizarFormData(campo: keyof ConexionDto, valor: any): void {
    this.formData.update(f => ({ ...f, [campo]: valor || '' }));
  }

  //  CRUD 

  crearConexion(): void {
    const errores = this.validarFormulario();
    if (errores.length > 0) {
      errores.forEach(err => this.toast.warning('Validación', err));
      return;
    }

    const data = this.formData();
    this.loading.set(true);

    const payload: ConexionDto = {
      ...this.getEmptyForm(),
      idPaypad: data.idPaypad || 0,
      paypad: data.paypad?.trim() || '',
      name: data.name?.trim() || '',
      userName: data.userName?.trim() || '',
      pwd: data.pwd?.trim() || '',
      description: data.description?.trim() || '',
      icon: data.icon?.trim() || ''
    };

    this._api.CreateConexion(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: ConexionSingleResponse) => {
          if (res.statusCode === 200) {
            this.conexionesRealesRaw.update(list => [...list, { ...res.response, isEditing: false }]);
            this.toast.success('Creado', 'Conexión creada exitosamente');
            this.cerrarModal();
          } else {
            this.toast.error('Error', res.message);
          }
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Error', 'No se pudo crear la conexión');
          this.loading.set(false);
        }
      });
  }

  habilitarEdicion(id: number): void {
    if (this.mockConexiones.isMockConexionId(id)) {
      this.toast.warning('Aviso', 'No se pueden editar conexiones virtuales');
      return;
    }
    this.conexionesRealesRaw.update(list => list.map(c => ({ ...c, isEditing: c.id === id })));
  }

  cancelarEdicion(id: number): void {
    this.conexionesRealesRaw.update(list => 
      list.map(c => ({ ...c, isEditing: c.id === id ? false : c.isEditing }))
    );
    this.cargarDatos();
  }

  actualizarValor(id: number, campo: keyof Conexion, valor: string): void {
    if (this.mockConexiones.isMockConexionId(id)) return;
    this.conexionesRealesRaw.update(list => list.map(c => c.id === id ? { ...c, [campo]: valor } : c));
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
      paypad: conexion.paypad?.trim() || '',
      name: conexion.name?.trim() || '',
      userName: conexion.userName?.trim() || '',
      pwd: conexion.pwd?.trim() || '',
      description: conexion.description?.trim() || '',
      icon: conexion.icon?.trim() || ''
    };

    this._api.UpdateConexion(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: ConexionSingleResponse) => {
          if (res.statusCode === 200) {
            this.conexionesRealesRaw.update(list =>
              list.map(c => c.id === conexion.id ? { ...res.response, isEditing: false } : c)
            );
            this.toast.success('Guardado', 'Conexión actualizada exitosamente');
          } else {
            this.toast.error('Error', res.message);
          }
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Error', 'No se pudo guardar la conexión');
          this.loading.set(false);
        }
      });
  }

  eliminarConexion(id: number, nombre: string): void {
    if (this.mockConexiones.isMockConexionId(id)) {
      this.toast.warning('Aviso', 'No se pueden eliminar conexiones virtuales');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar la conexión "${nombre}"?`)) return;

    this.loading.set(true);

    this._api.DeleteConexion(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: ConexionSingleResponse) => {
          if (res.statusCode === 200) {
            this.conexionesRealesRaw.update(list => list.filter(c => c.id !== id));
            this.toast.success('Eliminado', `Conexión "${nombre}" eliminada`);
          } else {
            this.toast.error('Error', res.message);
          }
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Error', 'No se pudo eliminar la conexión');
          this.loading.set(false);
        }
      });
  }

  //  UTILIDADES 

  copiarCodigo(texto: string, tipo: string): void {
    if (!navigator?.clipboard) {
      this.toast.warning('Aviso', 'Copiado no soportado');
      return;
    }

    navigator.clipboard.writeText(texto)
      .then(() => {
        const textoCorto = texto.length > 50 ? texto.substring(0, 50) + '...' : texto;
        this.toast.info(tipo, `Copiado: ${textoCorto}`);
      })
      .catch(() => this.toast.error('Error', 'No se pudo copiar'));
  }

}