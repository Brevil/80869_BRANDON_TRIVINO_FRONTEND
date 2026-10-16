import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { FormulaMedica, FormulaMedicaRq, Medicamento } from 'src/app/models/formula-medica';
import { Mascota } from 'src/app/models/mascota';
import { Veterinario } from 'src/app/models/medico';
import { ClienteService } from '../cliente/service/cliente.service';
import { CitaService } from '../cita/service/cita.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoServiceService } from '../medico/service/medico-service.service';
import { FormulaMedicaService } from './service/formula-medica.service';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';
import { filtrarPorTexto, ordenarPor, paginar, totalPaginas, ValorOrdenable } from 'src/app/theme/shared/helpers/tabla';
import { mensajeError } from 'src/app/theme/shared/helpers/errores';

/**
 * Gestión de fórmulas médicas: listado con búsqueda, orden y paginación, y formulario
 * con combos dependientes Cliente → Mascota → Cita.
 */
@Component({
  selector: 'app-formula-medica',
  imports: [CommonModule, ReactiveFormsModule, PaginacionComponent],
  templateUrl: './formula-medica.component.html',
  styleUrl: './formula-medica.component.scss'
})
export class FormulaMedicaComponent implements OnInit {
  readonly porPagina = 5;

  // Catálogos para los combos.
  clientes: Cliente[] = [];
  citas: Cita[] = [];
  mascotasCliente: Mascota[] = [];
  citasMascota: Cita[] = [];
  veterinarios: Veterinario[] = [];
  medicamentos: Medicamento[] = [];

  // Listado, búsqueda, orden y paginación.
  formulas: FormulaMedica[] = [];
  terminoBusqueda = '';
  filtroVeterinario: number | null = null;
  ordenCampo = 'fechaCreacion';
  ordenAscendente = false;
  paginaActual = 1;

  // Formulario crear / editar.
  form!: FormGroup;
  formulaSeleccionada: FormulaMedica | null = null;
  enviando = false;

  // Detalle de solo lectura.
  detalle: FormulaMedica | null = null;

  constructor(
    private readonly formulaService: FormulaMedicaService,
    private readonly clienteService: ClienteService,
    private readonly citaService: CitaService,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoServiceService,
    private readonly formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({
      clienteId: [null as number | null, Validators.required],
      mascotaId: [null as number | null, Validators.required],
      citaId: [null as number | null, Validators.required],
      medicoId: [null as number | null, Validators.required],
      medicamentoId: [null as number | null, Validators.required],
      fechaEmision: ['', Validators.required],
      dosis: ['', [Validators.required, Validators.maxLength(500)]],
      frecuencia: ['', [Validators.required, Validators.maxLength(100)]],
      duracionDias: [null as number | null, [Validators.required, Validators.min(1)]],
      indicaciones: ['']
    });
  }

  ngOnInit(): void {
    this.cargarCatalogos();
    this.listar();
  }

  /** Carga los combos (clientes, citas, veterinarios y medicamentos). */
  cargarCatalogos(): void {
    this.clienteService.listarClientes().subscribe({ next: (d) => (this.clientes = d), error: (e) => this.avisarError(e, 'No se pudieron cargar los clientes.') });
    this.citaService.listarCitas().subscribe({ next: (d) => (this.citas = d), error: (e) => this.avisarError(e, 'No se pudieron cargar las citas.') });
    this.medicoService.listarMedicos().subscribe({ next: (d) => (this.veterinarios = d), error: (e) => this.avisarError(e, 'No se pudieron cargar los veterinarios.') });
    this.formulaService.listarMedicamentos().subscribe({ next: (d) => (this.medicamentos = d), error: (e) => this.avisarError(e, 'No se pudieron cargar los medicamentos.') });
  }

  /** Carga el listado de fórmulas. */
  listar(): void {
    this.formulaService.listarFormulas().subscribe({
      next: (data) => {
        this.formulas = data;
        this.paginaActual = 1;
      },
      error: (error) => this.avisarError(error, 'No se pudieron cargar las fórmulas médicas.')
    });
  }

  // ---- Listado: filtros, orden y paginación ----

  /** @returns fórmulas que cumplen el filtro de veterinario y el texto buscado, ordenadas. */
  get formulasFiltradas(): FormulaMedica[] {
    const porVeterinario = this.filtroVeterinario
      ? this.formulas.filter((f) => f.medico?.id === this.filtroVeterinario)
      : this.formulas;
    const buscadas = filtrarPorTexto(porVeterinario, this.terminoBusqueda, (f) => [
      f.id, f.mascota?.nombreMascota, f.medico?.nombres, f.medico?.apellidos,
      f.medicamento?.nombre, f.dosis, f.frecuencia, f.fechaEmision
    ]);
    return ordenarPor(buscadas, (f) => this.valorOrden(f), this.ordenAscendente);
  }

  /** @returns fórmulas de la página actual. */
  get formulasPaginadas(): FormulaMedica[] {
    return paginar(this.formulasFiltradas, this.paginaActual, this.porPagina);
  }

  /** @returns total de páginas del listado filtrado. */
  get totalPaginas(): number {
    return totalPaginas(this.formulasFiltradas.length, this.porPagina);
  }

  /**
   * @param f fórmula.
   * @returns valor de la columna por la que se ordena.
   */
  private valorOrden(f: FormulaMedica): ValorOrdenable {
    switch (this.ordenCampo) {
      case 'mascota': return f.mascota?.nombreMascota;
      case 'medicamento': return f.medicamento?.nombre;
      case 'fechaEmision': return f.fechaEmision;
      case 'fechaCreacion': return f.fechaCreacionRegistro;
      default: return f.id;
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
   * @returns flecha que indica el sentido de orden de la columna, o vacío.
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

  /** Reinicia la paginación al cambiar el filtro de veterinario. */
  alFiltrarVeterinario(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.filtroVeterinario = valor ? Number(valor) : null;
    this.paginaActual = 1;
  }

  // ---- Combos dependientes: Cliente → Mascota → Cita ----

  /** Al cambiar el cliente, carga sus mascotas y limpia mascota y cita. */
  alCambiarCliente(): void {
    this.form.patchValue({ mascotaId: null, citaId: null });
    this.mascotasCliente = [];
    this.citasMascota = [];
    const clienteId = this.form.controls['clienteId'].value;
    if (clienteId) {
      this.cargarMascotas(clienteId);
    }
  }

  /** Al cambiar la mascota, limpia la cita y muestra solo las citas de esa mascota. */
  alCambiarMascota(): void {
    this.form.patchValue({ citaId: null });
    this.filtrarCitas();
  }

  /**
   * @param clienteId id del cliente.
   */
  private cargarMascotas(clienteId: number): void {
    this.mascotaService.listarPorCliente(clienteId).subscribe({
      next: (mascotas) => {
        this.mascotasCliente = mascotas;
        this.filtrarCitas();
      },
      error: (e) => this.avisarError(e, 'No se pudieron cargar las mascotas del cliente.')
    });
  }

  /** Muestra solo las citas de la mascota seleccionada en el formulario. */
  private filtrarCitas(): void {
    const mascotaId = this.form.controls['mascotaId'].value;
    this.citasMascota = this.citas.filter((c) => c.mascota?.mascotaId === mascotaId);
  }

  /** @returns true si la fecha de emisión es anterior a la fecha de la consulta. */
  get fechaAnteriorAConsulta(): boolean {
    const citaId = this.form.controls['citaId'].value;
    const fecha = this.form.controls['fechaEmision'].value as string;
    const cita = this.citas.find((c) => c.id === citaId);
    return !!cita?.fechaHora && !!fecha && fecha < cita.fechaHora.substring(0, 10);
  }

  /** @returns fecha de la cita seleccionada en formato yyyy-MM-dd, para fijar el mínimo de emisión. */
  get fechaMinimaEmision(): string {
    const cita = this.citas.find((c) => c.id === this.form.controls['citaId'].value);
    return cita?.fechaHora?.substring(0, 10) ?? '';
  }

  /** @param control control del formulario. @returns control para el template. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  // ---- Crear / editar / ver ----

  /** Abre el formulario vacío para registrar una fórmula. */
  nuevaFormula(): void {
    this.formulaSeleccionada = null;
    this.mascotasCliente = [];
    this.citasMascota = [];
    this.form.reset({ fechaEmision: '', dosis: '', frecuencia: '', indicaciones: '', duracionDias: null });
    this.abrirModal('modalFormulaMedica');
  }

  /**
   * Abre el formulario precargado con los datos de la fórmula.
   *
   * @param formula fórmula a editar.
   */
  abrirEdicion(formula: FormulaMedica): void {
    this.formulaSeleccionada = formula;
    const clienteId = formula.mascota?.cliente?.id ?? null;
    this.form.reset({
      clienteId,
      mascotaId: formula.mascota?.mascotaId ?? null,
      citaId: formula.cita?.id ?? null,
      medicoId: formula.medico?.id ?? null,
      medicamentoId: formula.medicamento?.id ?? null,
      fechaEmision: formula.fechaEmision ?? '',
      dosis: formula.dosis ?? '',
      frecuencia: formula.frecuencia ?? '',
      duracionDias: formula.duracionDias ?? null,
      indicaciones: formula.indicaciones ?? ''
    });
    this.mascotasCliente = [];
    this.citasMascota = [];
    if (clienteId) {
      this.cargarMascotas(clienteId);
    }
    this.abrirModal('modalFormulaMedica');
  }

  /**
   * Muestra el detalle completo de la fórmula en un modal de solo lectura.
   *
   * @param formula fórmula a consultar.
   */
  verDetalle(formula: FormulaMedica): void {
    this.detalle = formula;
    this.abrirModal('modalDetalleFormula');
  }

  /** Valida el formulario y envía la fórmula al backend para crearla o editarla. */
  guardar(): void {
    if (this.form.invalid || this.fechaAnteriorAConsulta || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const rq: FormulaMedicaRq = {
      id: this.formulaSeleccionada?.id,
      citaId: Number(v.citaId),
      mascotaId: Number(v.mascotaId),
      medicoId: Number(v.medicoId),
      medicamentoId: Number(v.medicamentoId),
      fechaEmision: v.fechaEmision,
      dosis: v.dosis.trim(),
      frecuencia: v.frecuencia.trim(),
      duracionDias: Number(v.duracionDias),
      indicaciones: (v.indicaciones ?? '').trim()
    };

    const editando = !!this.formulaSeleccionada;
    this.enviando = true;
    const solicitud = editando
      ? this.formulaService.actualizarFormula(rq)
      : this.formulaService.crearFormula(rq);

    solicitud.subscribe({
      next: () => {
        this.enviando = false;
        this.cerrarModal('modalFormulaMedica');
        this.listar();
        Swal.fire('Operación exitosa',
          editando ? 'La fórmula fue actualizada correctamente.' : 'La fórmula fue creada correctamente.',
          'success');
      },
      error: (error) => {
        this.enviando = false;
        Swal.fire('Error', mensajeError(error, 'No se pudo guardar la fórmula médica.'), 'error');
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
