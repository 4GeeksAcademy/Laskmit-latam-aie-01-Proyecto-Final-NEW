import styles from "./incidents.module.css";
import { IncidentManager } from "./incident-manager";

export default function IncidentsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <p>Operaciones Nexova</p>
          <h1>Gestor de incidencias</h1>
          <span>Registro y seguimiento centralizado para Valencia, Miami y equipos remotos.</span>
        </header>
        <IncidentManager />
      </div>
    </main>
  );
}