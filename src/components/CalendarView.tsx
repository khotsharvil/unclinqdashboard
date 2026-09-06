import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  Repeat,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  ArrowRight,
  Edit2,
  Trash2,
  X,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { Client, ScheduledSession, RecurrenceCadence, SessionLocation } from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS, DURATION_OPTIONS, CURRENT_WEEK_DATES } from '../data/calendarUtils';
import { getClientAvatarTheme } from '../utils/theme';

// ---- Time-grid config ----
const START_MIN = 8 * 60;   // 8:00 AM
const END_MIN = 19 * 60;    // 7:00 PM
const HOUR_H = 58;          // px per hour
const GRID_H = ((END_MIN - START_MIN) / 60) * HOUR_H;
const NOW_MIN = 12 * 60 + 10; // demo "now" for the today column

const parseMinutes = (t: string): number => {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return START_MIN;
  let h = parseInt(m[1], 10) % 12;
  const min = parseInt(m[2], 10);
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + min;
};

const fmtSlot = (mins: number): string => {
  let m = Math.round(mins / 30) * 30;
  m = Math.max(START_MIN, Math.min(END_MIN - 30, m));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  let hh = h % 12; if (hh === 0) hh = 12;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ap}`;
};

const hourLabel = (h: number): string => {
  const ap = h >= 12 ? 'PM' : 'AM';
  let hh = h % 12; if (hh === 0) hh = 12;
  return `${hh} ${ap}`;
};

const durMins = (d: string) => parseInt(d, 10) || 50;

// Lay events out with side-by-side columns for overlaps
const layoutDay = (daySessions: ScheduledSession[]) => {
  const evs = daySessions
    .map((s) => {
      const start = parseMinutes(s.time);
      return { s, start, end: Math.max(start + durMins(s.duration), start + 20) };
    })
    .sort((a, b) => a.start - b.start);

  const clusters: (typeof evs)[] = [];
  let cur: typeof evs = [];
  let curEnd = -1;
  evs.forEach((e) => {
    if (cur.length && e.start >= curEnd) { clusters.push(cur); cur = []; curEnd = -1; }
    cur.push(e); curEnd = Math.max(curEnd, e.end);
  });
  if (cur.length) clusters.push(cur);

  const out: { s: ScheduledSession; top: number; height: number; leftPct: number; widthPct: number }[] = [];
  clusters.forEach((cluster) => {
    const colEnds: number[] = [];
    const colIdx: number[] = [];
    cluster.forEach((e, i) => {
      let placed = -1;
      for (let c = 0; c < colEnds.length; c++) { if (colEnds[c] <= e.start) { placed = c; break; } }
      if (placed === -1) { placed = colEnds.length; colEnds.push(e.end); } else { colEnds[placed] = e.end; }
      colIdx[i] = placed;
    });
    const nCols = colEnds.length;
    cluster.forEach((e, i) => {
      out.push({
        s: e.s,
        top: ((e.start - START_MIN) / 60) * HOUR_H,
        height: Math.max(((e.end - e.start) / 60) * HOUR_H - 3, 26),
        leftPct: (colIdx[i] / nCols) * 100,
        widthPct: (1 / nCols) * 100,
      });
    });
  });
  return out;
};

interface CalendarViewProps {
  clients: Client[];
  sessions: ScheduledSession[];
  onUpdateSession: (updatedSession: ScheduledSession) => void;
  onAddSession: (newSession: ScheduledSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onOpenClientBriefing: (client: Client) => void;
  onOpenClientWorkspace: (client: Client, tab?: 'briefing' | 'journey' | 'sessions' | 'actions' | 'notes') => void;
  onOpenInviteModal: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  clients,
  sessions,
  onUpdateSession,
  onAddSession,
  onDeleteSession,
  onOpenClientBriefing,
  onOpenInviteModal,
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'agenda'>('week');
  const [selectedDay, setSelectedDay] = useState<string>('Thursday');
  const [modalityFilter, setModalityFilter] = useState<'all' | 'in_person' | 'telehealth'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs_attention'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [popover, setPopover] = useState<{ sess: ScheduledSession; top: number; left: number } | null>(null);

  const [editingSession, setEditingSession] = useState<ScheduledSession | null>(null);
  const [editDay, setEditDay] = useState<string>('Thursday');
  const [editTime, setEditTime] = useState<string>('10:00 AM');
  const [editDuration, setEditDuration] = useState<string>('50 min');
  const [editLocation, setEditLocation] = useState<SessionLocation>('in_person');
  const [editIsRecurring, setEditIsRecurring] = useState<boolean>(true);
  const [editCadence, setEditCadence] = useState<RecurrenceCadence>('weekly');
  const [editNotes, setEditNotes] = useState<string>('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClientId, setNewClientId] = useState<string>(clients[0]?.id || '');
  const [newDay, setNewDay] = useState<string>('Thursday');
  const [newTime, setNewTime] = useState<string>('10:00 AM');
  const [newDuration, setNewDuration] = useState<string>('50 min');
  const [newLocation, setNewLocation] = useState<SessionLocation>('in_person');
  const [newIsRecurring, setNewIsRecurring] = useState<boolean>(true);
  const [newCadence, setNewCadence] = useState<RecurrenceCadence>('weekly');
  const [newNotes, setNewNotes] = useState<string>('');

  const filteredSessions = useMemo(() => {
    return sessions.filter((sess) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = sess.clientName.toLowerCase().includes(q);
        const matchNotes = sess.notes?.toLowerCase().includes(q);
        const matchTheme = sess.focusTheme?.toLowerCase().includes(q);
        if (!matchName && !matchNotes && !matchTheme) return false;
      }
      if (modalityFilter !== 'all' && sess.location !== modalityFilter) return false;
      if (statusFilter === 'needs_attention' && sess.clientStatus !== 'needs_attention') return false;
      return true;
    });
  }, [sessions, searchQuery, modalityFilter, statusFilter]);

  const sessionsByDay = useMemo(() => {
    const map: Record<string, ScheduledSession[]> = {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [],
    };
    filteredSessions.forEach((sess) => { (map[sess.dayOfWeek] || map['Thursday']).push(sess); });
    Object.keys(map).forEach((day) => map[day].sort((a, b) => parseMinutes(a.time) - parseMinutes(b.time)));
    return map;
  }, [filteredSessions]);

  const conflictMap = useMemo(() => {
    const slots: Record<string, string[]> = {};
    sessions.forEach((s) => { const key = `${s.dayOfWeek}-${s.time}`; (slots[key] = slots[key] || []).push(s.id); });
    const conflicts = new Set<string>();
    Object.values(slots).forEach((ids) => { if (ids.length > 1) ids.forEach((id) => conflicts.add(id)); });
    return conflicts;
  }, [sessions]);

  const weekStats = useMemo(() => {
    const inPerson = filteredSessions.filter((s) => s.location === 'in_person').length;
    const minutes = filteredSessions.reduce((sum, s) => sum + durMins(s.duration), 0);
    return { total: filteredSessions.length, inPerson, tele: filteredSessions.length - inPerson, hours: minutes / 60 };
  }, [filteredSessions]);

  const handleOpenEdit = (sess: ScheduledSession) => {
    setPopover(null);
    setEditingSession(sess);
    setEditDay(sess.dayOfWeek);
    setEditTime(sess.time);
    setEditDuration(sess.duration);
    setEditLocation(sess.location);
    setEditIsRecurring(sess.isRecurring);
    setEditCadence(sess.recurringCadence);
    setEditNotes(sess.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    const dateInfo = CURRENT_WEEK_DATES[editDay] || CURRENT_WEEK_DATES['Thursday'];
    onUpdateSession({
      ...editingSession, dayOfWeek: editDay, date: dateInfo.date, time: editTime, duration: editDuration,
      location: editLocation, isRecurring: editIsRecurring, recurringCadence: editIsRecurring ? editCadence : 'one_time', notes: editNotes,
    });
    setEditingSession(null);
  };

  const handleCreateNewSession = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === newClientId);
    if (!client) return;
    const dateInfo = CURRENT_WEEK_DATES[newDay] || CURRENT_WEEK_DATES['Thursday'];
    onAddSession({
      id: `sess-${client.id}-${Date.now()}`, clientId: client.id, clientName: client.name, avatarInitials: client.avatarInitials,
      clientStatus: client.status, briefingStatus: client.briefingStatus, date: dateInfo.date, dayOfWeek: newDay, time: newTime,
      duration: newDuration, location: newLocation, isRecurring: newIsRecurring, recurringCadence: newIsRecurring ? newCadence : 'one_time',
      status: 'scheduled', notes: newNotes || 'Scheduled session', focusTheme: client.briefing?.observedPattern?.text?.slice(0, 60) + '...',
    });
    setIsAddModalOpen(false);
    setNewNotes('');
  };

  const handleGoToBriefing = (sess: ScheduledSession) => {
    setPopover(null);
    const client = clients.find((c) => c.id === sess.clientId);
    if (client) onOpenClientBriefing(client);
  };

  const openAddForSlot = (day: string, time?: string) => {
    setNewDay(day);
    if (time) setNewTime(time);
    setIsAddModalOpen(true);
  };

  const handleColumnClick = (day: string, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    openAddForSlot(day, fmtSlot(START_MIN + ((e.clientY - rect.top) / HOUR_H) * 60));
  };

  const handleDrop = (day: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverDay(null); setDragId(null);
    const id = e.dataTransfer.getData('text/plain');
    const sess = sessions.find((s) => s.id === id);
    if (!sess) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const time = fmtSlot(START_MIN + ((e.clientY - rect.top) / HOUR_H) * 60);
    const dateInfo = CURRENT_WEEK_DATES[day] || CURRENT_WEEK_DATES['Thursday'];
    onUpdateSession({ ...sess, dayOfWeek: day, date: dateInfo.date, time });
  };

  const openPopover = (sess: ScheduledSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const width = 288;
    let left = r.right + 8;
    if (left + width > window.innerWidth - 12) left = Math.max(12, r.left - width - 8);
    const top = Math.max(12, Math.min(r.top, window.innerHeight - 280));
    setPopover({ sess, top, left });
  };

  const hours: number[] = [];
  for (let h = START_MIN / 60; h <= END_MIN / 60; h++) hours.push(h);

  const weekLabel = weekOffset === 0 ? '24 – 29 Aug 2026' : `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`;

  // Mini-month (August 2026: Aug 1 = Saturday, 31 days)
  const monthCells: (number | null)[] = [...Array(5).fill(null), ...Array.from({ length: 31 }, (_, i) => i + 1)];
  const dateToDay: Record<number, string> = { 24: 'Monday', 25: 'Tuesday', 26: 'Wednesday', 27: 'Thursday', 28: 'Friday', 29: 'Saturday' };

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-6" onClick={() => setPopover(null)}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="u-eyebrow mb-2">Schedule</p>
          <h1 className="text-3xl sm:text-[2.5rem] font-serif font-semibold text-[#10151F] tracking-tight leading-[1.1]">Calendar</h1>
          <p className="text-sm text-[#6B7686] mt-2.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
            {sessionsByDay['Thursday']?.length || 0} sessions today · {weekStats.total} this week
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button id="calendar-invite-btn" onClick={onOpenInviteModal} className="u-btn-ghost cursor-pointer">
            <UserPlus className="w-4 h-4 text-[#0D9488]" /><span>Invite client</span>
          </button>
          <button id="calendar-add-session-btn" onClick={() => setIsAddModalOpen(true)} className="u-btn-primary cursor-pointer">
            <Plus className="w-4 h-4" /><span>New session</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-[#ECEFF3] bg-white">
            <button onClick={() => setWeekOffset((w) => w - 1)} className="p-2 text-[#6B7686] hover:text-[#10151F] transition-colors cursor-pointer" title="Previous week"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setWeekOffset(0)} className={`px-3 py-1.5 text-[13px] font-medium border-x border-[#ECEFF3] transition-colors cursor-pointer ${weekOffset === 0 ? 'text-[#0F766E]' : 'text-[#6B7686] hover:text-[#10151F]'}`}>Today</button>
            <button onClick={() => setWeekOffset((w) => w + 1)} className="p-2 text-[#6B7686] hover:text-[#10151F] transition-colors cursor-pointer" title="Next week"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <span className="text-[13px] font-medium text-[#10151F] flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#9AA4B2]" /><span className="font-mono">{weekLabel}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA4B2]" />
            <input type="text" placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-40 sm:w-52 pl-8 pr-7 py-2 bg-white border border-[#ECEFF3] rounded-lg text-[13px] text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488] transition-colors" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9AA4B2] hover:text-[#10151F]"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <div className="flex items-center gap-0.5 border border-[#ECEFF3] rounded-lg p-0.5 bg-white">
            {(['all', 'in_person', 'telehealth'] as const).map((m) => (
              <button key={m} onClick={() => setModalityFilter(m)} className={`px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${modalityFilter === m ? 'bg-[#EEF1F5] text-[#10151F]' : 'text-[#6B7686] hover:text-[#10151F]'}`}>
                {m === 'all' ? 'All' : m === 'in_person' ? 'In-person' : 'Video'}
              </button>
            ))}
          </div>
          <button onClick={() => setStatusFilter((f) => (f === 'all' ? 'needs_attention' : 'all'))} className={`px-2.5 py-2 rounded-lg border text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${statusFilter === 'needs_attention' ? 'bg-[#F1FAF9] border-[#CCEAE6] text-[#0F766E]' : 'bg-white border-[#ECEFF3] text-[#6B7686] hover:border-[#DCE2EA]'}`} title="Show only clients who need attention">
            <AlertCircle className="w-3.5 h-3.5" /><span className="hidden sm:inline">Needs attention</span>
          </button>
          <div className="flex items-center gap-0.5 bg-[#F4F6F9] p-0.5 rounded-lg">
            {(['week', 'day', 'agenda'] as const).map((v) => (
              <button key={v} id={`view-mode-${v}`} onClick={() => setViewMode(v)} className={`px-3 py-1.5 rounded-md text-[12px] font-medium capitalize transition-colors cursor-pointer ${viewMode === v ? 'bg-white text-[#10151F] shadow-[0_1px_2px_rgba(16,21,31,0.06)]' : 'text-[#6B7686] hover:text-[#10151F]'}`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== WEEK — SIDEBAR + TIME GRID ===================== */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 lg:grid-cols-[236px_1fr] gap-5 items-start">

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-[#ECEFF3] p-5 space-y-5 sticky top-24">
              {/* Mini month */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[14px] font-serif font-semibold text-[#10151F]">August 2026</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1 text-[#C3CBD6] hover:text-[#6B7686] cursor-pointer"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1 text-[#C3CBD6] hover:text-[#6B7686] cursor-pointer"><ChevronRight className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-y-1.5 text-center">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="text-[10px] font-medium text-[#C3CBD6]">{d}</span>)}
                  {monthCells.map((n, i) => {
                    if (n === null) return <span key={i} />;
                    const wd = dateToDay[n];
                    const isToday = n === 27;
                    const hasSess = wd && (sessionsByDay[wd]?.length || 0) > 0;
                    return (
                      <button
                        key={i}
                        onClick={() => { if (wd) { setSelectedDay(wd); setViewMode('day'); } }}
                        className={`relative h-7 w-7 mx-auto grid place-items-center rounded-full text-[11px] font-mono transition-colors ${wd ? 'cursor-pointer hover:bg-[#F1FAF9]' : 'cursor-default'} ${isToday ? 'bg-[#0D9488] text-white font-semibold' : 'text-[#3A4453]'}`}
                      >
                        {n}
                        {hasSess && !isToday && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#0D9488]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* This week */}
              <div className="pt-4 border-t border-[#F2F5F8]">
                <p className="u-eyebrow mb-3">This week</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                  <Stat value={String(weekStats.total)} label="sessions" />
                  <Stat value={`${weekStats.hours % 1 === 0 ? weekStats.hours : weekStats.hours.toFixed(1)}h`} label="booked" />
                  <Stat value={String(weekStats.inPerson)} label="in-person" />
                  <Stat value={String(weekStats.tele)} label="telehealth" />
                </div>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="bg-white rounded-2xl border border-[#ECEFF3] overflow-hidden">
            {/* Day header row */}
            <div className="flex border-b border-[#ECEFF3]">
              <div className="w-14 shrink-0" />
              {DAYS_OF_WEEK.map((day) => {
                const isToday = day === 'Thursday';
                const dateNum = CURRENT_WEEK_DATES[day]?.date.split('-')[2] || '';
                return (
                  <div key={day} className={`flex-1 min-w-0 px-2 py-2.5 text-center border-l border-[#F2F5F8] transition-colors ${dragOverDay === day ? 'bg-[#EAF6F4]' : ''}`}>
                    <div className={`text-[11px] font-medium uppercase tracking-wide ${isToday ? 'text-[#0F766E]' : 'text-[#9AA4B2]'}`}>{day.slice(0, 3)}</div>
                    {isToday ? (
                      <div className="mt-1 mx-auto w-7 h-7 rounded-full bg-[#0D9488] text-white grid place-items-center font-mono text-[14px] font-semibold">{parseInt(dateNum, 10)}</div>
                    ) : (
                      <div className="text-[15px] font-mono mt-1 text-[#10151F]">{parseInt(dateNum, 10)}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grid body */}
            <div className="flex">
              <div className="w-14 shrink-0 relative" style={{ height: GRID_H }}>
                {hours.map((h) => (
                  <div key={h} className="absolute right-2 text-[10px] font-mono text-[#9AA4B2] -translate-y-1/2" style={{ top: ((h * 60 - START_MIN) / 60) * HOUR_H }}>
                    {h < END_MIN / 60 ? hourLabel(h) : ''}
                  </div>
                ))}
              </div>

              {DAYS_OF_WEEK.map((day) => {
                const isToday = day === 'Thursday';
                const events = layoutDay(sessionsByDay[day] || []);
                return (
                  <div
                    key={day}
                    className={`flex-1 min-w-0 relative border-l border-[#F2F5F8] cursor-copy transition-colors ${isToday ? 'bg-[#F1FAF9]/40' : ''} ${dragOverDay === day ? 'bg-[#EAF6F4]' : ''}`}
                    style={{ height: GRID_H }}
                    onClick={(e) => handleColumnClick(day, e)}
                    onDragOver={(e) => { e.preventDefault(); if (dragOverDay !== day) setDragOverDay(day); }}
                    onDrop={(e) => handleDrop(day, e)}
                  >
                    {hours.map((h) => (
                      <div key={h} className="absolute left-0 right-0 border-t border-[#F4F6F8] pointer-events-none" style={{ top: ((h * 60 - START_MIN) / 60) * HOUR_H }} />
                    ))}

                    {isToday && NOW_MIN >= START_MIN && NOW_MIN <= END_MIN && (
                      <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: ((NOW_MIN - START_MIN) / 60) * HOUR_H }}>
                        <div className="relative">
                          <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-[#E11D48]" />
                          <div className="border-t border-[#E11D48]" />
                        </div>
                      </div>
                    )}

                    {events.map(({ s, top, height, leftPct, widthPct }) => {
                      const accent = getClientAvatarTheme(s.clientId).accent;
                      const hasConflict = conflictMap.has(s.id);
                      const isDragging = dragId === s.id;
                      return (
                        <button
                          key={s.id}
                          draggable
                          onDragStart={(e) => { e.dataTransfer.setData('text/plain', s.id); e.dataTransfer.effectAllowed = 'move'; setDragId(s.id); setPopover(null); }}
                          onDragEnd={() => { setDragId(null); setDragOverDay(null); }}
                          onClick={(e) => openPopover(s, e)}
                          className={`absolute rounded-lg overflow-hidden text-left transition-shadow hover:shadow-[0_6px_18px_rgba(16,21,31,0.16)] hover:z-30 active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
                          style={{
                            top, height, left: `calc(${leftPct}% + 2px)`, width: `calc(${widthPct}% - 4px)`,
                            backgroundColor: `${accent}14`,
                            boxShadow: `inset 3px 0 0 ${accent}${hasConflict ? ', inset 0 0 0 1.5px #F59E0B' : ''}`,
                          }}
                          title={`${s.clientName} · ${s.time} (${s.duration})`}
                        >
                          <div className="h-full pl-3 pr-1.5 py-1 flex flex-col justify-center gap-0.5">
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-[12px] font-semibold text-[#10151F] truncate leading-tight">{s.clientName}</span>
                              <span className="flex items-center gap-0.5 shrink-0 mt-0.5">
                                {s.location === 'telehealth' && <Video className="w-2.5 h-2.5" style={{ color: accent }} />}
                                {s.isRecurring && <Repeat className="w-2.5 h-2.5 opacity-60" style={{ color: accent }} />}
                              </span>
                            </div>
                            {height > 40 && (
                              <span className="text-[10px] font-mono truncate leading-tight" style={{ color: accent }}>
                                {s.time}{height > 62 ? ` · ${s.duration}` : ''}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== DAY ===================== */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {DAYS_OF_WEEK.map((d) => {
              const isToday = d === 'Thursday';
              return (
                <button key={d} onClick={() => setSelectedDay(d)} className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${selectedDay === d ? 'bg-[#EEF1F5] text-[#10151F]' : 'text-[#6B7686] hover:text-[#10151F] hover:bg-[#F4F6F9]'}`}>
                  {isToday && <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />}
                  <span>{d.slice(0, 3)}</span>
                  <span className="font-mono text-[#9AA4B2]">{sessionsByDay[d]?.length || 0}</span>
                </button>
              );
            })}
          </div>
          <div>
            {(sessionsByDay[selectedDay]?.length || 0) === 0 ? (
              <div className="p-16 text-center bg-white border border-dashed border-[#DCE2EA] rounded-2xl">
                <Clock className="w-7 h-7 text-[#C3CBD6] mx-auto mb-2.5" />
                <h3 className="font-serif font-semibold text-lg text-[#10151F]">Nothing on {selectedDay}</h3>
                <p className="text-[13px] text-[#6B7686] mt-1">A free day — or add a session below.</p>
                <button onClick={() => openAddForSlot(selectedDay)} className="u-btn-primary mt-4 inline-flex cursor-pointer"><Plus className="w-4 h-4" /><span>Add to {selectedDay}</span></button>
              </div>
            ) : (
              <div className="bg-white border border-[#ECEFF3] rounded-2xl divide-y divide-[#F2F5F8] overflow-hidden">
                {sessionsByDay[selectedDay].map((sess) => {
                  const client = clients.find((c) => c.id === sess.clientId);
                  const accent = getClientAvatarTheme(sess.clientId).accent;
                  const isNeedsAttention = sess.clientStatus === 'needs_attention';
                  return (
                    <div key={sess.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFBFC] transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-right shrink-0 w-16">
                          <div className="font-mono text-sm text-[#10151F]">{sess.time}</div>
                          <div className="text-[11px] text-[#9AA4B2]">{sess.duration}</div>
                        </div>
                        <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: accent }} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif font-semibold text-[17px] text-[#10151F] truncate">{sess.clientName}</h3>
                            {client?.preferredPronouns && <span className="text-xs text-[#9AA4B2]">{client.preferredPronouns}</span>}
                            {isNeedsAttention && <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" title="Needs attention" />}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[#6B7686] mt-0.5">
                            <span className="flex items-center gap-1">{sess.location === 'in_person' ? <><MapPin className="w-3.5 h-3.5" /> In-person</> : <><Video className="w-3.5 h-3.5 text-[#0D9488]" /> Telehealth</>}</span>
                            {sess.isRecurring && <span className="flex items-center gap-1 text-[#0F766E]"><Repeat className="w-3.5 h-3.5" /> {sess.recurringCadence}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <button onClick={() => handleOpenEdit(sess)} className="u-btn-ghost cursor-pointer"><Edit2 className="w-3.5 h-3.5 text-[#6B7686]" /><span>Reschedule</span></button>
                        <button onClick={() => handleGoToBriefing(sess)} className="u-btn-primary cursor-pointer"><Sparkles className="w-3.5 h-3.5" /><span>Briefing</span></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== AGENDA ===================== */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-2xl border border-[#ECEFF3] divide-y divide-[#F2F5F8] overflow-hidden">
          {DAYS_OF_WEEK.every((d) => (sessionsByDay[d]?.length || 0) === 0) && (
            <div className="p-16 text-center"><p className="text-base font-serif text-[#6B7686]">No sessions match your filters.</p></div>
          )}
          {DAYS_OF_WEEK.map((day) => {
            const daySessions = sessionsByDay[day] || [];
            if (daySessions.length === 0) return null;
            const isToday = day === 'Thursday';
            return (
              <div key={day}>
                <div className="px-5 sm:px-6 py-2.5 bg-[#FCFDFE] flex items-center gap-2.5">
                  <h3 className="font-serif font-semibold text-[15px] text-[#10151F]">{day}</h3>
                  <span className="text-xs font-mono text-[#9AA4B2]">{CURRENT_WEEK_DATES[day]?.display.replace(' (Today)', '') || day}</span>
                  {isToday && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E]"><span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />Today</span>}
                  <span className="ml-auto text-xs text-[#9AA4B2]"><span className="font-mono">{daySessions.length}</span> sessions</span>
                </div>
                <div className="divide-y divide-[#F2F5F8]">
                  {daySessions.map((sess) => {
                    const accent = getClientAvatarTheme(sess.clientId).accent;
                    return (
                      <div key={sess.id} className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-[#FAFBFC] transition-colors group">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="font-mono text-sm text-[#6B7686] tabular-nums w-16 shrink-0">{sess.time}</span>
                          <span className="w-1 self-stretch min-h-[24px] rounded-full shrink-0" style={{ backgroundColor: accent }} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-semibold text-[16px] text-[#10151F] truncate">{sess.clientName}</span>
                              {sess.isRecurring && <Repeat className="w-3 h-3 text-[#9AA4B2]" />}
                              {sess.clientStatus === 'needs_attention' && <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />}
                            </div>
                            <div className="text-[12px] text-[#9AA4B2]">{sess.duration} · {sess.location === 'in_person' ? 'In-person' : 'Telehealth'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <button onClick={() => handleOpenEdit(sess)} className="text-[13px] font-medium text-[#6B7686] hover:text-[#10151F] transition-colors cursor-pointer">Reschedule</button>
                          <button onClick={() => handleGoToBriefing(sess)} className="text-[13px] font-medium text-[#6B7686] group-hover:text-[#0F766E] flex items-center gap-1 transition-colors cursor-pointer"><span>Briefing</span><ArrowRight className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== EVENT POPOVER ===================== */}
      {popover && (() => {
        const s = popover.sess;
        const accent = getClientAvatarTheme(s.clientId).accent;
        const client = clients.find((c) => c.id === s.clientId);
        return (
          <div className="fixed z-40 w-72 bg-white rounded-2xl border border-[#ECEFF3] shadow-[0_16px_48px_rgba(16,21,31,0.18)] overflow-hidden animate-in fade-in zoom-in-95 duration-100" style={{ top: popover.top, left: popover.left }} onClick={(e) => e.stopPropagation()}>
            {/* accent strip */}
            <div className="h-1" style={{ backgroundColor: accent }} />
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl grid place-items-center font-serif text-base font-semibold shrink-0" style={{ backgroundColor: `${accent}14`, color: accent, boxShadow: `inset 0 0 0 1px ${accent}2E` }}>
                  {s.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif font-semibold text-[15px] text-[#10151F] truncate">{s.clientName}</h4>
                    {client?.preferredPronouns && <span className="text-[11px] text-[#9AA4B2]">{client.preferredPronouns}</span>}
                  </div>
                  <p className="text-[12px] text-[#6B7686] mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#0D9488]" />
                    <span className="font-mono text-[#10151F]">{s.dayOfWeek.slice(0, 3)} · {s.time}</span>
                    <span className="text-[#C3CBD6]">·</span>{s.duration}
                  </p>
                </div>
                <button onClick={() => setPopover(null)} className="text-[#9AA4B2] hover:text-[#10151F] cursor-pointer -m-1 p-1 shrink-0"><X className="w-3.5 h-3.5" /></button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="u-chip text-[11px]">{s.location === 'in_person' ? <><MapPin className="w-3 h-3" /> In-person</> : <><Video className="w-3 h-3 text-[#0D9488]" /> Telehealth</>}</span>
                {s.isRecurring && <span className="u-chip u-chip-accent text-[11px]"><Repeat className="w-3 h-3" /> {s.recurringCadence}</span>}
                {s.clientStatus === 'needs_attention' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B45309] bg-[#FDF6EC] px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />Attention</span>
                )}
              </div>

              {s.notes && <p className="text-[12px] text-[#6B7686] mt-3 pt-3 border-t border-[#F2F5F8] line-clamp-3"><span className="text-[#9AA4B2]">Focus · </span>{s.notes}</p>}

              <div className="flex items-center gap-2 mt-3.5">
                <button onClick={() => handleOpenEdit(s)} className="flex-1 px-2.5 py-2 rounded-lg border border-[#ECEFF3] hover:border-[#DCE2EA] text-[12px] font-medium text-[#3A4453] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"><Edit2 className="w-3 h-3" />Reschedule</button>
                <button onClick={() => handleGoToBriefing(s)} className="flex-1 px-2.5 py-2 rounded-lg bg-[#10151F] hover:bg-[#232C3A] text-white text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"><Sparkles className="w-3 h-3" />Briefing</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================== EDIT MODAL ===================== */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[#10151F]/40 backdrop-blur-sm" onClick={() => setEditingSession(null)} />
          <div className="relative w-full max-w-lg bg-white border border-[#ECEFF3] rounded-2xl shadow-[0_20px_60px_rgba(16,21,31,0.18)] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-[#F2F5F8] flex items-center justify-between">
              <div><p className="u-eyebrow mb-1">Reschedule</p><h2 className="text-xl font-serif font-semibold text-[#10151F]">{editingSession.clientName}</h2></div>
              <button onClick={() => setEditingSession(null)} className="p-2 text-[#9AA4B2] hover:text-[#10151F] rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <Field label="Day"><select value={editDay} onChange={(e) => setEditDay(e.target.value)} className={selectCls}>{DAYS_OF_WEEK.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
                <Field label="Time"><select value={editTime} onChange={(e) => setEditTime(e.target.value)} className={selectCls}>{TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <Field label="Duration"><select value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className={selectCls}>{DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
                <Field label="Format"><select value={editLocation} onChange={(e) => setEditLocation(e.target.value as SessionLocation)} className={selectCls}><option value="in_person">In-person</option><option value="telehealth">Telehealth</option></select></Field>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FCFDFE] border border-[#ECEFF3] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" checked={editIsRecurring} onChange={(e) => setEditIsRecurring(e.target.checked)} className="w-4 h-4 rounded text-[#0D9488] border-[#ECEFF3] focus:ring-0 cursor-pointer" /><span className="text-[13px] font-medium text-[#3A4453]">Repeats</span></label>
                {editIsRecurring && <select value={editCadence} onChange={(e) => setEditCadence(e.target.value as RecurrenceCadence)} className={selectCls}><option value="weekly">Weekly</option><option value="biweekly">Every 2 weeks</option><option value="monthly">Monthly</option></select>}
              </div>
              <Field label="Session focus"><textarea rows={2} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="e.g. Review sleep diary, check in on the evening routine…" className={inputCls} /></Field>
              <div className="pt-3 border-t border-[#F2F5F8] flex items-center justify-between gap-3">
                <button type="button" onClick={() => { onDeleteSession(editingSession.id); setEditingSession(null); }} className="px-3 py-2 text-[13px] font-medium text-[#BE123C] hover:bg-[#FFF1F2] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /><span>Cancel session</span></button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditingSession(null)} className="u-btn-ghost cursor-pointer">Close</button>
                  <button type="submit" className="u-btn-primary cursor-pointer">Save</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== ADD MODAL ===================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[#10151F]/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white border border-[#ECEFF3] rounded-2xl shadow-[0_20px_60px_rgba(16,21,31,0.18)] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-[#F2F5F8] flex items-center justify-between">
              <div><p className="u-eyebrow mb-1">Book</p><h2 className="text-xl font-serif font-semibold text-[#10151F]">New session</h2></div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-[#9AA4B2] hover:text-[#10151F] rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateNewSession} className="p-6 space-y-4">
              <Field label="Client"><select value={newClientId} onChange={(e) => setNewClientId(e.target.value)} className={selectCls}>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.status === 'needs_attention' ? ' · needs attention' : ''}</option>)}</select></Field>
              <div className="grid grid-cols-2 gap-3.5">
                <Field label="Day"><select value={newDay} onChange={(e) => setNewDay(e.target.value)} className={selectCls}>{DAYS_OF_WEEK.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
                <Field label="Time"><select value={newTime} onChange={(e) => setNewTime(e.target.value)} className={selectCls}>{TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <Field label="Duration"><select value={newDuration} onChange={(e) => setNewDuration(e.target.value)} className={selectCls}>{DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
                <Field label="Format"><select value={newLocation} onChange={(e) => setNewLocation(e.target.value as SessionLocation)} className={selectCls}><option value="in_person">In-person</option><option value="telehealth">Telehealth</option></select></Field>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FCFDFE] border border-[#ECEFF3] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" checked={newIsRecurring} onChange={(e) => setNewIsRecurring(e.target.checked)} className="w-4 h-4 rounded text-[#0D9488] border-[#ECEFF3] focus:ring-0 cursor-pointer" /><span className="text-[13px] font-medium text-[#3A4453]">Repeats</span></label>
                {newIsRecurring && <select value={newCadence} onChange={(e) => setNewCadence(e.target.value as RecurrenceCadence)} className={selectCls}><option value="weekly">Weekly</option><option value="biweekly">Every 2 weeks</option><option value="monthly">Monthly</option></select>}
              </div>
              <Field label="Session focus"><textarea rows={2} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="e.g. Introduce the slow breathing exercise…" className={inputCls} /></Field>
              <div className="pt-3 border-t border-[#F2F5F8] flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="u-btn-ghost cursor-pointer">Cancel</button>
                <button type="submit" className="u-btn-primary cursor-pointer">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const selectCls = 'w-full px-3 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors cursor-pointer';
const inputCls = 'w-full p-3 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-sm text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div><label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">{label}</label>{children}</div>
);

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div>
    <div className="text-[22px] font-serif font-semibold text-[#10151F] leading-none">{value}</div>
    <div className="text-[11px] text-[#9AA4B2] mt-1">{label}</div>
  </div>
);
