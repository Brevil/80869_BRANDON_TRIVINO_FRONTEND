export class FormulaMedica {
  id?: number;
  cita?: {
    id?: number;
    fechaHora?: Date;
    estado?: string;
    motivo?: string;
    mascota?: { nombreMascota?: string };
  };
  medicamento?: { id?: number; nombre?: string; presentacion?: string };
  dosis?: string;
  indicaciones?: string;
  fechaCreacionRegistro?: Date;
  fechaActualizacionRegistro?: Date;
  // Solo para enviar al backend al crear o editar.
  citaId?: number;
  medicamentoId?: number;
}
