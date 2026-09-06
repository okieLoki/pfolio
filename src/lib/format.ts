export function formatDate(date: Date, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...opts }).format(date);
}

export function year(date: Date) {
  return date.getFullYear();
}
