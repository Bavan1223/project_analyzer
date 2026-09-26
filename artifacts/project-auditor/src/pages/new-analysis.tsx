import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Braces, CheckCircle2, FileArchive, Info, LoaderCircle, Send, Sparkles, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getGetDashboardSummaryQueryKey, getListAnalysesQueryKey } from '@workspace/api-client-react';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const snapshotSchema = z.object({
  name: z.string().min(1, 'Give this project a name.'),
  description: z.string().min(20, 'Add a little more context so the reviewer can orient quickly.'),
  techStack: z.string().optional(),
  currentState: z.string().optional(),
  goals: z.string().optional(),
});

type SnapshotForm = z.infer<typeof snapshotSchema>;

const fieldClass = 'min-h-11 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/65 focus:border-primary focus:ring-2 focus:ring-primary/15';
const areaClass = `${fieldClass} min-h-[112px] resize-y leading-6`;

export default function NewAnalysis() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const form = useForm<SnapshotForm>({
    resolver: zodResolver(snapshotSchema),
    defaultValues: { name: '', description: '', techStack: '', currentState: '', goals: '' },
  });

  async function onSubmit(values: SnapshotForm) {
    if (!zipFile) {
      setUploadError('Attach the complete project as a ZIP archive before starting the review.');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append('projectName', values.name.trim());
      body.append('description', values.description.trim());
      body.append('techStack', values.techStack?.trim() ?? '');
      body.append('currentState', values.currentState?.trim() ?? '');
      body.append('goals', values.goals?.trim() ?? '');
      body.append('projectZip', zipFile);

      const response = await fetch('/api/analyses/upload', { method: 'POST', body });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'The archive could not be reviewed.');
      }

      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
      setLocation(`/analyses/${payload.id}`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'The archive could not be reviewed.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1020px] workspace-enter" data-testid="page-new-analysis">
      <div className="mb-8">
        <Link href="/" data-testid="link-back-overview" className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to overview</Link>
        <div className="grid gap-6 lg:grid-cols-[1fr_270px] lg:items-end">
          <div>
            <div className="mono mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">New review / project snapshot</div>
            <h1 className="text-3xl font-bold tracking-[-0.05em] sm:text-[40px]">Give the reviewer<br className="hidden sm:block" /> something real to inspect.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">A useful report starts with honest context. Share what you have, including the rough edges. The reviewer will turn it into evidence and next actions.</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/[0.045] p-4">
            <div className="flex items-center gap-2 text-primary"><Sparkles className="h-4 w-4" /><span className="mono text-[10px] font-semibold uppercase tracking-[0.16em]">What you get</span></div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">An executive read, health score, category breakdown, and prioritized findings with evidence.</p>
          </div>
        </div>
      </div>

      {uploadError && <div className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/[0.06] p-4 text-sm" data-testid="error-create-analysis"><Info className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /><div><div className="font-semibold text-destructive">The archive could not be reviewed.</div><p className="mt-1 text-muted-foreground">{uploadError}</p></div></div>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <div className="mb-6 flex items-start gap-3 border-b border-border pb-5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Braces className="h-4 w-4" /></div><div><h2 className="font-semibold">The project</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Orient the report around a specific codebase or product surface.</p></div></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel className="text-xs font-semibold">Project name</FormLabel><FormControl><input {...field} className={fieldClass} placeholder="e.g. Atlas billing service" data-testid="input-project-name" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="techStack" render={({ field }) => <FormItem><FormLabel className="text-xs font-semibold">Tech stack</FormLabel><FormControl><input {...field} className={fieldClass} placeholder="TypeScript, Postgres, React" data-testid="input-tech-stack" /></FormControl><FormDescription className="text-[11px]">Separate technologies with commas.</FormDescription><FormMessage /></FormItem>} />
              <div className="sm:col-span-2"><FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel className="text-xs font-semibold">What is it?</FormLabel><FormControl><textarea {...field} className={areaClass} placeholder="A short description of the product, service, or system and who relies on it." data-testid="input-project-description" /></FormControl><FormMessage /></FormItem>} /></div>
              <div className="sm:col-span-2"><FormField control={form.control} name="currentState" render={({ field }) => <FormItem><FormLabel className="text-xs font-semibold">Current state</FormLabel><FormControl><textarea {...field} className={areaClass} placeholder="What is shipped? What is in flight? Where do you already feel risk or friction?" data-testid="input-current-state" /></FormControl><FormMessage /></FormItem>} /></div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <div className="mb-6 flex items-start gap-3 border-b border-border pb-5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground"><FileArchive className="h-4 w-4" /></div><div><h2 className="font-semibold">Intent and evidence</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">The archive gives the reviewer real evidence instead of a generic checklist.</p></div></div>
            <div className="space-y-5">
              <div>
                <label htmlFor="project-zip" className="text-xs font-semibold">Complete project ZIP <span className="font-normal text-muted-foreground">(required)</span></label>
                <div className="mt-2 rounded-xl border border-dashed border-primary/35 bg-primary/[0.035] p-4">
                  <input id="project-zip" type="file" accept=".zip,application/zip" className="sr-only" data-testid="input-project-zip" onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;
                    if (nextFile && nextFile.size > 50 * 1024 * 1024) {
                      setZipFile(null);
                      setUploadError('Keep the ZIP archive under 50 MB for this review.');
                      return;
                    }
                    setZipFile(nextFile);
                    setUploadError('');
                  }} />
                  <label htmlFor="project-zip" className="flex cursor-pointer flex-col items-center justify-center gap-2 py-5 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><UploadCloud className="h-5 w-5" /></span>
                    <span className="text-sm font-semibold">{zipFile ? zipFile.name : 'Choose the complete project archive'}</span>
                    <span className="text-xs text-muted-foreground">{zipFile ? `${(zipFile.size / 1024 / 1024).toFixed(1)} MB ready for inspection` : 'ZIP only · up to 50 MB · include source, config, and tests'}</span>
                  </label>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">The archive is inspected for this report and only the resulting report is saved. Do not include secrets, private keys, or production credentials.</p>
              </div>
              <FormField control={form.control} name="goals" render={({ field }) => <FormItem><FormLabel className="text-xs font-semibold">Goals for this review <span className="font-normal text-muted-foreground">(optional)</span></FormLabel><FormControl><textarea {...field} className={areaClass} placeholder={'One goal per line\\n• Prepare for the next 10x in traffic\\n• Reduce operational surprises'} data-testid="input-review-goals" /></FormControl><FormDescription className="text-[11px]">Tell the reviewer what a good outcome looks like.</FormDescription><FormMessage /></FormItem>} />
            </div>
          </section>

          <div className="flex flex-col-reverse items-stretch justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Your snapshot is only used to create this review.</div>
            <button type="submit" disabled={isUploading} data-testid="button-submit-analysis" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70">
              {isUploading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Inspecting project…</> : <><Send className="h-4 w-4" /> Run deep project review <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}