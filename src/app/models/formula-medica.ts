import { Cita } from './cita';
import { Mascota } from './mascota';
import { Veterinario } from './medico';

/** Medicamento disponible para prescribir. */
export interface Medicamento {
  id?: number;
  nombre?: string;
  presentacion?: string;
}

/** Fórmula médica tal como la devuelve el backend. */
export interface FormulaMedica {
  id?: number;
  cita?: Cita;
  mascota?: Mascota;
  medico?: Veterinario;
  medicamento?: Medicamento;
  fechaEmision?: string;
  dosis?: string;
  frecuencia?: string;
  duracionDias?: number;
  indicaciones?: string;
  fechaCreacionRegistro?: string;
  fechaActualizacionRegistro?: string;
}

/** Datos que se envían al backend para crear o editar una fórmula. */
export interface FormulaMedicaRq {
  id?: number;
  citaId: number;
  mascotaId: number;
  medicoId: number;
  medicamentoId: number;
  fechaEmision: string;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  indicaciones?: string;
}
