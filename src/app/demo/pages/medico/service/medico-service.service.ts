import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Veterinario } from 'src/app/models/medico';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Consulta de veterinarios para los formularios de citas, fórmulas e historias.
 */
@Injectable({
  providedIn: 'root'
})
export class MedicoServiceService {
  private api = `medico`;

  constructor(private backendService: BackendService) { }

  /** @returns veterinarios ordenados por nombre. */
  listarMedicos(): Observable<Veterinario[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }
}
