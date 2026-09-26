export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export function formatRelativeDate(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(value);
}

export function severityClass(severity: string) {
  return {
    critical: 'border-destructive/30 bg-destructive/10 text-destructive',
    high: 'border-accent/35 bg-accent/10 text-accent-foreground',
    medium: 'border-chart-3/30 bg-chart-3/10 text-chart-3',
    low: 'border-primary/25 bg-primary/10 text-primary',
  }[severity] ?? 'border-border bg-muted text-muted-foreground';
}