import { Home, CalendarDays, UserPlus, FileText, Pill, Package, Palette, Users, ScrollText, PenLine, Star, Search, type LucideIcon } from 'lucide-react';

// Íconos lucide-react, trazo fino (guía Fynt: 14 a 18 px).
const MAP: Record<string, LucideIcon> = { home: Home, cal: CalendarDays, user: UserPlus, doc: FileText, rx: Pill, box: Package, pal: Palette, team: Users, log: ScrollText, pen: PenLine, star: Star, lupa: Search };
export function Icon({ n, s = 18 }: { n: string; s?: number }) {
  const I = MAP[n];
  return I ? <I size={s} strokeWidth={1.75} aria-hidden="true" /> : null;
}
