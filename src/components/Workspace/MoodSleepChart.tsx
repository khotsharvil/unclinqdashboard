import React, { useEffect, useState } from 'react';
import { therapistApi } from '../../api';

// Mood & sleep from the client's one-tap WhatsApp answers, last 14 days, as a plain
// table (newest first). Only days they answered are listed; nothing is inferred.

type Mood = 'good' | 'okay' | 'struggling';
type Band = 'under5' | '5to7' | '7plus';

const BAND_LABEL: Record<Band, string> = { under5: 'Under 5 h', '5to7': '5 to 7 h', '7plus': '7 h or more' };
const MOOD_LABEL: Record<Mood, string> = { struggling: 'Struggling', okay: 'Okay', good: 'Good' };

// India-time calendar days, today first.
function lastDays(n: number): string[] {
  const out: string[] = [];
  const now = Date.now() + 5.5 * 3600 * 1000;
  for (let i = 0; i < n; i++) out.push(new Date(now - i * 86400000).toISOString().slice(0, 10));
  return out;
}
const fmtDay = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });

export const MoodSleepChart: React.FC<{ clientId: string; days?: number; onData?: (hasAny: boolean) => void }> = ({ clientId, days = 14, onData }) => {
  const [data, setData] = useState<{ mood: Record<string, Mood>; sleep: Record<string, Band> } | null>(null);

  useEffect(() => {
    let live = true;
    setData(null);
    therapistApi.wellbeing(clientId, days)
      .then((r) => {
        if (!live) return;
        onData?.((r.mood || []).length + (r.sleep || []).length > 0);
        setData({
          mood: Object.fromEntries((r.mood || []).map((m) => [m.date, m.mood])),
          sleep: Object.fromEntries((r.sleep || []).map((s) => [s.date, s.band])),
        });
      })
      .catch(() => { if (live) { onData?.(false); setData({ mood: {}, sleep: {} }); } });
    return () => { live = false; };
  }, [clientId, days]);

  if (!data) return null;
  const rows = lastDays(days).filter((d) => data.sleep[d] || data.mood[d]);
  if (!rows.length) return null; // nothing logged: the section stays hidden
  const sleepN = rows.filter((d) => data.sleep[d]).length;
  const moodN = rows.filter((d) => data.mood[d]).length;

  return (
    <div>
      <p className="text-[12px] text-[#9AA4B2] mb-2">Last {days} days · sleep answered {sleepN}, mood answered {moodN}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-[#3A4453]">
          <thead>
            <tr className="text-left text-[12px] text-[#6B7686]">
              <th className="py-1.5 pr-4 font-medium">Day</th>
              <th className="py-1.5 pr-4 font-medium">Sleep</th>
              <th className="py-1.5 font-medium">Mood</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const band = data.sleep[d];
              const mood = data.mood[d];
              return (
                <tr key={d} className="border-t border-[#F2F5F8]">
                  <td className="py-1.5 pr-4 tabular-nums whitespace-nowrap">{fmtDay(d)}</td>
                  <td className={`py-1.5 pr-4 ${band === 'under5' ? 'text-[#B45309] font-medium' : ''}`}>{band ? BAND_LABEL[band] : '—'}</td>
                  <td className={`py-1.5 ${mood === 'struggling' ? 'text-[#B45309] font-medium' : ''}`}>{mood ? MOOD_LABEL[mood] : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
