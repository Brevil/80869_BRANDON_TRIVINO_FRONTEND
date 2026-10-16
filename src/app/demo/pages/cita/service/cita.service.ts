import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cita, CitaRq } from 'src/app/models/cita';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Consumo de los servicios REST de citas médicas.
 */
@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private api = `cita`;

  constructor(private backendService: BackendService) {}

  /** @returns todas las citas, de la más reciente a la más antigua. */
  listarCitas(): Observable<Cita[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /** @param id id de la cita. */
  buscarCita(id: number): Observable<Cita> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }

  /** @param cita datos de la nueva cita. */
  crearCita(cita: CitaRq): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', cita);
  }

  /** @param cita datos de la cita a editar, incluido su id. */
  actualizarCita(cita: CitaRq): Observable<unknown> {
    return this.backendService.put(environment.apiUrlAuth, this.api, 'actualizar', cita);
  }
}
