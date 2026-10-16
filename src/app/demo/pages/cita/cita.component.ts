import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { Cita, CitaRq, ESTADOS_CITA, EstadoCita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Veterinario } from 'src/app/models/medico';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoServiceService } from '../medico/service/medico-service.service';
import { CitaService } from './service/cita.service';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';
import { filtrarPorTexto, ordenarPor, paginar, totalPaginas, ValorOrdenable } from 'src/app/theme/shared/helpers/tabla';
import { mensajeError } from 'src/app/theme/shared/helpers/errores';

/**
 * Gestión de citas médicas: listado con búsqueda, orden y paginación, y formulario de
 * agendamiento y edición. Las reglas de horario y de estado las valida el backend.
 */
@Component({
  selector: 'app-cita',
  imports: [CommonModule, ReactiveFormsModule, PaginacionComponent],
  templateUrl: './cita.component.html',
  styleUrl: './cita.component.scss'
})
export class CitaComponent implements OnInit {
  readonly porPagina = 5;
  readonly estados = ESTADOS_CITA;

  // Catálogos.
  clientes: Cliente[] = [];
  mascotasCliente: Mascota[] = [];
  veterinarios: Veterinario[] = [];

  // Listado.
  citas: Cita[] = [];
  terminoBusqueda = '';
  filtroEstado: EstadoCita | '' = '';
  ordenCampo = 'fechaHora';
  ordenAscendente = false;
  paginaActual = 1;

  // Formulario.
  form!: FormGroup;
  citaSeleccionada: Cita | null = null;
  enviando = false;
  readonly hoy = fechaLocal(new Date());

  constructor(
    private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoServiceService,
    private readonly formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({
      clienteId: [null as number | null, Validators.required],
      mascotaId: [null as number | null, Validators.required],
      medicoId: [null as number | null, Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      estado: ['PENDIENTE' as EstadoCita, Validators.required]
    });
  }

  ngOnInit(): void {
    this.listar();
    this.clienteService.listarClientes().subscribe({ next: (d) => (this.clientes = d), error: (e) => this.avisarError(e, 'No se pudieron cargar los clientes.') });
    this.medicoService.listarMedicos().subscribe({ next: (d) => (this.veterinarios = d), error: (e) => this.avisarError(e, 'No se pudieron cargar los veterinarios.') });
  }

  /** Carga el listado de citas. */
  listar(): void {
    this.citaService.listarCitas().subscribe({
      next: (data) => {
        this.citas = data;
        this.paginaActual = 1;
      },
      error: (e) => this.avisarError(e, 'No se pudieron cargar las citas.')
    });
  }

  // ---- Listado: filtros, orden y paginación ----

  /** @returns citas filtradas por estado y texto, ordenadas por la columna elegida. */
  get citasFiltradas(): Cita[] {
    const porEstado = this.filtroEstado ? this.citas.filter((c) => c.estado === this.filtroEstado) : this.citas;
    const buscadas = filtrarPorTexto(porEstado, this.terminoBusqueda, (c) => [
      c.cliente?.nombres, c.cliente?.apellidos, c.mascota?.nombreMascota,
      c.medico?.nombres, c.medico?.apellidos, c.estado, c.motivo, c.fechaHora
    ]);
    return ordenarPor(buscadas, (c) => this.valorOrden(c), this.ordenAscendente);
  }

  /** @returns citas de la página actual. */
  get citasPaginadas(): Cita[] {
    return paginar(this.citasFiltradas, this.paginaActual, this.porPagina);
  }

  /** @returns total de páginas del listado filtrado. */
  get totalPaginas(): number {
    return totalPaginas(this.citasFiltradas.length, this.porPagina);
  }

  /**
   * @param c cita.
   * @returns valor de la columna por la que se ordena.
   */
  private valorOrden(c: Cita): ValorOrdenable {
    switch (this.ordenCampo) {
      case 'cliente': return `${c.cliente?.nombres ?? ''} ${c.cliente?.apellidos ?? ''}`;
      case 'mascota': return c.mascota?.nombreMascota;
      case 'veterinario': return `${c.medico?.nombres ?? ''} ${c.medico?.apellidos ?? ''}`;
      case 'estado': return c.estado;
      default: return c.fechaHora;
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

  /** Reinicia la paginación al cambiar el filtro de estado. */
  alFiltrarEstado(event: Event): void {
    this.filtroEstado = (event.target as HTMLSelectElement).value as EstadoCita | '';
    this.paginaActual = 1;
  }

  /**
   * Indica si una cita puede editarse. Las atendidas no se modifican.
   *
   * @param cita cita de la tabla.
   * @returns true si la cita es editable.
   */
  puedeEditar(cita: Cita): boolean {
    return cita.estado !== 'ATENDIDA';
  }

  // ---- Combos dependientes: Cliente → Mascota ----

  /** Al cambiar el cliente, carga sus mascotas y limpia la mascota elegida. */
  alCambiarCliente(): void {
    this.form.patchValue({ mascotaId: null });
    this.mascotasCliente = [];
    const clienteId = this.form.controls['clienteId'].value;
    if (clienteId) {
      this.cargarMascotas(clienteId);
    }
  }

  private cargarMascotas(clienteId: number): void {
    this.mascotaService.listarPorCliente(clienteId).subscribe({
      next: (mascotas) => (this.mascotasCliente = mascotas),
      error: (e) => this.avisarError(e, 'No se pudieron cargar las mascotas del cliente.')
    });
  }

  /** @returns control del formulario por nombre. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** @returns true si la fecha elegida ya pasó (la validación definitiva está en el backend). */
  get fechaPasada(): boolean {
    const fecha = this.form.controls['fecha'].value as string;
    return !!fecha && fecha < this.hoy;
  }

  // ---- Crear / editar ----

  /** Abre el formulario vacío para agendar una cita. */
  nuevaCita(): void {
    this.citaSeleccionada = null;
    this.mascotasCliente = [];
    this.form.reset({ clienteId: null, mascotaId: null, medicoId: null, fecha: '', hora: '', motivo: '', estado: 'PENDIENTE' });
    this.abrirModal();
  }

  /**
   * Abre el formulario con los datos de la cita para editarla.
   *
   * @param cita cita a editar.
   */
  abrirEdicion(cita: Cita): void {
    this.citaSeleccionada = cita;
    const fechaHora = cita.fechaHora ?? '';
    const clienteId = cita.cliente?.id ?? cita.mascota?.cliente?.id ?? null;
    this.form.reset({
      clienteId,
      mascotaId: cita.mascota?.mascotaId ?? null,
      medicoId: cita.medico?.id ?? null,
      fecha: fechaHora.substring(0, 10),
      hora: fechaHora.substring(11, 16),
      motivo: cita.motivo ?? '',
      estado: cita.estado ?? 'PENDIENTE'
    });
    this.mascotasCliente = [];
    if (clienteId) {
      this.cargarMascotas(clienteId);
    }
    this.abrirModal();
  }

  /** Valida el formulario y envía la cita al backend para crearla o editarla. */
  guardar(): void {
    if (this.form.invalid || this.fechaPasada || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const rq: CitaRq = {
      id: this.citaSeleccionada?.id,
      clienteId: Number(v.clienteId),
      mascotaId: Number(v.mascotaId),
      medicoId: Number(v.medicoId),
      fechaHora: `${v.fecha}T${v.hora}:00`,
      motivo: v.motivo.trim(),
      estado: v.estado
    };

    const editando = !!this.citaSeleccionada;
    this.enviando = true;
    const solicitud = editando ? this.citaService.actualizarCita(rq) : this.citaService.crearCita(rq);
    solicitud.subscribe({
      next: () => {
        this.enviando = false;
        this.cerrarModal();
        this.listar();
        Swal.fire('Operación exitosa',
          editando ? 'La cita fue actualizada correctamente.' : 'La cita fue agendada correctamente.',
          'success');
      },
      error: (error) => {
        this.enviando = false;
        Swal.fire('Error', mensajeError(error, 'No se pudo guardar la cita.'), 'error');
      }
    });
  }

  private avisarError(error: unknown, porDefecto: string): void {
    console.error(porDefecto, error);
    Swal.fire('Error', mensajeError(error, porDefecto), 'error');
  }

  private abrirModal(): void {
    const el = document.getElementById('modalCita');
    if (el) {
      Modal.getOrCreateInstance(el).show();
    }
  }

  private cerrarModal(): void {
    const el = document.getElementById('modalCita');
    if (el) {
      Modal.getInstance(el)?.hide();
    }
  }
}

/**
 * @param d fecha.
 * @returns fecha local en formato yyyy-MM-dd.
 */
function fechaLocal(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}
