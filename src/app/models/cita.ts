import { Cliente } from './cliente';
import { Mascota } from './mascota';
import { Veterinario } from './medico';

/** Estados válidos de una cita, tal como los maneja el backend. */
export const ESTADOS_CITA = ['PENDIENTE', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'PROGRAMADA'] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

/** Cita médica tal como la devuelve el backend. */
export interface Cita {
  id?: number;
  cliente?: Cliente;
  mascota?: Mascota;
  medico?: Veterinario;
  /** Fecha y hora en formato ISO, por ejemplo "2026-10-17T10:00:00". */
  fechaHora?: string;
  estado?: EstadoCita;
  motivo?: string;
}

/** Datos que se envían al backend para crear o editar una cita. */
export interface CitaRq {
  id?: number;
  clienteId: number;
  mascotaId: number;
  medicoId: number;
  fechaHora: string;
  motivo: string;
  estado: EstadoCita;
}
