# SPECS — Hito 02 (Fundamentos de Programacion)

## Estructura de carpetas/archivos
```text
/workspaces/Laskmit-latam-aie-01-Proyecto-Final/src/
├── demo.ts
├── types/
│   └── models.ts
└── utils/
    ├── collections.ts
    ├── search.ts
    ├── transformations.ts
    └── validations.ts
```

## Especificaciones de tipos y dominio
En `src/types/models.ts`:
- `Candidate` con datos personales, experiencia, skills, seniority, salarios, disponibilidad y estado.
- `Vacancy` con skills requeridas/preferidas, experiencia, ingles, seniority y rango salarial.
- `SelectionProcess` con etapa, score y timestamps.

## Funciones implementadas
En `src/utils/collections.ts`:
- `filterCandidatesBySkills(candidates, requiredSkills)`
- `filterCandidatesBySeniority(candidates, seniority)`
- `filterCandidatesByAvailability(candidates, availability)`
- `sortCandidatesBySalary(candidates, order)`
- `sortCandidatesByExperience(candidates, order)`

En `src/utils/search.ts`:
- `findCandidateById(candidates, id)`
- `findCandidateByEmail(candidates, email)`
- `binarySearchCandidateBySalary(sortedCandidates, targetSalary)`

En `src/utils/transformations.ts`:
- `calculateCandidateScore(candidate, vacancy)`
- `rankCandidatesForVacancy(candidates, vacancy)`
- `groupCandidatesBySeniority(candidates)`
- `countCandidatesByStatus(candidates)`
- `calculateAverageSalary(candidates)`
- `findTopSkills(candidates, topN)`
- `calculateVacancyFillRate(processes)`

En `src/utils/validations.ts`:
- `validateCandidate(candidate)`
- `validateVacancy(vacancy)`
- `isValidEmail(email)` (funcion interna)

## APIs
- No aplica. Este hito es logica local TypeScript sin endpoints HTTP.

## Criterios de reconocimiento rapido
- Existe separacion clara por tipo de utilidad (`collections`, `search`, `transformations`, `validations`).
- `src/demo.ts` ejecuta casos validos y casos borde/error.
