export function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatExperienceYears(value: number): string {
  if (value === 1) {
    return "1 ano";
  }

  return `${value} anos`;
}