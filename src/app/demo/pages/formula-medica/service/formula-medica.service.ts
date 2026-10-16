import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FormulaMedica, FormulaMedicaRq, Medicamento } from 'src/app/models/formula-medica';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Consumo de los servicios REST de fórmulas médicas.
 */
@Injectable({
  providedIn: 'root'
})
export class FormulaMedicaService {
  private api = `formula-medica`;

  constructor(private backendService: BackendService) {}

  /** @returns fórmulas ordenadas por fecha de creación descendente. */
  listarFormulas(): Observable<FormulaMedica[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /** @param id id de la fórmula. */
  buscarFormula(id: number): Observable<FormulaMedica> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }

  /** @returns medicamentos disponibles para prescribir. */
  listarMedicamentos(): Observable<Medicamento[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'medicamentos');
  }

  /** @param formula datos de la nueva fórmula. */
  crearFormula(formula: FormulaMedicaRq): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', formula);
  }

  /** @param formula datos de la fórmula a editar, incluido su id. */
  actualizarFormula(formula: FormulaMedicaRq): Observable<unknown> {
    return this.backendService.put(environment.apiUrlAuth, this.api, 'actualizar', formula);
  }
}
