import styles from "../app/page.module.css";

export function Hero() {
  return (
    <section id="inicio" className={styles.hero}>
      <div className={styles.heroGlowA} aria-hidden="true" />
      <div className={styles.heroGlowB} aria-hidden="true" />
      <div className={`${styles.container} ${styles.heroGrid}`}>
        <div>
          <p className={styles.heroEyebrow}>Nexova | Talento estrategico</p>
          <h1 className={styles.heroTitle}>
            Construimos equipos excepcionales para empresas en crecimiento
          </h1>
          <p className={styles.heroSubtitle}>
            Consultora de recursos humanos y adquisicion de talento para empresas en crecimiento
            que buscan acelerar contrataciones clave y fortalecer sus equipos.
          </p>
          <div className={styles.heroCtas}>
            <a className={styles.primaryButton} href="/registro">
              Unete a nuestro banco de talento
            </a>
            <span>Estrategia de talento para companias en expansion</span>
          </div>
        </div>
        <aside className={styles.heroCard}>
          <p className={styles.heroCardTitle}>Como trabajamos</p>
          <ul className={styles.stepList}>
            <li>
              <span>Diagnostico y diseno del perfil</span>
              <strong>Paso 1</strong>
            </li>
            <li>
              <span>Busqueda y evaluacion de candidatos</span>
              <strong>Paso 2</strong>
            </li>
            <li>
              <span>Seguimiento de incorporacion y ajuste</span>
              <strong>Paso 3</strong>
            </li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
