import React, { useEffect, useMemo, useRef, useState } from 'react';
import { therapistApi } from '../../api';

// Mood & sleep from the client's one-tap WhatsApp answers, last 14 days.
// Two small rows on ONE shared date axis (never a dual axis):
//   Sleep: one bar per night; height = band (under 5 h / 5-7 h / 7 h+).
//   Mood:  one dot per day on three levels (struggling / okay / good).
// One hue (teal). A day with no answer gets a small grey tick, never a fake value.
// Hover/focus a day for its values; "Show as table" lists the same data.

type Mood = 'good' | 'okay' | 'struggling';
type Band = 'under5' | '5to7' | '7plus';

const TEAL = '#0D9488';
const NONE = '#C3CBD6';
const INK_MUTED = '#6B7686';
const GRID = '#EEF1F4';

const BAND_LEVEL: Record<Band, number> = { under5: 1, '5to7': 2, '7plus': 3 };
const BAND_LABEL: Record<Band, string> = { under5: 'Under 5 h', '5to7': '5 to 7 h', '7plus': '7 h or more' };
const MOOD_LEVEL: Record<Mood, number> = { struggling: 1, okay: 2, good: 3 };
const MOOD_LABEL: Record<Mood, string> = { struggling: 'Struggling', okay: 'Okay', good: 'Good' };

// India-time calendar days, oldest → today.
function lastDays(n: number): string[] {
  const out: string[] = [];
  const now = Date.now() + 5.5 * 3600 * 1000;
  for (let i = n - 1; i >= 0; i--) out.push(new Date(now - i * 86400000).toISOString().slice(0, 10));
  return out;
}
const fmtDay = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });

export const MoodSleepChart: React.FC<{ clientId: string; days?: number; onData?: (hasAny: boolean) => void }> = ({ clientId, days = 14, onData }) => {
  const [data, setData] = useState<{ mood: Record<string, Mood>; sleep: Record<string, Band> } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  // Draw at the real pixel width so labels stay readable on a phone (no shrink-to-fit).
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [data, asTable]);

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

  const dates = useMemo(() => lastDays(days), [days]);
  if (!data) return null;
  const moodN = dates.filter((d) => data.mood[d]).length;
  const sleepN = dates.filter((d) => data.sleep[d]).length;
  if (!moodN && !sleepN) return null; // nothing logged: the section stays hidden

  // Geometry (viewBox units; the SVG scales to the card width).
  const W = Math.max(280, width), LEFT = W < 420 ? 62 : 74, RIGHT = 6;
  const colW = (W - LEFT - RIGHT) / dates.length;
  const SLEEP_TOP = 22, SLEEP_H = 66;                // bars grow up from SLEEP_TOP + SLEEP_H
  const MOOD_TOP = SLEEP_TOP + SLEEP_H + 34, MOOD_H = 54;
  const AXIS_Y = MOOD_TOP + MOOD_H + 18;
  const H = AXIS_Y + 8;
  const cx = (i: number) => LEFT + colW * i + colW / 2;
  const sleepY = (lvl: number) => SLEEP_TOP + SLEEP_H - (SLEEP_H * lvl) / 3;
  const moodY = (lvl: number) => MOOD_TOP + MOOD_H - ((lvl - 1) * MOOD_H) / 2;
  const barW = Math.max(6, Math.min(18, colW - 8));

  const moodPts = dates.map((d, i) => (data.mood[d] ? { i, y: moodY(MOOD_LEVEL[data.mood[d]]) } : null));
  // Join only consecutive days: a line across a missing day would invent a value.
  const segments: string[] = [];
  for (let i = 1; i < moodPts.length; i++) {
    const a = moodPts[i - 1], b = moodPts[i];
    if (a && b) segments.push(`M${cx(a.i)},${a.y}L${cx(b.i)},${b.y}`);
  }

  const tip = hover !== null ? dates[hover] : null;
  const tipText = tip ? [
    fmtDay(tip, { weekday: 'short', day: 'numeric', month: 'short' }),
    `Sleep: ${data.sleep[tip] ? BAND_LABEL[data.sleep[tip]] : 'no answer'}`,
    `Mood: ${data.mood[tip] ? MOOD_LABEL[data.mood[tip]] : 'no answer'}`,
  ] : null;
  const label = (i: number) => i === 0 || i === dates.length - 1 || (W >= 420 && (dates.length - 1 - i) % 7 === 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[12px] text-[#9AA4B2]">
          Last {days} days · sleep answered {sleepN}, mood answered {moodN}
        </p>
        <button onClick={() => setAsTable((v) => !v)} className="text-[12px] text-[#6B7686] hover:text-[#0F766E] underline underline-offset-2 cursor-pointer">
          {asTable ? 'Show as chart' : 'Show as table'}
        </button>
      </div>

      {asTable ? (
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
              {[...dates].reverse().filter((d) => data.sleep[d] || data.mood[d]).map((d) => (
                <tr key={d} className="border-t border-[#F2F5F8]">
                  <td className="py-1.5 pr-4 tabular-nums">{fmtDay(d, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td className="py-1.5 pr-4">{data.sleep[d] ? BAND_LABEL[data.sleep[d]] : '—'}</td>
                  <td className="py-1.5">{data.mood[d] ? MOOD_LABEL[data.mood[d]] : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative" ref={boxRef}>
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" role="img"
            aria-label={`Sleep and mood, last ${days} days. Use "Show as table" for the values.`}
            onMouseLeave={() => setHover(null)}>
            {/* Row titles + level labels (text in ink, never the series colour) */}
            <text x={0} y={SLEEP_TOP - 8} fontSize="11" fontWeight="600" fill="#3A4453">Sleep</text>
            <text x={0} y={MOOD_TOP - 8} fontSize="11" fontWeight="600" fill="#3A4453">Mood</text>
            {([3, 2, 1] as const).map((lvl) => (
              <g key={`s${lvl}`}>
                <line x1={LEFT} x2={W - RIGHT} y1={sleepY(lvl)} y2={sleepY(lvl)} stroke={GRID} strokeWidth="1" />
                <text x={LEFT - 8} y={sleepY(lvl) + 4} fontSize="10" textAnchor="end" fill={INK_MUTED}>
                  {lvl === 3 ? '7 h+' : lvl === 2 ? '5–7 h' : '<5 h'}
                </text>
              </g>
            ))}
            <line x1={LEFT} x2={W - RIGHT} y1={SLEEP_TOP + SLEEP_H} y2={SLEEP_TOP + SLEEP_H} stroke="#DCE2EA" strokeWidth="1" />
            {([3, 2, 1] as const).map((lvl) => (
              <g key={`m${lvl}`}>
                <line x1={LEFT} x2={W - RIGHT} y1={moodY(lvl)} y2={moodY(lvl)} stroke={GRID} strokeWidth="1" />
                <text x={LEFT - 8} y={moodY(lvl) + 4} fontSize="10" textAnchor="end" fill={INK_MUTED}>
                  {lvl === 3 ? 'Good' : lvl === 2 ? 'Okay' : 'Struggling'}
                </text>
              </g>
            ))}

            {hover !== null && (
              <rect x={LEFT + colW * hover} y={SLEEP_TOP - 4} width={colW} height={AXIS_Y - SLEEP_TOP - 6} fill="#F1FAF9" />
            )}

            {/* Sleep bars: rounded top, anchored to the baseline */}
            {dates.map((d, i) => {
              const band = data.sleep[d];
              if (!band) return <line key={`ns${d}`} x1={cx(i) - 4} x2={cx(i) + 4} y1={SLEEP_TOP + SLEEP_H - 2} y2={SLEEP_TOP + SLEEP_H - 2} stroke={NONE} strokeWidth="2" strokeLinecap="round" />;
              const top = sleepY(BAND_LEVEL[band]);
              const h = SLEEP_TOP + SLEEP_H - top;
              return <path key={`b${d}`} fill={TEAL}
                d={`M${cx(i) - barW / 2},${top + h}V${top + 4}Q${cx(i) - barW / 2},${top} ${cx(i) - barW / 2 + 4},${top}H${cx(i) + barW / 2 - 4}Q${cx(i) + barW / 2},${top} ${cx(i) + barW / 2},${top + 4}V${top + h}Z`} />;
            })}

            {/* Mood: 2px line between consecutive days + 8px dots with a surface ring */}
            {segments.map((p, k) => <path key={`seg${k}`} d={p} stroke={TEAL} strokeWidth="2" fill="none" opacity="0.55" />)}
            {dates.map((d, i) => {
              const m = data.mood[d];
              if (!m) return <line key={`nm${d}`} x1={cx(i) - 4} x2={cx(i) + 4} y1={moodY(2)} y2={moodY(2)} stroke={NONE} strokeWidth="2" strokeLinecap="round" />;
              return <circle key={`m${d}`} cx={cx(i)} cy={moodY(MOOD_LEVEL[m])} r="5" fill={TEAL} stroke="#FFFFFF" strokeWidth="2" />;
            })}

            {/* Shared date axis: first, last, and every 7th day back from today */}
            {dates.map((d, i) => label(i) && (
              <text key={`x${d}`} x={cx(i)} y={AXIS_Y} fontSize="10" textAnchor="middle" fill={INK_MUTED}>
                {i === dates.length - 1 ? 'Today' : fmtDay(d, { day: 'numeric', month: 'short' })}
              </text>
            ))}

            {/* Hit targets: the whole day column, bigger than any mark */}
            {dates.map((d, i) => (
              <rect key={`h${d}`} x={LEFT + colW * i} y={SLEEP_TOP - 4} width={colW} height={AXIS_Y - SLEEP_TOP + 4}
                fill="transparent" tabIndex={0} aria-label={`${fmtDay(d, { weekday: 'short', day: 'numeric', month: 'short' })}: sleep ${data.sleep[d] ? BAND_LABEL[data.sleep[d]] : 'no answer'}, mood ${data.mood[d] ? MOOD_LABEL[data.mood[d]] : 'no answer'}`}
                onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} />
            ))}
          </svg>

          {tipText && hover !== null && (
            <div className="pointer-events-none absolute top-0 z-10 rounded-lg bg-[#10151F] text-white text-[12px] leading-snug px-2.5 py-1.5 shadow-md whitespace-nowrap"
              style={{ left: `${(cx(hover) / W) * 100}%`, transform: `translateX(${hover > dates.length / 2 ? '-105%' : '5%'})` }}>
              <div className="font-semibold">{tipText[0]}</div>
              <div>{tipText[1]}</div>
              <div>{tipText[2]}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
