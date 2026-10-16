import { Cita } from './cita';
import { Mascota } from './mascota';
import { Veterinario } from './medico';

/** Historia clínica de una consulta atendida. */
export interface HistoriaMedica {
  id?: number;
  cita?: Cita;
  mascota?: Mascota;
  medico?: Veterinario;
  fechaHora?: string;
  motivo?: string;
  diagnostico?: string;
  observaciones?: string;
}

/** Datos que se envían al backend para crear una historia clínica. */
export interface HistoriaMedicaRq {
  citaId: number;
  diagnostico: string;
  observaciones?: string;
}

/** Anotación registrada dentro de una historia clínica. */
export interface AnotacionHistoria {
  id?: number;
  historia?: HistoriaMedica;
  medico?: Veterinario;
  fecha?: string;
  descripcion?: string;
  observacion?: string;
  diagnostico?: string;
}

/** Datos que se envían al backend para agregar una anotación. */
export interface AnotacionHistoriaRq {
  historiaId: number;
  medicoId: number;
  descripcion: string;
  observacion?: string;
  diagnostico: string;
}
