import { CheckCircle2, CircleDashed, CircleX, LoaderCircle } from 'lucide-react';

export function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    completed: { label: 'Completed', className: 'border-primary/25 bg-primary/10 text-primary', icon: CheckCircle2 },
    running: { label: 'In progress', className: 'border-accent/30 bg-accent/10 text-accent-foreground', icon: LoaderCircle },
    failed: { label: 'Failed', className: 'border-destructive/25 bg-destructive/10 text-destructive', icon: CircleX },
  };
  const item = config[status] ?? { label: status, className: 'border-border bg-muted text-muted-foreground', icon: CircleDashed };
  const Icon = item.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${item.className}`} data-testid={`status-${status}`}>
      <Icon className={`h-3.5 w-3.5 ${status === 'running' ? 'animate-spin' : ''}`} />
      {item.label}
    </span>
  );
}
