import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HistoriaMedica, HistoriaMedicaRq } from 'src/app/models/historia-medica';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Consumo de los servicios REST de historias clínicas.
 */
@Injectable({
  providedIn: 'root'
})
export class HistoriaMedicaService {
  private api = `historia-medica`;

  constructor(private backendService: BackendService) {}

  /** @returns todas las historias, de la más reciente a la más antigua. */
  listarHistorias(): Observable<HistoriaMedica[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /** @param historia cita atendida, diagnóstico y observaciones. */
  crearHistoria(historia: HistoriaMedicaRq): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', historia);
  }
}
