type ScoreRingProps = { score: number; grade?: string; size?: 'large' | 'small' };

export function ScoreRing({ score, grade, size = 'large' }: ScoreRingProps) {
  const radius = size === 'large' ? 53 : 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;
  return (
    <div className={`relative flex shrink-0 items-center justify-center ${size === 'large' ? 'h-[148px] w-[148px]' : 'h-[82px] w-[82px]'}`} data-testid={`score-ring-${size}`}>
      <svg className="-rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={size === 'large' ? 8 : 6} />
        <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeWidth={size === 'large' ? 8 : 6} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute text-center">
        <div className={`${size === 'large' ? 'text-[38px]' : 'text-xl'} font-bold leading-none tracking-[-0.06em]`}>{Math.round(score)}</div>
        {grade && <div className="mono mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Grade {grade}</div>}
      </div>
    </div>
  );
}
