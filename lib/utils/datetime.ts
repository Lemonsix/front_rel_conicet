/**
 * Utilidades para manejo robusto de fechas y horas
 * Especialmente diseñado para parsear timestamps ISO 8601 como "2017-06-28T16:48:00"
 */

/**
 * Parsea una fecha/hora ISO 8601 y devuelve solo la parte de hora en formato HH:MM
 * @param timestamp String en formato ISO 8601 o cualquier formato de fecha válido
 * @returns String con formato "HH:MM" o cadena vacía si no se puede parsear
 */
export function formatTimeFromISO(
  timestamp: string | null | undefined
): string {
  if (!timestamp) return "";

  try {
    // Intentar parsear el timestamp
    let date: Date;

    // Si es un timestamp ISO completo (2017-06-28T16:48:00)
    if (timestamp.includes("T")) {
      date = new Date(timestamp);
    }
    // Si solo es una hora (16:48:00)
    else if (timestamp.includes(":")) {
      // Crear una fecha ficticia para extraer la hora
      date = new Date(`1970-01-01T${timestamp}`);
    }
    // Intentar parseo directo
    else {
      date = new Date(timestamp);
    }

    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) {
      console.warn(`Invalid timestamp: ${timestamp}`);
      return "";
    }

    // Formatear como HH:MM
    return date.toTimeString().slice(0, 5);
  } catch (error) {
    console.error(`Error parsing timestamp "${timestamp}":`, error);
    return "";
  }
}

/**
 * Parsea una fecha ISO 8601 y devuelve solo la parte de fecha en formato DD/MM/YYYY
 * @param dateString String en formato ISO 8601 o cualquier formato de fecha válido
 * @returns String con formato "DD/MM/YYYY" o cadena vacía si no se puede parsear
 */
export function formatDateFromISO(
  dateString: string | null | undefined
): string {
  if (!dateString) return "";

  try {
    let date: Date;

    // Si es un timestamp completo, extraer solo la fecha
    if (dateString.includes("T")) {
      date = new Date(dateString.split("T")[0]);
    } else {
      date = new Date(dateString);
    }

    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}`);
      return "";
    }

    // Formatear como DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error(`Error parsing date "${dateString}":`, error);
    return "";
  }
}

/**
 * Combina fecha y hora en un timestamp ISO 8601
 * @param date Fecha en formato string (YYYY-MM-DD o DD/MM/YYYY)
 * @param time Hora en formato string (HH:MM o HH:MM:SS)
 * @returns String en formato ISO 8601 o null si hay error
 */
export function combineDateTime(date: string, time: string): string | null {
  if (!date || !time) return null;

  try {
    // Normalizar la fecha al formato YYYY-MM-DD
    let normalizedDate = date;
    if (date.includes("/")) {
      const [day, month, year] = date.split("/");
      normalizedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;
    }

    // Normalizar la hora para incluir segundos si no los tiene
    let normalizedTime = time;
    if (time.split(":").length === 2) {
      normalizedTime = `${time}:00`;
    }

    const timestamp = `${normalizedDate}T${normalizedTime}`;

    // Verificar que el timestamp resultante sea válido
    const testDate = new Date(timestamp);
    if (isNaN(testDate.getTime())) {
      console.warn(`Invalid combined timestamp: ${timestamp}`);
      return null;
    }

    return timestamp;
  } catch (error) {
    console.error(`Error combining date "${date}" and time "${time}":`, error);
    return null;
  }
}

/**
 * Convierte un timestamp a formato legible para mostrar en UI
 * @param timestamp String en formato ISO 8601
 * @returns String con formato "DD/MM/YYYY HH:MM" o mensaje de error
 */
export function formatTimestampForDisplay(
  timestamp: string | null | undefined
): string {
  if (!timestamp) return "Fecha no disponible";

  const date = formatDateFromISO(timestamp);
  const time = formatTimeFromISO(timestamp);

  if (!date && !time) return "Formato de fecha inválido";
  if (!time) return date;
  if (!date) return time;

  return `${date} ${time}`;
}

/**
 * Obtiene solo la hora de un timestamp, con manejo robusto de errores
 * @param timestamp String con timestamp completo o solo hora
 * @returns String con la hora en formato HH:MM o cadena vacía si hay error
 */
export function safeGetTime(timestamp: string | null | undefined): string {
  return formatTimeFromISO(timestamp);
}

/**
 * Obtiene solo la fecha de un timestamp, con manejo robusto de errores
 * @param timestamp String con timestamp completo o solo fecha
 * @returns String con la fecha en formato DD/MM/YYYY o cadena vacía si hay error
 */
export function safeGetDate(timestamp: string | null | undefined): string {
  return formatDateFromISO(timestamp);
}
