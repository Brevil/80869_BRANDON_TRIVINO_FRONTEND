import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Controles de paginación reutilizables para las tablas del sistema.
 */
@Component({
  selector: 'app-paginacion',
  imports: [CommonModule],
  template: `
    <nav *ngIf="totalPaginas > 1" [attr.aria-label]="etiqueta">
      <ul class="pagination justify-content-end mb-0">
        <li class="page-item" [class.disabled]="pagina === 1">
          <button class="page-link" type="button" [disabled]="pagina === 1" (click)="ir(pagina - 1)">Anterior</button>
        </li>
        <li class="page-item" *ngFor="let p of paginas" [class.active]="p === pagina">
          <button class="page-link" type="button" [attr.aria-current]="p === pagina ? 'page' : null" (click)="ir(p)">{{ p }}</button>
        </li>
        <li class="page-item" [class.disabled]="pagina === totalPaginas">
          <button class="page-link" type="button" [disabled]="pagina === totalPaginas" (click)="ir(pagina + 1)">Siguiente</button>
        </li>
      </ul>
    </nav>
  `
})
export class PaginacionComponent {
  /** Página actual, desde 1. */
  @Input() pagina = 1;
  /** Total de páginas disponibles. */
  @Input() totalPaginas = 1;
  /** Texto accesible para la navegación. */
  @Input() etiqueta = 'Paginación';
  /** Emite la nueva página al cambiarla. */
  @Output() paginaChange = new EventEmitter<number>();

  /** @returns lista de números de página. */
  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  /**
   * Cambia la página si está dentro del rango válido.
   *
   * @param nueva página destino.
   */
  ir(nueva: number): void {
    if (nueva >= 1 && nueva <= this.totalPaginas) {
      this.paginaChange.emit(nueva);
    }
  }
}
