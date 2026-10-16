import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { AnotacionHistoria, AnotacionHistoriaRq, HistoriaMedica, HistoriaMedicaRq } from 'src/app/models/historia-medica';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Veterinario } from 'src/app/models/medico';
import { ClienteService } from '../cliente/service/cliente.service';
import { CitaService } from '../cita/service/cita.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoServiceService } from '../medico/service/medico-service.service';
import { HistoriaMedicaService } from './service/historia-medica.service';
import { AnotacionHistoriaService } from './service/anotacion-historia.service';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';
import { filtrarPorTexto, ordenarPor, paginar, totalPaginas, ValorOrdenable } from 'src/app/theme/shared/helpers/tabla';
import { mensajeError } from 'src/app/theme/shared/helpers/errores';

/**
 * Historias clínicas: listado, creación desde una cita atendida y consulta del histórico
 * de anotaciones de la mascota dentro del detalle.
 */
@Component({
  selector: 'app-historia-medica',
  imports: [CommonModule, ReactiveFormsModule, PaginacionComponent],
  templateUrl: './historia-medica.component.html',
  styleUrl: './historia-medica.component.scss'
})
export class HistoriaMedicaComponent implements OnInit {
  readonly porPagina = 5;

  // Catálogos.
  clientes: Cliente[] = [];
  citas: Cita[] = [];
  mascotasCliente: Mascota[] = [];
  veterinarios: Veterinario[] = [];

  // Listado de historias.
  historias: HistoriaMedica[] = [];
  terminoBusqueda = '';
  ordenCampo = 'fechaHora';
  ordenAscendente = false;
  paginaActual = 1;

  // Formulario nueva historia.
  form!: FormGroup;
  enviando = false;

  // Detalle de una historia y su histórico de anotaciones.
  historiaSeleccionada: HistoriaMedica | null = null;
  anotaciones: AnotacionHistoria[] = [];
  anotacionDetalle: AnotacionHistoria | null = null;
  anTerminoBusqueda = '';
  anOrdenAscendente = false;
  anPaginaActual = 1;
  formAnotacion!: FormGroup;
  enviandoAnotacion = false;

  constructor(
    private readonly historiaService: HistoriaMedicaService,
    private readonly anotacionService: AnotacionHistoriaService,
    private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoServiceService,
    private readonly formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({
      clienteId: [null as number | null, Validators.required],
      mascotaId: [null as number | null, Validators.required],
      citaId: [null as number | null, Validators.required],
      diagnostico: ['', [Validators.required, Validators.maxLength(1000)]],
      observaciones: ['', Validators.maxLength(1000)]
    });
    this.formAnotacion = this.formBuilder.group({
      medicoId: [null as number | null, Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
      observacion: ['', Validators.maxLength(1000)],
      diagnostico: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.listar();
    this.citaService.listarCitas().subscribe({ next: (d) => (this.citas = d), error: (e) => this.avisarError(e, 'No se pudieron cargar las citas.') });
    this.clienteService.listarClientes().subscribe({ next: (d) => (this.clientes = d), error: (e) => this.avisarError(e, 'No se pudieron cargar los clientes.') });
    this.medicoService.listarMedicos().subscribe({ next: (d) => (this.veterinarios = d), error: (e) => this.avisarError(e, 'No se pudieron cargar los veterinarios.') });
  }

  /** Carga el listado de historias clínicas. */
  listar(): void {
    this.historiaService.listarHistorias().subscribe({
      next: (data) => {
        this.historias = data;
        this.paginaActual = 1;
      },
      error: (e) => this.avisarError(e, 'No se pudieron cargar las historias clínicas.')
    });
  }

  // ---- Listado de historias ----

  /** @returns historias que coinciden con el texto buscado, ordenadas. */
  get historiasFiltradas(): HistoriaMedica[] {
    const buscadas = filtrarPorTexto(this.historias, this.terminoBusqueda, (h) => [
      h.mascota?.nombreMascota, h.mascota?.cliente?.nombres, h.mascota?.cliente?.apellidos,
      h.medico?.nombres, h.medico?.apellidos, h.motivo, h.cita?.estado, h.fechaHora
    ]);
    return ordenarPor(buscadas, (h) => this.valorOrden(h), this.ordenAscendente);
  }

  /** @returns historias de la página actual. */
  get historiasPaginadas(): HistoriaMedica[] {
    return paginar(this.historiasFiltradas, this.paginaActual, this.porPagina);
  }

  /** @returns total de páginas del listado filtrado. */
  get totalPaginas(): number {
    return totalPaginas(this.historiasFiltradas.length, this.porPagina);
  }

  private valorOrden(h: HistoriaMedica): ValorOrdenable {
    switch (this.ordenCampo) {
      case 'mascota': return h.mascota?.nombreMascota;
      case 'cliente': return `${h.mascota?.cliente?.nombres ?? ''} ${h.mascota?.cliente?.apellidos ?? ''}`;
      case 'veterinario': return `${h.medico?.nombres ?? ''} ${h.medico?.apellidos ?? ''}`;
      case 'estado': return h.cita?.estado;
      default: return h.fechaHora;
    }
  }

  /**
   * Ordena por la columna indicada; si ya estaba ordenada, invierte el sentido.
   *
   * @param campo nombre de la columna.
   */
  ordenarPorCampo(campo: string): void {
    if (this.ordenCampo === campo) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.ordenCampo = campo;
      this.ordenAscendente = true;
    }
  }

  /**
   * @param campo nombre de la columna.
   * @returns flecha de orden de la columna, o vacío.
   */
  indicadorOrden(campo: string): string {
    if (this.ordenCampo !== campo) return '';
    return this.ordenAscendente ? ' ▲' : ' ▼';
  }

  /** Reinicia la paginación al cambiar la búsqueda. */
  alBuscar(event: Event): void {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  // ---- Combos dependientes para la nueva historia: Cliente → Mascota → Cita atendida ----

  /** Citas atendidas de la mascota seleccionada que aún no tienen historia clínica. */
  get citasDisponibles(): Cita[] {
    const mascotaId = this.form.controls['mascotaId'].value;
    const conHistoria = new Set(this.historias.map((h) => h.cita?.id));
    return this.citas.filter((c) => c.mascota?.mascotaId === mascotaId
      && c.estado === 'ATENDIDA' && !conHistoria.has(c.id));
  }

  /** Al cambiar el cliente, carga sus mascotas y limpia mascota y cita. */
  alCambiarCliente(): void {
    this.form.patchValue({ mascotaId: null, citaId: null });
    this.mascotasCliente = [];
    const clienteId = this.form.controls['clienteId'].value;
    if (clienteId) {
      this.mascotaService.listarPorCliente(clienteId).subscribe({
        next: (m) => (this.mascotasCliente = m),
        error: (e) => this.avisarError(e, 'No se pudieron cargar las mascotas del cliente.')
      });
    }
  }

  /** Al cambiar la mascota, limpia la cita elegida. */
  alCambiarMascota(): void {
    this.form.patchValue({ citaId: null });
  }

  /** @returns control del formulario por nombre. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** @returns control del formulario de anotaciones por nombre. */
  get fa(): { [key: string]: AbstractControl } {
    return this.formAnotacion.controls;
  }

  /** Abre el formulario vacío para crear una historia clínica. */
  nuevaHistoria(): void {
    this.mascotasCliente = [];
    this.form.reset({ clienteId: null, mascotaId: null, citaId: null, diagnostico: '', observaciones: '' });
    this.abrirModal('modalNuevaHistoria');
  }

  /** Valida y crea la historia clínica a partir de la cita atendida seleccionada. */
  guardarHistoria(): void {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const rq: HistoriaMedicaRq = {
      citaId: Number(v.citaId),
      diagnostico: v.diagnostico.trim(),
      observaciones: (v.observaciones ?? '').trim()
    };
    this.enviando = true;
    this.historiaService.crearHistoria(rq).subscribe({
      next: () => {
        this.enviando = false;
        this.cerrarModal('modalNuevaHistoria');
        this.listar();
        Swal.fire('Operación exitosa', 'La historia clínica fue creada correctamente.', 'success');
      },
      error: (error) => {
        this.enviando = false;
        Swal.fire('Error', mensajeError(error, 'No se pudo crear la historia clínica.'), 'error');
      }
    });
  }

  // ---- Detalle y anotaciones ----

  /**
   * Abre el detalle de la historia y carga el histórico de anotaciones de la mascota.
   *
   * @param historia historia seleccionada.
   */
  verHistoria(historia: HistoriaMedica): void {
    this.historiaSeleccionada = historia;
    this.anotacionDetalle = null;
    this.anTerminoBusqueda = '';
    this.anPaginaActual = 1;
    this.anOrdenAscendente = false;
    this.formAnotacion.reset({ medicoId: null, descripcion: '', observacion: '', diagnostico: '' });
    this.cargarAnotaciones();
    this.abrirModal('modalVerHistoria');
  }

  /** Carga las anotaciones de todas las historias de la mascota de la historia seleccionada. */
  cargarAnotaciones(): void {
    const mascotaId = this.historiaSeleccionada?.mascota?.mascotaId;
    if (!mascotaId) return;
    this.anotacionService.listarPorMascota(mascotaId).subscribe({
      next: (data) => (this.anotaciones = data),
      error: (e) => this.avisarError(e, 'No se pudo cargar el histórico de anotaciones.')
    });
  }

  /** @returns anotaciones filtradas por texto y ordenadas por fecha. */
  get anotacionesFiltradas(): AnotacionHistoria[] {
    const buscadas = filtrarPorTexto(this.anotaciones, this.anTerminoBusqueda, (a) => [
      a.descripcion, a.observacion, a.diagnostico, a.medico?.nombres, a.medico?.apellidos, a.fecha
    ]);
    return ordenarPor(buscadas, (a) => a.fecha, this.anOrdenAscendente);
  }

  /** @returns anotaciones de la página actual. */
  get anotacionesPaginadas(): AnotacionHistoria[] {
    return paginar(this.anotacionesFiltradas, this.anPaginaActual, this.porPagina);
  }

  /** @returns total de páginas del histórico. */
  get anTotalPaginas(): number {
    return totalPaginas(this.anotacionesFiltradas.length, this.porPagina);
  }

  /** Alterna el orden por fecha del histórico. */
  alternarOrdenAnotaciones(): void {
    this.anOrdenAscendente = !this.anOrdenAscendente;
  }

  /** Reinicia la paginación al cambiar el texto de búsqueda del histórico. */
  alBuscarAnotaciones(event: Event): void {
    this.anTerminoBusqueda = (event.target as HTMLInputElement).value;
    this.anPaginaActual = 1;
  }

  /**
   * Muestra el detalle completo de una anotación.
   *
   * @param anotacion anotación elegida.
   */
  verAnotacion(anotacion: AnotacionHistoria): void {
    this.anotacionDetalle = anotacion;
  }

  /** Agrega una anotación a la historia seleccionada y refresca el histórico. */
  guardarAnotacion(): void {
    if (this.formAnotacion.invalid || this.enviandoAnotacion || !this.historiaSeleccionada?.id) {
      this.formAnotacion.markAllAsTouched();
      return;
    }
    const v = this.formAnotacion.getRawValue();
    const rq: AnotacionHistoriaRq = {
      historiaId: this.historiaSeleccionada.id,
      medicoId: Number(v.medicoId),
      descripcion: v.descripcion.trim(),
      observacion: (v.observacion ?? '').trim(),
      diagnostico: v.diagnostico.trim()
    };
    this.enviandoAnotacion = true;
    this.anotacionService.crearAnotacion(rq).subscribe({
      next: () => {
        this.enviandoAnotacion = false;
        this.formAnotacion.reset({ medicoId: null, descripcion: '', observacion: '', diagnostico: '' });
        this.cargarAnotaciones();
        Swal.fire('Operación exitosa', 'La anotación fue agregada correctamente.', 'success');
      },
      error: (error) => {
        this.enviandoAnotacion = false;
        Swal.fire('Error', mensajeError(error, 'No se pudo agregar la anotación.'), 'error');
      }
    });
  }

  private avisarError(error: unknown, porDefecto: string): void {
    console.error(porDefecto, error);
    Swal.fire('Error', mensajeError(error, porDefecto), 'error');
  }

  private abrirModal(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      Modal.getOrCreateInstance(el).show();
    }
  }

  private cerrarModal(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      Modal.getInstance(el)?.hide();
    }
  }
}
