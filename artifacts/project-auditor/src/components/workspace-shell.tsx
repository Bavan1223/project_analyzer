import { Activity, ArrowRight, ClipboardCheck, FilePlus2, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'wouter';

type WorkspaceShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/analyses/new', label: 'New analysis', icon: FilePlus2 },
];

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-7">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-[-0.02em] text-sidebar-accent-foreground">Project Auditor</div>
            <div className="mono mt-0.5 text-[9px] uppercase tracking-[0.19em] text-sidebar-foreground/60">review workspace</div>
          </div>
        </div>
        <div className="flex flex-1 flex-col px-4 py-7">
          <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">Workspace</div>
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? location === '/' : location.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'}`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-sidebar-primary' : 'text-sidebar-foreground/55 group-hover:text-sidebar-primary'}`} />
                  <span>{label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary signal-dot" />}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-sidebar-primary">
              <Activity className="h-4 w-4" />
              <span className="mono text-[10px] uppercase tracking-[0.15em]">Review protocol</span>
            </div>
            <p className="text-[12px] leading-5 text-sidebar-foreground/65">Evidence first. Prioritized action. No noise.</p>
          </div>
        </div>
        <div className="border-t border-sidebar-border px-7 py-5">
          <div className="mono text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/40">AUD / 01</div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur lg:hidden">
        <Link href="/" data-testid="link-mobile-logo" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="h-4 w-4" /></div>
          <span className="text-sm font-bold">Project Auditor</span>
        </Link>
        <Link href="/analyses/new" data-testid="link-mobile-new-analysis" className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
          New analysis <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <main className="min-h-[100dvh] lg:pl-[248px]">
        <div className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-12 lg:py-11">{children}</div>
      </main>
    </div>
  );
}
