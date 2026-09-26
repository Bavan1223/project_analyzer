import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleDot, FileCode2, Lightbulb, RefreshCw, ShieldAlert, Target } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { getGetAnalysisQueryKey, useGetAnalysis } from '@workspace/api-client-react';
import type { Finding } from '@workspace/api-client-react';
import { ScoreRing } from '@/components/score-ring';
import { StatusPill } from '@/components/status-pill';
import { formatDate, severityClass } from '@/lib/format';

function ReportSkeleton() {
  return <div className="space-y-6" data-testid="loading-analysis-report"><div className="h-5 w-32 animate-pulse rounded bg-muted" /><div className="h-56 animate-pulse rounded-2xl bg-muted" /><div className="grid gap-5 lg:grid-cols-2"><div className="h-56 animate-pulse rounded-2xl bg-muted" /><div className="h-56 animate-pulse rounded-2xl bg-muted" /></div></div>;
}

function FindingCard({ finding, open, onToggle }: { finding: Finding; open: boolean; onToggle: () => void }) {
  return (
    <article className={`rounded-xl border bg-card ${open ? 'border-primary/35 shadow-sm' : 'border-border'}`} data-testid={`finding-card-${finding.id}`}>
      <button type="button" onClick={onToggle} data-testid={`button-toggle-finding-${finding.id}`} className="flex w-full items-start gap-4 p-5 text-left hover:bg-muted/25">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${severityClass(finding.severity)}`}><CircleDot className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2"><span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${severityClass(finding.severity)}`}>{finding.severity}</span><span className="text-[11px] text-muted-foreground">{finding.category}</span><span className="text-border">/</span><span className="text-[11px] text-muted-foreground">{finding.effort.replace('-', ' ')}</span></div>
          <h3 className="text-sm font-semibold leading-5">{finding.title}</h3>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{finding.summary}</p>
        </div>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="grid gap-4 border-t border-border bg-muted/[0.18] px-5 py-5 sm:grid-cols-2">
        <div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><BookOpen className="h-3.5 w-3.5" /> Evidence</div><p className="report-prose text-xs leading-5 text-foreground/75">{finding.evidence}</p>{finding.fileRef && <div className="mt-3 inline-flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground"><FileCode2 className="h-3 w-3" /> {finding.fileRef}</div>}</div>
        <div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><Target className="h-3.5 w-3.5" /> Recommended move</div><p className="report-prose text-xs leading-5 text-foreground/75">{finding.recommendation}</p><div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground"><span className="rounded bg-background px-2 py-1">Status: {finding.status}</span></div></div>
      </div>}
    </article>
  );
}

export default function AnalysisReport() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const analysisQuery = useGetAnalysis(Number.isFinite(id) ? id : 0, { query: { enabled: Number.isFinite(id) && id > 0, queryKey: getGetAnalysisQueryKey(Number.isFinite(id) ? id : 0) } });
  const [severityFilter, setSeverityFilter] = useState('all');
  const [openFinding, setOpenFinding] = useState<number | null>(null);
  const report = analysisQuery.data;
  const findings = useMemo(() => report?.findings?.filter((finding) => severityFilter === 'all' || finding.severity === severityFilter) ?? [], [report?.findings, severityFilter]);

  if (analysisQuery.isLoading) return <ReportSkeleton />;
  if (analysisQuery.isError || !report) return <div className="flex min-h-[430px] flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-card px-6 text-center" data-testid="error-analysis-report"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><ShieldAlert className="h-5 w-5" /></div><h1 className="text-lg font-semibold">This report could not be loaded</h1><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">The review may still be running, or the report link is no longer available.</p><div className="mt-5 flex gap-3"><button type="button" onClick={() => analysisQuery.refetch()} data-testid="button-retry-report" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"><RefreshCw className="h-4 w-4" /> Try again</button><Link href="/" data-testid="link-report-error-overview" className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Overview</Link></div></div>;

  const severityCounts = ['critical', 'high', 'medium', 'low'].map((severity) => ({ severity, count: report.findings.filter((finding) => finding.severity === severity).length }));

  return (
    <div className="space-y-7 workspace-enter" data-testid={`page-analysis-report-${report.id}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" data-testid="link-report-back" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to overview</Link>
        <div className="flex items-center gap-3"><StatusPill status={report.status} /><span className="mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{formatDate(report.createdAt)}</span></div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card" data-testid="report-header">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_210px] lg:items-center">
          <div><div className="mono mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Project audit / report {String(report.id).padStart(3, '0')}</div><h1 className="max-w-2xl text-3xl font-bold tracking-[-0.055em] sm:text-[42px]">{report.name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{report.description}</p><div className="mt-5 flex flex-wrap gap-2">{report.techStack.map((stack) => <span key={stack} className="rounded-md border border-border bg-muted/50 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">{stack}</span>)}</div></div>
          <div className="flex items-center justify-start gap-5 border-t border-border pt-6 lg:flex-col lg:border-l lg:border-t-0 lg:pt-0"><ScoreRing score={report.score} grade={report.grade} /><div className="lg:text-center"><div className="mono text-[9px] uppercase tracking-[0.17em] text-muted-foreground">Overall health</div><div className="mt-1 text-xs text-muted-foreground">{report.findings.length} findings identified</div></div></div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.13fr_.87fr]">
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-7" data-testid="executive-summary">
          <div className="mb-5 flex items-center gap-2 text-primary"><BookOpen className="h-4 w-4" /><span className="mono text-[10px] font-semibold uppercase tracking-[0.17em]">Executive summary</span></div>
          <p className="report-prose text-[15px] leading-7 text-foreground/80">{report.executiveSummary}</p>
          <div className="mt-6 rounded-xl border-l-2 border-primary bg-primary/[0.045] px-4 py-4"><div className="mono text-[9px] font-semibold uppercase tracking-[0.17em] text-primary">Recommendation</div><p className="mt-2 text-sm font-semibold leading-6">{report.recommendation}</p></div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-7" data-testid="strengths-section">
          <div className="mb-5 flex items-center gap-2 text-primary"><Check className="h-4 w-4" /><span className="mono text-[10px] font-semibold uppercase tracking-[0.17em]">What is working</span></div>
          <ul className="space-y-3">{report.strengths.map((strength, index) => <li key={`${strength}-${index}`} className="flex gap-3 text-sm leading-6 text-foreground/78"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{strength}</li>)}</ul>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card" data-testid="category-scores-section">
        <div className="border-b border-border px-6 py-5 sm:px-7"><div className="flex items-center gap-2 text-primary"><CircleDot className="h-4 w-4" /><span className="mono text-[10px] font-semibold uppercase tracking-[0.17em]">Signal map</span></div><h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">Category scores</h2></div>
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">{report.categoryScores.map((category) => <div key={category.category} className="bg-card p-5 sm:p-6" data-testid={`report-category-${category.category}`}><div className="flex items-end justify-between"><h3 className="text-sm font-semibold">{category.category}</h3><span className="mono text-lg font-semibold text-primary">{category.score}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${category.score}%` }} /></div><p className="mt-3 text-xs leading-5 text-muted-foreground">{category.note}</p></div>)}</div>
      </section>

      <section className="space-y-4" data-testid="findings-section">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-accent-foreground"><Lightbulb className="h-4 w-4" /><span className="mono text-[10px] font-semibold uppercase tracking-[0.17em]">Evidence queue</span></div><h2 className="mt-1 text-2xl font-bold tracking-[-0.04em]">Prioritized findings</h2><p className="mt-1 text-sm text-muted-foreground">Start with the highest signal. Open a finding to inspect evidence and the recommended move.</p></div><div className="flex flex-wrap gap-1.5">{[{ value: 'all', label: `All ${report.findings.length}` }, ...severityCounts.map(({ severity, count }) => ({ value: severity, label: `${severity} ${count}` }))].map((filter) => <button type="button" key={filter.value} onClick={() => setSeverityFilter(filter.value)} data-testid={`button-filter-${filter.value}`} className={`rounded-md border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${severityFilter === filter.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}>{filter.label}</button>)}</div></div>
        {findings.length ? <div className="space-y-3">{findings.map((finding) => <FindingCard key={finding.id} finding={finding} open={openFinding === finding.id} onToggle={() => setOpenFinding(openFinding === finding.id ? null : finding.id)} />)}</div> : <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">No findings match this severity filter.</div>}
      </section>

      <div className="flex flex-col justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="h-4 w-4 text-primary" /> Report generated from the submitted project snapshot</div><Link href="/analyses/new" data-testid="link-run-another-review" className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Run another review <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link></div>
    </div>
  );
}