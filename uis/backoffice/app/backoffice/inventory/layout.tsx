import styles from "./inventory.module.css";

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}