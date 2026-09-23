import { useId, useState } from 'react';

interface Props {
  name: string;
  alias: string;
  crew: string;
  onChange: (value: Partial<Record<'name' | 'alias' | 'crew', string>>) => void;
}

const fields = [
  { key: 'name', label: 'NAME', command: 'identity.name', placeholder: 'ALEX RIVERA', limit: 40 },
  { key: 'alias', label: 'ALIAS', command: 'identity.alias', placeholder: 'NEON', limit: 24 },
  { key: 'crew', label: 'CREW', command: 'identity.crew', placeholder: 'COASTLINE RUNNERS', limit: 40 },
] as const;

export function IdentityTerminal({ name, alias, crew, onChange }: Props) {
  const id = useId();
  const [focused, setFocused] = useState<string | null>(null);
  const values = { name, alias, crew };
  return <section className="identity-terminal" aria-label="Identity details">
    <header><span><i aria-hidden="true" />VICE / IDENTITY CONSOLE</span><small>INPUT CHANNEL / 01</small></header>
    <div className="terminal-fields">{fields.map(field => <div className={`terminal-field ${field.key === 'crew' ? 'terminal-crew' : ''}`} key={field.key}>
      <label htmlFor={`${id}-${field.key}`}>{field.label}{field.key === 'crew' && <small>OPTIONAL</small>}</label>
      <div className="terminal-input-shell">
        <div className="terminal-command" aria-hidden="true"><span>vice@coast</span><b>:~/{field.command}</b><i>{focused === field.key ? 'EDITING' : values[field.key].trim() ? 'SET' : 'READY'}</i></div>
        <div className="terminal-entry"><span aria-hidden="true">❯</span><input id={`${id}-${field.key}`} aria-label={field.label} type="text" maxLength={field.limit} value={values[field.key]} placeholder={field.placeholder} spellCheck={false} autoComplete="off" onFocus={() => setFocused(field.key)} onBlur={() => setFocused(null)} onChange={event => onChange({ [field.key]: event.target.value })} /><small aria-hidden="true">{values[field.key].length}/{field.limit}</small></div>
      </div>
    </div>)}</div>
    <footer><span aria-hidden="true">↳</span> {focused ? 'Editing your identity. Changes update the preview.' : 'Enter your name and alias. Crew is optional.'}</footer>
  </section>;
}
