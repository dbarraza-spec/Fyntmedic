'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';

export type Item = { href: string; label: string; icon: string; tag?: string };
export function Nav({ items }: { items: Item[] }) {
  const path = usePathname();
  // La opción activa es la que coincide con el tramo más largo de la ruta.
  const best = items.reduce((b, it) => {
    const ok = it.href === '/app' ? path === '/app' : path === it.href || path.startsWith(it.href + '/');
    return ok && it.href.length > b.length ? it.href : b;
  }, '');
  return <>{items.map((it) => (
    <Link key={it.href} className={`mi${it.href === best ? ' on' : ''}`} href={it.href}><Icon n={it.icon} />{it.label}{it.tag && <span className="tag">{it.tag}</span>}</Link>
  ))}</>;
}
