import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface Props { lines: string[]; label: string; context?: string; }

/** A presentation-only transmission: never delays or controls a state transition. */
export function TerminalSequence({ lines, label, context }: Props) {
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const signature = lines.join('\n');
  useEffect(() => {
    setProgress(0); setSkipped(false);
    if (reducedMotion) return;
    const started = performance.now();
    const timer = window.setInterval(() => {
      const next = Math.min(1, (performance.now() - started) / 600);
      setProgress(next);
      if (next === 1) window.clearInterval(timer);
    }, 24);
    return () => window.clearInterval(timer);
  }, [signature, reducedMotion]);
  const revealed = reducedMotion || skipped ? 1 : progress;
  const total = lines.reduce((sum, line) => sum + line.length, 0);
  let remaining = Math.ceil(total * revealed);
  return <section className="terminal-sequence" aria-label={label}>
    <header><span className="terminal-light" /><b>VICE / NETWORK</b><span>{label}</span></header>
    {context && <p className="terminal-context">{context}</p>}
    <span className="terminal-announcement" role="status">{lines.join('. ')}</span>
    <div className="terminal-output" aria-hidden="true">{lines.map((line, index) => {
      const length = Math.max(0, Math.min(line.length, remaining));
      remaining -= line.length;
      return <div key={`${index}-${line}`} className={length === line.length ? 'complete' : ''}>
        <span>{String(index + 1).padStart(2, '0')}</span><p>{line.slice(0, length)}{length > 0 && length < line.length && <i />}</p><b>{length === line.length ? '✓' : ''}</b>
      </div>;
    })}</div>
    <footer><span>{revealed === 1 ? 'CONTINUING YOUR STORY' : 'TRANSMISSION IN PROGRESS'}</span><button type="button" onClick={() => setSkipped(true)} disabled={revealed === 1}>SHOW ALL</button></footer>
  </section>;
}
