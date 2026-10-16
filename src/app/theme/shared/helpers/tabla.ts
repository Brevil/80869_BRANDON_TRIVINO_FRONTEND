/**
 * Utilidades para las tablas (DataTable) del sistema: búsqueda, orden y paginación en memoria.
 */

/** Valor que se puede ordenar en una columna. */
export type ValorOrdenable = string | number | Date | null | undefined;

/**
 * Normaliza texto para comparar sin distinguir mayúsculas ni tildes.
 *
 * @param texto texto original.
 * @returns texto en minúsculas y sin diacríticos.
 */
export function normalizarTexto(texto: string): string {
  return texto.toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Filtra los elementos que contienen el término en alguno de los valores extraídos.
 *
 * @param items lista original.
 * @param termino texto a buscar; vacío devuelve la lista completa.
 * @param valores función que devuelve los valores de búsqueda de cada elemento.
 * @returns elementos que coinciden con el término.
 */
export function filtrarPorTexto<T>(items: T[], termino: string, valores: (item: T) => unknown[]): T[] {
  const buscado = normalizarTexto(termino.trim());
  if (!buscado) {
    return items;
  }
  return items.filter((item) =>
    valores(item).some((v) => normalizarTexto(String(v ?? '')).includes(buscado))
  );
}

/**
 * Ordena una copia de la lista según el valor de cada elemento. Los valores vacíos van al final.
 *
 * @param items lista original (no se modifica).
 * @param valor función que devuelve el valor a ordenar.
 * @param ascendente true para orden ascendente.
 * @returns nueva lista ordenada.
 */
export function ordenarPor<T>(items: T[], valor: (item: T) => ValorOrdenable, ascendente: boolean): T[] {
  const sentido = ascendente ? 1 : -1;
  return [...items].sort((a, b) => {
    const va = aComparable(valor(a));
    const vb = aComparable(valor(b));
    if (va === vb) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    return (va < vb ? -1 : 1) * sentido;
  });
}

/**
 * Devuelve la página solicitada de una lista.
 *
 * @param items lista completa.
 * @param pagina número de página, desde 1.
 * @param porPagina registros por página.
 * @returns elementos de la página.
 */
export function paginar<T>(items: T[], pagina: number, porPagina: number): T[] {
  const inicio = (pagina - 1) * porPagina;
  return items.slice(inicio, inicio + porPagina);
}

/**
 * Calcula el número total de páginas (mínimo 1).
 *
 * @param total número total de registros.
 * @param porPagina registros por página.
 * @returns total de páginas.
 */
export function totalPaginas(total: number, porPagina: number): number {
  return Math.max(1, Math.ceil(total / porPagina));
}

/**
 * Convierte un valor ordenable a un tipo comparable: fechas a milisegundos y texto a minúsculas.
 *
 * @param v valor original.
 * @returns valor comparable o null si está vacío.
 */
function aComparable(v: ValorOrdenable): number | string | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  return normalizarTexto(String(v));
}
