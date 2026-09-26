import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, ClipboardList, FileSearch, RefreshCw, ScanLine, ShieldAlert, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useGetAnalysis, useGetDashboardSummary, useListAnalyses, getGetAnalysisQueryKey } from '@workspace/api-client-react';
import { ScoreRing } from '@/components/score-ring';
import { StatusPill } from '@/components/status-pill';
import { formatRelativeDate, severityClass } from '@/lib/format';

function LoadingOverview() {
  return <div className="space-y-7" data-testid="loading-overview">
    <div className="h-7 w-56 animate-pulse rounded bg-muted" />
    <div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><div className="h-80 animate-pulse rounded-xl bg-muted" /><div className="h-80 animate-pulse rounded-xl bg-muted" /></div>
  </div>;
}

function QueryError({ onRetry }: { onRetry: () => void }) {
  return <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-card px-6 text-center" data-testid="error-overview">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><ShieldAlert className="h-5 w-5" /></div>
    <h2 className="text-lg font-semibold">The review workspace is unavailable</h2>
    <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">We could not load your latest review signal. Try again, or check the API service status.</p>
    <button type="button" onClick={onRetry} data-testid="button-retry-overview" className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"><RefreshCw className="h-4 w-4" /> Try again</button>
  </div>;
}

export default function Overview() {
  const summaryQuery = useGetDashboardSummary();
  const analysesQuery = useListAnalyses();
  const latest = summaryQuery.data?.recentAnalyses?.[0];
  const latestQuery = useGetAnalysis(latest?.id ?? 0, { query: { enabled: Boolean(latest?.id), queryKey: getGetAnalysisQueryKey(latest?.id ?? 0) } });

  if (summaryQuery.isLoading) return <LoadingOverview />;
  if (summaryQuery.isError) return <QueryError onRetry={() => summaryQuery.refetch()} />;
  const summary = summaryQuery.data;
  const recent = analysesQuery.data ?? summary?.recentAnalyses ?? [];
  const report = latestQuery.data;

  return (
    <div className="space-y-8 workspace-enter" data-testid="page-overview">
      <section className="flex flex-col justify-between gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end">
        <div>
          <div className="mono mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Engineering review / workspace</div>
          <h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-[38px]">Your review desk</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">A clear read on what is healthy, what is exposed, and what to do next.</p>
        </div>
        <Link href="/analyses/new" data-testid="link-start-analysis" className="group inline-flex items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-primary/90 sm:self-auto">
          <ScanLine className="h-4 w-4" /> Start a new review <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Projects reviewed', value: summary?.totalAnalyses ?? 0, note: 'Across your workspace', icon: ClipboardList, accent: 'text-primary' },
          { label: 'Average score', value: `${Math.round(summary?.averageScore ?? 0)}`, note: 'Review health index', icon: BarChart3, accent: 'text-chart-3' },
          { label: 'Open findings', value: summary?.openFindings ?? 0, note: 'Items needing attention', icon: AlertTriangle, accent: 'text-accent-foreground' },
          { label: 'Critical issues', value: summary?.criticalIssues ?? 0, note: 'Require immediate focus', icon: ShieldAlert, accent: 'text-destructive' },
        ].map(({ label, value, note, icon: Icon, accent }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_0_hsl(var(--border))]" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
            <div className="flex items-start justify-between"><span className="text-xs font-medium text-muted-foreground">{label}</span><Icon className={`h-4 w-4 ${accent}`} /></div>
            <div className="mt-4 text-3xl font-bold tracking-[-0.05em]">{value}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{note}</div>
          </div>
        ))}
      </section>

      {!latest && !summary?.totalAnalyses ? (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.035] px-6 py-14 text-center" data-testid="empty-overview">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileSearch className="h-7 w-7" /></div>
          <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em]">Your first review starts here</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Share a project snapshot and get a structured read on architecture, readiness, and the next high-leverage moves.</p>
          <Link href="/analyses/new" data-testid="link-empty-start-analysis" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Submit a snapshot <ArrowRight className="h-4 w-4" /></Link>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.08fr_.92fr]">
          <section className="overflow-hidden rounded-2xl border border-border bg-card" data-testid="latest-review-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div><div className="mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">Latest review</div><h2 className="mt-1 text-lg font-semibold tracking-[-0.025em]">{latest?.name ?? 'Loading report'}</h2></div>
              {latest && <Link href={`/analyses/${latest.id}`} data-testid={`link-latest-analysis-${latest.id}`} className="text-xs font-semibold text-primary hover:underline">Open report <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link>}
            </div>
            {latestQuery.isLoading ? <div className="m-6 h-52 animate-pulse rounded-xl bg-muted" /> : report ? (
              <div className="grid gap-7 p-6 md:grid-cols-[170px_1fr]">
                <div className="flex flex-col items-center justify-center rounded-xl bg-primary/[0.045] py-5"><ScoreRing score={report.score} grade={report.grade} /><div className="mono mt-3 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Health index</div></div>
                <div className="space-y-5">
                  <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" /> Executive read</div><p className="report-prose text-sm leading-6 text-foreground/80">{report.executiveSummary}</p></div>
                  <div className="rounded-lg border-l-2 border-primary bg-primary/[0.045] px-4 py-3"><div className="mono text-[9px] uppercase tracking-[0.16em] text-primary">Recommendation</div><p className="mt-1.5 text-sm font-medium leading-5">{report.recommendation}</p></div>
                </div>
              </div>
            ) : <div className="p-8 text-sm text-muted-foreground">The latest review is still being assembled.</div>}
          </section>

          <section className="rounded-2xl border border-border bg-card" data-testid="category-health-card">
            <div className="border-b border-border px-6 py-4"><div className="mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">Signal by category</div><h2 className="mt-1 text-lg font-semibold tracking-[-0.025em]">Category health</h2></div>
            <div className="space-y-4 p-6">
              {report?.categoryScores?.length ? report.categoryScores.map((category) => (
                <div key={category.category} data-testid={`category-score-${category.category}`}>
                  <div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-semibold">{category.category}</span><span className="mono text-muted-foreground">{category.score}/100</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${category.score}%` }} /></div>
                  <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{category.note}</p>
                </div>
              )) : <div className="py-8 text-center text-sm text-muted-foreground">Category signals appear with the completed report.</div>}
            </div>
          </section>
        </div>
      )}

      {report?.findings?.length ? <section className="rounded-2xl border border-border bg-card" data-testid="key-findings-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4"><div><div className="mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">Evidence queue</div><h2 className="mt-1 text-lg font-semibold tracking-[-0.025em]">Key findings</h2></div><Link href={`/analyses/${report.id}`} data-testid="link-review-findings" className="text-xs font-semibold text-primary hover:underline">Review all <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
        <div className="divide-y divide-border">{report.findings.slice(0, 4).map((finding) => <div key={finding.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between" data-testid={`finding-row-${finding.id}`}><div><div className="mb-1.5 flex items-center gap-2"><span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${severityClass(finding.severity)}`}>{finding.severity}</span><span className="text-[11px] text-muted-foreground">{finding.category}</span></div><div className="text-sm font-semibold">{finding.title}</div></div><span className="mono shrink-0 text-[10px] text-muted-foreground">{finding.effort.replace('-', ' ')}</span></div>)}</div>
      </section> : null}

      <section className="rounded-2xl border border-border bg-card" data-testid="recent-analyses-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4"><div><div className="mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">Review log</div><h2 className="mt-1 text-lg font-semibold tracking-[-0.025em]">Recent analyses</h2></div><span className="text-xs text-muted-foreground">{recent.length} total</span></div>
        {recent.length ? <div className="divide-y divide-border">{recent.slice(0, 6).map((analysis) => <Link href={`/analyses/${analysis.id}`} key={analysis.id} data-testid={`row-analysis-${analysis.id}`} className="flex flex-col gap-3 px-6 py-4 hover:bg-muted/45 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{analysis.name}</div><div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground"><span>{formatRelativeDate(analysis.createdAt)}</span><span className="text-border">/</span><span>{analysis.criticalCount} critical · {analysis.highCount} high</span></div></div><div className="flex items-center gap-4"><StatusPill status={analysis.status} /><span className="mono w-9 text-right text-sm font-semibold">{analysis.score}</span><ArrowRight className="h-4 w-4 text-muted-foreground" /></div></Link>)}</div> : <div className="p-10 text-center text-sm text-muted-foreground">No analyses yet. Submit a project snapshot to start your review log.</div>}
      </section>
    </div>
  );
}