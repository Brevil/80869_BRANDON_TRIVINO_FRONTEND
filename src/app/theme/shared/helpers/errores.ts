/**
 * Obtiene un mensaje comprensible para el usuario a partir de un error HTTP.
 *
 * @param error error recibido del cliente HTTP.
 * @param porDefecto mensaje a usar si el backend no envía uno.
 * @returns texto para mostrar en pantalla.
 */
export function mensajeError(error: unknown, porDefecto: string): string {
  const http = error as { status?: number; error?: { message?: string } } | null;
  if (http?.status === 0) {
    return 'No se pudo comunicar con el backend. Verifique que el servicio esté en ejecución.';
  }
  return http?.error?.message ?? porDefecto;
}
