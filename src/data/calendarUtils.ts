import { Client, ScheduledSession, RecurrenceCadence, SessionLocation } from '../types';

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const TIME_SLOTS = [
  '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM',
  '05:00 PM', '05:15 PM', '05:30 PM',
  '06:00 PM'
];

export const DURATION_OPTIONS = ['30 min', '45 min', '50 min', '60 min', '75 min', '90 min'];

// Standard anchor week in 2026: Aug 24 (Mon) to Aug 29 (Sat)
export const CURRENT_WEEK_DATES: Record<string, { date: string; display: string }> = {
  Monday: { date: '2026-08-24', display: 'Mon, Aug 24' },
  Tuesday: { date: '2026-08-25', display: 'Tue, Aug 25' },
  Wednesday: { date: '2026-08-26', display: 'Wed, Aug 26' },
  Thursday: { date: '2026-08-27', display: 'Thu, Aug 27 (Today)' },
  Friday: { date: '2026-08-28', display: 'Fri, Aug 28' },
  Saturday: { date: '2026-08-29', display: 'Sat, Aug 29' },
};

export function generateInitialSessions(clients: Client[]): ScheduledSession[] {
  const sessions: ScheduledSession[] = [];

  clients.forEach((client) => {
    const sched = client.recurringSchedule || (client.nextSession ? {
      dayOfWeek: client.nextSession.dayOfWeek || (client.nextSession.isToday ? 'Thursday' : 'Monday'),
      time: client.nextSession.time,
      duration: client.nextSession.duration || '50 min',
      cadence: (client.nextSession.cadence || 'weekly') as RecurrenceCadence,
      location: (client.nextSession.location || 'in_person') as SessionLocation,
    } : null);

    if (sched) {
      const day = sched.dayOfWeek in CURRENT_WEEK_DATES ? sched.dayOfWeek : 'Thursday';
      const dateInfo = CURRENT_WEEK_DATES[day] || CURRENT_WEEK_DATES['Thursday'];

      sessions.push({
        id: `sess-${client.id}-${dateInfo.date}`,
        clientId: client.id,
        clientName: client.name,
        avatarInitials: client.avatarInitials,
        clientStatus: client.status,
        briefingStatus: client.briefingStatus,
        date: dateInfo.date,
        dayOfWeek: day,
        time: sched.time,
        duration: sched.duration || '50 min',
        location: sched.location,
        isRecurring: sched.cadence !== 'one_time',
        recurringCadence: sched.cadence,
        status: 'scheduled',
        notes: client.briefing?.worthExploring?.[0] || 'Regular longitudinal therapy session',
        focusTheme: client.briefing?.observedPattern?.text?.slice(0, 60) + '...',
      });
    }
  });

  return sessions;
}
