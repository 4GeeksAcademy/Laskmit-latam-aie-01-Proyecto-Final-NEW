"use client";

import { initTelemetry } from "../lib/telemetry-init";

/**
 * TelemetryInitComponent — Componente cliente que inicializa la telemetría
 * al cargarse. Se incluye en layout.tsx para que los handlers globales
 * (errores, rendimiento, web vitals) queden registrados al arrancar.
 */
export function TelemetryInit() {
  // Inicializar telemetría
  initTelemetry();

  // Este componente no renderiza nada visible
  return null;
}