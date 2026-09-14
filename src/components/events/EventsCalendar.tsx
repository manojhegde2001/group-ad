'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, startOfDay,
  isSameMonth, isSameDay, isToday, isBefore, addMonths, subMonths, addDays, compareAsc, format,
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, CalendarDays, List, Clock, Video, MapPin, CalendarX2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppImage } from '@/components/ui/app-image';
import EventSheet from './EventSheet';

type Ev = any;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

function toneFor(e: Ev, past: boolean) {
  if (past) return { bar: 'bg-secondary-300 dark:bg-secondary-600', pill: 'bg-secondary-100 dark:bg-secondary-800 text-secondary-400 border-transparent' };
  if (e.isEnrolled) return { bar: 'bg-emerald-500', pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
  if (e.isOnline) return { bar: 'bg-sky-500', pill: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30' };
  return { bar: 'bg-primary-500', pill: 'bg-primary-500/15 text-primary-700 dark:text-primary-300 border-primary-500/30' };
}

function agendaLabel(date: Date, now: Date) {
  if (isSameDay(date, now)) return 'Today';
  if (isSameDay(date, addDays(now, 1))) return 'Tomorrow';
  return format(date, 'EEEE, MMMM d');
}

export default function EventsCalendar({ events = [] }: { events?: Ev[] }) {
  const [mode, setMode] = useState<'month' | 'agenda'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? 'month' : 'agenda'
  );
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);

  const now = new Date();
  const todayStart = startOfDay(now);

  const norm = useMemo(
    () =>
      (events || [])
        .filter((e) => e?.id && e?.startDate && e?.endDate)
        .map((e) => ({ ...e, _s: new Date(e.startDate), _e: new Date(e.endDate) }))
        .sort((a, b) => compareAsc(a._s, b._s)),
    [events]
  );

  const byDay = useMemo(() => {
    const m = new Map<string, Ev[]>();
    for (const e of norm) {
      const span = eachDayOfInterval({ start: startOfDay(e._s), end: startOfDay(e._e) }).slice(0, 60);
      for (const d of span) {
        const k = dayKey(d);
        const arr = m.get(k);
        if (arr) arr.push(e);
        else m.set(k, [e]);
      }
    }
    return m;
  }, [norm]);

  const gridDays = useMemo(() => {
    const gs = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const ge = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gs, end: ge });
  }, [cursor]);

  const todayMs = todayStart.getTime();
  const agendaGroups: { key: string; date: Date; items: Ev[] }[] = [];
  {
    const map = new Map<string, { key: string; date: Date; items: Ev[] }>();
    for (const e of norm) {
      if (e._e.getTime() < todayMs) continue;
      const k = dayKey(e._s);
      let grp = map.get(k);
      if (!grp) {
        grp = { key: k, date: startOfDay(e._s), items: [] };
        map.set(k, grp);
        agendaGroups.push(grp);
      }
      grp.items.push(e);
    }
  }

  const sheetEvent = sheetId ? norm.find((e) => e.id === sheetId) ?? null : null;
  const selectedEvents = selectedDay ? byDay.get(dayKey(selectedDay)) ?? [] : [];
  const upNext = norm.filter((e) => e._e.getTime() >= todayMs);

  // A day with exactly one event goes straight to its detail sheet — no need
  // for the intermediate day-list step.
  const handleDayClick = (day: Date) => {
    const dayEvents = byDay.get(dayKey(day)) ?? [];
    if (dayEvents.length === 1) {
      setSheetId(dayEvents[0].id);
      return;
    }
    setSelectedDay(day);
  };

  // On mobile the selected day's list renders below the whole grid, which can
  // land off-screen if the tapped day was near the top — bring it into view.
  const mobileDayPanelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (selectedDay) {
      mobileDayPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedDay]);

  return (
    <div className="space-y-3">
      {/* Header — mode toggle, legend and month nav share one row on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-full p-1 shrink-0">
          {(['month', 'agenda'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all',
                mode === m ? 'bg-white dark:bg-secondary-950 text-primary-600 shadow-sm' : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              )}
            >
              {m === 'month' ? <CalendarDays className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
              {m}
            </button>
          ))}
        </div>

        {mode === 'month' && (
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:flex-1">
            <div className="hidden sm:flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-secondary-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-500" /> You&apos;re going</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-sky-500" /> Online</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-primary-500" /> In person</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-sm font-black text-secondary-900 dark:text-white mr-1">{format(cursor, 'MMMM yyyy')}</span>
              <button aria-label="Previous month" onClick={() => setCursor((c) => subMonths(c, 1))} className="w-8 h-8 rounded-full flex items-center justify-center text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => { setCursor(startOfMonth(new Date())); setSelectedDay(null); }} className="px-3 h-8 rounded-full text-xs font-bold text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                Today
              </button>
              <button aria-label="Next month" onClick={() => setCursor((c) => addMonths(c, 1))} className="w-8 h-8 rounded-full flex items-center justify-center text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {mode === 'month' ? (
        <div className="space-y-3">
          {/* Bounded box: grid + rail always fill exactly the space available,
              on every breakpoint — no page overflow, no dead space either. */}
          <div className="grid lg:grid-cols-[1fr_340px] gap-4 h-[calc(100dvh-21rem)] min-h-[360px] lg:h-[calc(100vh-18rem)] lg:min-h-[440px]">
            {/* Month grid */}
            <div className="rounded-2xl border border-secondary-100 dark:border-secondary-800 bg-white dark:bg-secondary-900 overflow-hidden flex flex-col">
              <div className="shrink-0 grid grid-cols-7 border-b border-secondary-100 dark:border-secondary-800">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-2 text-center text-[10px] font-black uppercase tracking-wider text-secondary-400">
                    <span className="sm:hidden">{d[0]}</span>
                    <span className="hidden sm:inline">{d}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 flex-1 min-h-0 auto-rows-fr overflow-hidden">
                {gridDays.map((day) => {
                  const inMonth = isSameMonth(day, cursor);
                  const dayEvents = byDay.get(dayKey(day)) ?? [];
                  const pastDay = isBefore(day, todayStart) && !isToday(day);
                  const selected = selectedDay && isSameDay(day, selectedDay);
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        'relative min-h-0 border-b border-r border-secondary-50 dark:border-secondary-800/60 p-1 md:p-1.5 flex flex-col gap-1 text-left transition-colors hover:bg-secondary-50 dark:hover:bg-secondary-800/40',
                        !inMonth && 'bg-secondary-50/60 dark:bg-secondary-950/40',
                        selected && 'ring-2 ring-inset ring-primary-500'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0',
                          isToday(day)
                            ? 'bg-primary-500 text-white'
                            : inMonth && !pastDay
                            ? 'text-secondary-700 dark:text-secondary-300'
                            : 'text-secondary-300 dark:text-secondary-600'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      <div className="flex-1 min-h-0 space-y-0.5 overflow-hidden w-full">
                        {dayEvents.slice(0, 2).map((e) => {
                          const tone = toneFor(e, isBefore(e._e, now));
                          return (
                            <span
                              key={e.id}
                              role="button"
                              tabIndex={0}
                              onClick={(ev) => { ev.stopPropagation(); setSheetId(e.id); }}
                              onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.stopPropagation(); setSheetId(e.id); } }}
                              className={cn('block truncate rounded-md border px-1 md:px-1.5 py-0.5 text-[10px] font-semibold leading-tight cursor-pointer', tone.pill)}
                            >
                              <span className="hidden md:inline">{format(e._s, 'h:mm')} </span>
                              {e.title}
                            </span>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <span className="block text-[10px] font-bold text-secondary-400 px-1 md:px-1.5">+{dayEvents.length - 2} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop rail */}
            <div className="hidden lg:flex lg:flex-col lg:min-h-0">
              <div className="rounded-2xl border border-secondary-100 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 flex-1 lg:min-h-0 overflow-y-auto">
                {selectedDay ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-black text-secondary-900 dark:text-white">{format(selectedDay, 'EEEE, MMM d')}</h3>
                      <button onClick={() => setSelectedDay(null)} className="text-[11px] font-bold text-secondary-400 hover:text-secondary-600">Clear</button>
                    </div>
                    {selectedEvents.length ? (
                      <div className="space-y-1">
                        {selectedEvents.map((e) => <MiniRow key={e.id} e={e} now={now} showDate={false} onOpen={() => setSheetId(e.id)} />)}
                      </div>
                    ) : (
                      <p className="text-xs text-secondary-500 py-6 text-center">No events on this day.</p>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-black text-secondary-900 dark:text-white mb-3">Up next</h3>
                    {upNext.length ? (
                      <div className="space-y-1">
                        {upNext.slice(0, 5).map((e) => <MiniRow key={e.id} e={e} now={now} showDate onOpen={() => setSheetId(e.id)} />)}
                      </div>
                    ) : (
                      <p className="text-xs text-secondary-500 py-6 text-center">Nothing coming up.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile: selected day list — sits below the bounded box (not inside
              it, so it never has to fight the grid for a fixed height), and
              scrolls into view when it appears. */}
          {selectedDay && (
            <div ref={mobileDayPanelRef} className="lg:hidden rounded-2xl border border-secondary-100 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-secondary-900 dark:text-white">{format(selectedDay, 'EEEE, MMM d')}</h3>
                <button onClick={() => setSelectedDay(null)} className="text-[11px] font-bold text-secondary-400">Clear</button>
              </div>
              {selectedEvents.length ? (
                <div className="space-y-1">
                  {selectedEvents.map((e) => <MiniRow key={e.id} e={e} now={now} showDate={false} onOpen={() => setSheetId(e.id)} />)}
                </div>
              ) : (
                <p className="text-xs text-secondary-500 py-4 text-center">No events on this day.</p>
              )}
            </div>
          )}
        </div>
      ) : agendaGroups.length ? (
        <div className="space-y-6">
          {agendaGroups.map((g) => (
            <div key={g.key}>
              <h3 className="text-xs font-black uppercase tracking-wider text-secondary-500 mb-2">{agendaLabel(g.date, now)}</h3>
              <div className="space-y-2.5">
                {g.items.map((e) => <AgendaRow key={e.id} e={e} now={now} onOpen={() => setSheetId(e.id)} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-secondary-200 dark:border-secondary-800 py-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center mb-3">
            <CalendarX2 className="w-7 h-7 text-secondary-400" />
          </div>
          <p className="text-sm font-bold text-secondary-700 dark:text-secondary-300">No upcoming events</p>
          <p className="text-xs text-secondary-500 mt-1">Switch to Month view to browse past events, or adjust your filters.</p>
        </div>
      )}

      <EventSheet event={sheetEvent} onClose={() => setSheetId(null)} />
    </div>
  );
}

function MiniRow({ e, now, showDate, onOpen }: { e: Ev; now: Date; showDate: boolean; onOpen: () => void }) {
  const tone = toneFor(e, isBefore(e._e, now));
  return (
    <button onClick={onOpen} className="w-full flex gap-2.5 items-stretch rounded-xl p-2 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 text-left transition-colors">
      <span className={cn('w-1.5 rounded-full shrink-0', tone.bar)} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-secondary-900 dark:text-white truncate">{e.title}</p>
        <p className="text-[11px] text-secondary-500 truncate flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3 shrink-0" />
          {showDate ? `${format(e._s, 'MMM d')} · ` : ''}{format(e._s, 'h:mm a')}
          {e.isOnline ? ' · Online' : (e.venue || e.city) ? ` · ${e.venue || e.city}` : ''}
        </p>
      </div>
      {e.isEnrolled && (
        <span className="self-center text-[9px] font-black uppercase text-emerald-600 bg-emerald-500/15 rounded-full px-1.5 py-0.5 shrink-0">Going</span>
      )}
    </button>
  );
}

function AgendaRow({ e, now, onOpen }: { e: Ev; now: Date; onOpen: () => void }) {
  const past = isBefore(e._e, now);
  return (
    <button
      onClick={onOpen}
      className="w-full flex gap-3 rounded-2xl border border-secondary-100 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-3 text-left transition-all hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md hover:shadow-primary-500/5"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 relative bg-gradient-to-br from-primary-400 to-indigo-600">
        {e.coverImage && <AppImage src={e.coverImage} alt="" fill className="object-cover" />}
        <div className="absolute inset-x-0 bottom-0 bg-black/45 text-white text-center py-0.5">
          <span className="text-[10px] font-black leading-none">{format(e._s, 'h:mm a')}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {e.isOnline ? (
            <span className="text-[9px] font-black uppercase text-sky-600 bg-sky-500/15 rounded-full px-1.5 py-0.5">Online</span>
          ) : (
            <span className="text-[9px] font-black uppercase text-primary-600 bg-primary-500/15 rounded-full px-1.5 py-0.5">{e.eventType || 'Event'}</span>
          )}
          {e.isEnrolled && <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-500/15 rounded-full px-1.5 py-0.5">Going</span>}
          {past && <span className="text-[9px] font-black uppercase text-secondary-400 bg-secondary-100 dark:bg-secondary-800 rounded-full px-1.5 py-0.5">Ended</span>}
        </div>
        <p className="text-sm font-bold text-secondary-900 dark:text-white truncate">{e.title}</p>
        <p className="text-[11px] text-secondary-500 truncate flex items-center gap-1 mt-0.5">
          {e.isOnline ? <Video className="w-3 h-3 shrink-0" /> : <MapPin className="w-3 h-3 shrink-0" />}
          {e.isOnline ? 'Online event' : (e.venue || e.city || 'Location TBA')}
          {e.seatsLeft != null && e.seatsLeft <= 5 && (
            <>
              <span className="mx-0.5">·</span>
              <span className={e.seatsLeft <= 0 ? 'text-secondary-400' : 'text-amber-600 dark:text-amber-500 font-semibold'}>
                {e.seatsLeft <= 0 ? 'Full' : `${e.seatsLeft} left`}
              </span>
            </>
          )}
        </p>
      </div>
    </button>
  );
}
