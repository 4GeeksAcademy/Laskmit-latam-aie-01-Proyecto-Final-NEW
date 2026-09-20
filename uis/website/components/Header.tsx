import type { NavItem } from "./types";
import styles from "../app/page.module.css";

type HeaderProps = {
  items: NavItem[];
};

export function Header({ items }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <a className={styles.brand} href="#inicio" aria-label="Ir al inicio de Nexova">
          <span className={styles.brandMark} aria-hidden="true">N</span>
          <span className={styles.brandText}>Nexova</span>
        </a>
        <nav aria-label="Navegacion principal">
          <ul className={styles.navList}>
            {items.map((item) => (
              <li key={item.href}>
                <a className={styles.navLink} href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
