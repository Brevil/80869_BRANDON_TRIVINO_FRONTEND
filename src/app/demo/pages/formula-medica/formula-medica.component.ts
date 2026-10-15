import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { FormulaMedica } from 'src/app/models/formula-medica';
import { FormulaMedicaService } from './service/formula-medica.service';

@Component({
  selector: 'app-formula-medica',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formula-medica.component.html',
  styleUrl: './formula-medica.component.scss'
})
export class FormulaMedicaComponent {
  // Modal.
  modalInstance: Modal | null = null;
  titleModal = '';
  titleBoton = '';
  modoFormulario = '';

  // Tabla: búsqueda y paginación.
  listFormulas: FormulaMedica[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;

  // Formulario.
  form!: FormGroup;
  formulaSelected: FormulaMedica | null = null;
  enviando = false;

  constructor(
    private readonly formulaService: FormulaMedicaService,
    private readonly formBuilder: FormBuilder
  ) {
    this.inicializarFormulario();
    this.listar();
  }

  inicializarFormulario() {
    this.form = this.formBuilder.group({
      citaId: [null, [Validators.required, Validators.min(1)]],
      medicamentoId: [null, [Validators.required, Validators.min(1)]],
      dosis: ['', Validators.required],
      indicaciones: ['']
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  listar() {
    this.formulaService.listarFormulas().subscribe({
      next: (data) => {
        this.listFormulas = data;
        this.paginaActual = 1;
      },
      error: (error) => {
        console.error('Error al obtener las fórmulas médicas:', error);
        Swal.fire('Error', 'No se pudieron cargar las fórmulas médicas.', 'error');
      }
    });
  }

  // ---- Búsqueda y paginación ----
  get formulasFiltradas(): FormulaMedica[] {
    const termino = this.normalizar(this.terminoBusqueda.trim());
    if (!termino) {
      return this.listFormulas;
    }
    return this.listFormulas.filter((x) =>
      [x.id, x.cita?.mascota?.nombreMascota, x.medicamento?.nombre, x.dosis, x.indicaciones].some((v) =>
        this.normalizar(String(v ?? '')).includes(termino)
      )
    );
  }

  get formulasPaginadas(): FormulaMedica[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.formulasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.formulasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  private normalizar(texto: string): string {
    return texto.toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // ---- Crear / editar ----
  nuevaFormula() {
    this.formulaSelected = null;
    this.form.reset({ citaId: null, medicamentoId: null, dosis: '', indicaciones: '' });
    this.openModal('C');
  }

  abrirEdicion(formula: FormulaMedica) {
    this.formulaSelected = formula;
    this.form.reset({
      citaId: formula.cita?.id ?? null,
      medicamentoId: formula.medicamento?.id ?? null,
      dosis: formula.dosis ?? '',
      indicaciones: formula.indicaciones ?? ''
    });
    this.openModal('E');
  }

  guardarFormula() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const formula: FormulaMedica = {
      id: this.formulaSelected?.id,
      citaId: Number(v.citaId),
      medicamentoId: Number(v.medicamentoId),
      dosis: v.dosis,
      indicaciones: v.indicaciones
    };

    this.enviando = true;
    const solicitud =
      this.modoFormulario === 'C'
        ? this.formulaService.crearFormula(formula)
        : this.formulaService.actualizarFormula(formula);

    solicitud.subscribe({
      next: () => {
        this.enviando = false;
        this.closeModal();
        this.listar();
        Swal.fire(
          'Operación exitosa',
          this.modoFormulario === 'C' ? 'La fórmula fue creada correctamente.' : 'La fórmula fue actualizada correctamente.',
          'success'
        );
      },
      error: (error) => {
        this.enviando = false;
        console.error('Error al guardar la fórmula médica:', error);
        Swal.fire('Error', error?.error?.message ?? error.message, 'error');
      }
    });
  }

  openModal(modo: string) {
    this.modoFormulario = modo;
    this.titleModal = modo === 'C' ? 'Crear Fórmula Médica' : 'Editar Fórmula Médica';
    this.titleBoton = modo === 'C' ? 'Guardar Fórmula' : 'Actualizar Fórmula';
    const el = document.getElementById('modalFormulaMedica');
    if (el) {
      this.modalInstance ??= new Modal(el);
      this.modalInstance.show();
    }
  }

  closeModal() {
    this.modalInstance?.hide();
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
