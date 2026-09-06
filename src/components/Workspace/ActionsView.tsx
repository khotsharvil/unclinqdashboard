import React, { useState } from 'react';
import { Plus, CheckCircle2, Trash2, Calendar, Clock, Check, Sparkles } from 'lucide-react';
import { Client, ActionItem } from '../../types';

interface ActionsViewProps {
  client: Client;
  onAddAction?: (newAction: Partial<ActionItem>) => void;
  onUpdateActionStatus?: (actionId: string, status: ActionItem['status']) => void;
  onDeleteAction?: (actionId: string) => void;
}

export const ActionsView: React.FC<ActionsViewProps> = ({
  client,
  onAddAction,
  onUpdateActionStatus,
  onDeleteAction,
}) => {
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [recentlyAssigned, setRecentlyAssigned] = useState(false);

  const quickPresets = [
    { title: 'Practice thought reframing when closing work laptop', frequency: 'Daily on workdays' },
    { title: 'Three deep calming breaths upon ending the workday', frequency: 'Daily' },
    { title: 'Put phone on silent after 10:00 PM and keep in another room', frequency: 'Every night' },
    { title: '15-minute gentle morning walk in natural daylight', frequency: '3x per week' },
    { title: 'Brief grounding exercise when noticing acute worry', frequency: 'As needed' },
  ];

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (onAddAction) {
      onAddAction({
        title: title.trim(),
        assignedDate: 'Today',
        attempts: 0,
        lastAttemptedDate: 'Pending',
        clientResponse: 'Pending initial attempt.',
        status: 'in_progress',
        frequency: frequency.trim() || 'Daily',
      });
    }

    setTitle('');
    setFrequency('Daily');
    setRecentlyAssigned(true);
    setTimeout(() => setRecentlyAssigned(false), 3000);
  };

  const handleApplyPreset = (preset: { title: string; frequency: string }) => {
    setTitle(preset.title);
    setFrequency(preset.frequency);
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      
      {/* Assign Action Card */}
      <div className="p-6 sm:p-7 bg-white rounded-2xl border border-[#ECEFF3] space-y-5">
        <div className="flex items-center justify-between border-b border-[#F2F5F8] pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#10151F]">
              Assign Action
            </h2>
            <p className="text-[13px] sm:text-sm text-[#6B7686] mt-1">
              Assign a practical exercise, routine, or homework for {client.name.split(' ')[0]}
            </p>
          </div>

          {recentlyAssigned && (
            <span className="u-chip u-chip-accent animate-in fade-in duration-200">
              <Check className="w-4 h-4" />
              <span>Action assigned!</span>
            </span>
          )}
        </div>

        {/* Action Form */}
        <form onSubmit={handleCreateAction} className="space-y-4">
          <div>
            <label className="block u-eyebrow mb-2">
              Action / Homework Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Practice writing down one reframed thought at the end of the workday"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-[#FCFDFE] border border-[#ECEFF3] rounded-lg text-sm sm:text-base font-sans text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block u-eyebrow mb-2">
                Frequency / Cadence
              </label>
              <input
                type="text"
                placeholder="e.g. Daily, 3x per week, At bedtime, When stressed"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FCFDFE] border border-[#ECEFF3] rounded-lg text-xs sm:text-sm font-sans text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="u-btn-primary w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Action</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Suggestions */}
          <div className="pt-2">
            <span className="block u-eyebrow mb-2">
              Quick suggestions
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#FCFDFE] border border-[#ECEFF3] text-[#3A4453] hover:border-[#DCE2EA] transition-colors text-left font-sans cursor-pointer"
                >
                  + {preset.title}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Currently Assigned Actions */}
      <div className="p-6 sm:p-7 bg-white rounded-2xl border border-[#ECEFF3] space-y-4">
        <div className="flex items-center justify-between border-b border-[#F2F5F8] pb-3">
          <h3 className="text-base sm:text-lg font-serif font-semibold text-[#10151F]">
            Assigned Actions (<span className="font-mono tabular-nums">{client.actions.length}</span>)
          </h3>
          <span className="text-xs text-[#9AA4B2]">
            Active client homework
          </span>
        </div>

        {client.actions.length === 0 ? (
          <div className="p-8 text-center bg-[#FCFDFE] border border-[#F2F5F8] rounded-xl">
            <p className="text-[13px] sm:text-sm text-[#6B7686]">
              No actions assigned yet. Use the form above to assign an action to {client.name.split(' ')[0]}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {client.actions.map((action) => {
              const isCompleted = action.status === 'completed';

              return (
                <div
                  key={action.id}
                  className={`p-4 sm:p-5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-[#FCFDFE] border-[#ECEFF3] opacity-75'
                      : 'bg-white border-[#ECEFF3] u-card-hover'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2.5 flex-wrap">
                      <span className={`text-sm sm:text-base font-medium ${isCompleted ? 'line-through text-[#9AA4B2]' : 'text-[#10151F]'}`}>
                        {action.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#6B7686] flex-wrap">
                      {action.frequency && (
                        <span className="u-chip text-xs">
                          {action.frequency}
                        </span>
                      )}
                      <span>Assigned: <span className="font-mono">{action.assignedDate}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => onUpdateActionStatus && onUpdateActionStatus(
                        action.id,
                        isCompleted ? 'in_progress' : 'completed'
                      )}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isCompleted
                          ? 'bg-white border-[#ECEFF3] text-[#15803D]'
                          : 'bg-white border-[#ECEFF3] text-[#6B7686] hover:text-[#10151F] hover:border-[#DCE2EA]'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-[#16A34A]' : ''}`} />
                      <span>{isCompleted ? 'Completed' : 'Mark done'}</span>
                    </button>

                    {onDeleteAction && (
                      <button
                        onClick={() => onDeleteAction(action.id)}
                        className="p-1.5 rounded-lg text-[#9AA4B2] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer"
                        title="Remove action"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
