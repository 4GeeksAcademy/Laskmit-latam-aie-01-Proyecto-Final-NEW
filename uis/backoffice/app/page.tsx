import styles from "./page.module.css";
import { demoData } from "./demo-data";
import {
  calculateAverageSalary,
  calculateCandidateScore,
  calculateVacancyFillRate,
  countCandidatesByStatus,
  findTopSkills,
  rankCandidatesForVacancy,
} from "../../../src/utils/transformations";

const candidates = demoData.candidates;
const vacancy = demoData.vacancy;
const sampleProcesses = demoData.sampleProcesses;

export default function Home() {
  const ranked = rankCandidatesForVacancy(candidates, vacancy);
  const statusCount = countCandidatesByStatus(candidates);
  const topSkills = findTopSkills(candidates, 3);
  const avgSalary = calculateAverageSalary(candidates);
  const fillRate = calculateVacancyFillRate(sampleProcesses);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <p className={styles.kicker}>Backoffice Nexova</p>
          <h1>Panel interno de Talent Pipeline</h1>
          <p>
            Esta vista consume la logica de negocio de Hito 2 importada desde
            <strong> src/utils/transformations.ts</strong> sin duplicar codigo.
          </p>
        </header>

        <section className={styles.metricsGrid}>
          <article className={styles.metricCard}>
            <h2>Salario esperado promedio</h2>
            <p>USD {avgSalary.toLocaleString("en-US")}</p>
          </article>
          <article className={styles.metricCard}>
            <h2>Tasa de vacante cubierta</h2>
            <p>{fillRate}%</p>
          </article>
          <article className={styles.metricCard}>
            <h2>Candidatos activos</h2>
            <p>{statusCount.Active}</p>
          </article>
          <article className={styles.metricCard}>
            <h2>En proceso</h2>
            <p>{statusCount["In process"]}</p>
          </article>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Ranking para la vacante: {vacancy.title}</h2>
            <span>{ranked.length} candidatos evaluados</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Candidato</th>
                <th>Seniority</th>
                <th>Skills clave</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((item) => (
                <tr key={item.candidate.id}>
                  <td>{item.candidate.fullName}</td>
                  <td>{item.candidate.seniority}</td>
                  <td>{item.candidate.skills.slice(0, 3).join(", ")}</td>
                  <td>{calculateCandidateScore(item.candidate, vacancy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.panel}>
          <h2>Top habilidades detectadas</h2>
          <ul className={styles.skillList}>
            {topSkills.map((skill) => (
              <li key={skill.skill}>
                <span>{skill.skill}</span>
                <strong>{skill.count}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel}>
          <h2>Estado de procesos demo</h2>
          <ul className={styles.processList}>
            {sampleProcesses.map((process) => (
              <li key={process.id}>
                <span>{process.id}</span>
                <span>{process.stage}</span>
                <span>{process.score}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className={styles.note}>
          Integracion validada por importacion directa desde el modulo original de Hito 2.
        </div>
      </main>
    </div>
  );
}
