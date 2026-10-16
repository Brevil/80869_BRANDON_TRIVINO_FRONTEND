import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnotacionHistoria, AnotacionHistoriaRq } from 'src/app/models/historia-medica';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Consumo de los servicios REST de anotaciones de historias clínicas.
 */
@Injectable({
  providedIn: 'root'
})
export class AnotacionHistoriaService {
  private api = `anotacion-historia`;

  constructor(private backendService: BackendService) {}

  /** @param mascotaId id de la mascota cuyo histórico se consulta. */
  listarPorMascota(mascotaId: number): Observable<AnotacionHistoria[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar',
      new HttpParams().set('mascotaId', mascotaId));
  }

  /** @param anotacion historia, veterinario, descripción, observación y diagnóstico. */
  crearAnotacion(anotacion: AnotacionHistoriaRq): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', anotacion);
  }
}
