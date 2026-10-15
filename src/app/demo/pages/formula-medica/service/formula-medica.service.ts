import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FormulaMedicaService {
  private api = `formula-medica`;

  constructor(private backendService: BackendService) {}

  listarFormulas(): Observable<FormulaMedica[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  // El backend aún no expone /guardar ni /actualizar para fórmulas médicas.
  crearFormula(formula: FormulaMedica): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', formula);
  }

  actualizarFormula(formula: FormulaMedica): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'actualizar', formula);
  }
}
