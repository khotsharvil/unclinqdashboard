import React, { useState } from 'react';
import { Plus, Lock, Trash2, Calendar, FileText } from 'lucide-react';
import { Client, TherapistNote } from '../../types';

interface NotesViewProps {
  client: Client;
  onAddNote?: (note: Partial<TherapistNote>) => void;
  onDeleteNote?: (noteId: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  client,
  onAddNote,
  onDeleteNote,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [category, setCategory] = useState<TherapistNote['category']>('clinical_impression');

  const templates = [
    {
      name: 'Pre-Session Hypothesis',
      title: 'Pre-Session Hypothesis',
      category: 'clinical_impression' as const,
      content: 'Hypothesis for today:\n- Core focus:\n- Potential defense/avoidance to look out for:\n- Intended grounding intervention:',
    },
    {
      name: 'Supervision Note',
      title: 'Supervision Discussion Item',
      category: 'supervision' as const,
      content: 'Topic for supervision:\n- Countertransference or pacing concern:\n- Clinical dilemma:\n- Question for supervisor:',
    },
    {
      name: 'Session Prompt',
      title: 'Collaborative Inquiry Prompt',
      category: 'prompt' as const,
      content: 'Opening reflection:\n"When we talked about [X] last week, you mentioned [Y]. How did that sit with you over the past few days?"',
    },
  ];

  const handleApplyTemplate = (tmpl: typeof templates[0]) => {
    setNoteTitle(tmpl.title);
    setNoteContent(tmpl.content);
    setCategory(tmpl.category);
    setShowAdd(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    if (onAddNote) {
      onAddNote({
        title: noteTitle.trim() || 'Clinical reflection',
        content: noteContent.trim(),
        date: '27 Aug 2026',
        isPrivate: true,
        category,
      });
    }

    setNoteTitle('');
    setNoteContent('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-[#ECEFF3]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#10151F]">
            Therapist Vault Notes
          </h2>
          <p className="text-[13px] sm:text-sm text-[#6B7686] mt-1">
            Private clinical impressions, supervision items, and confidential hypotheses
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="u-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New note</span>
        </button>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#ECEFF3] flex items-center space-x-3.5 text-[13px] sm:text-sm text-[#3A4453]">
        <div className="w-9 h-9 rounded-xl bg-[#F1FAF9] flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-[#0D9488]" />
        </div>
        <div>
          <span className="u-eyebrow block">
            End-to-End Therapist Vault
          </span>
          <span className="text-[#6B7686] text-[13px] sm:text-sm">
            Stored in your private clinician vault — never visible or accessible to the client.
          </span>
        </div>
      </div>

      {/* Quick Template Buttons */}
      <div className="space-y-2.5">
        <span className="u-eyebrow block">
          Clinical Note Templates
        </span>
        <div className="flex flex-wrap gap-2.5">
          {templates.map((tmpl, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyTemplate(tmpl)}
              className="u-btn-ghost"
            >
              <FileText className="w-4 h-4 text-[#0D9488]" />
              <span>{tmpl.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* New Note Form */}
      {showAdd && (
        <form onSubmit={handleSave} className="p-6 sm:p-7 bg-white border border-[#ECEFF3] rounded-2xl space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2F5F8] pb-3">
            <input
              type="text"
              placeholder="Note title (e.g. Session 8 impression)..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="font-serif text-lg sm:text-xl font-semibold text-[#10151F] bg-transparent focus:outline-none placeholder-[#9AA4B2] w-full"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TherapistNote['category'])}
              className="text-[13px] sm:text-sm bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2 text-[#3A4453] focus:outline-none focus:border-[#0D9488] cursor-pointer"
            >
              <option value="clinical_impression">Clinical Impression</option>
              <option value="supervision">Supervision</option>
              <option value="prompt">Session Prompt</option>
            </select>
          </div>

          <textarea
            rows={5}
            autoFocus
            required
            placeholder="Write clinical reflection, supervision thoughts, or exploratory hypotheses..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="w-full p-4 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-base font-serif text-[#10151F] leading-relaxed placeholder-[#9AA4B2] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors"
          />

          <div className="flex justify-end space-x-3 pt-1">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg text-[13px] sm:text-sm font-medium text-[#6B7686] hover:bg-[#F1F5F9] transition-colors border border-transparent cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="u-btn-primary"
            >
              Save to vault
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {client.notes.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#ECEFF3] rounded-2xl">
            <p className="text-base font-serif text-[#6B7686]">No private notes logged for {client.name}.</p>
          </div>
        ) : (
          client.notes.map((note) => (
            <div
              key={note.id}
              className="p-6 sm:p-7 bg-white border border-[#ECEFF3] rounded-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F2F5F8] pb-3">
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                  <span className="text-[13px] sm:text-sm font-mono text-[#6B7686] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#0D9488]" />
                    {note.date}
                  </span>
                  {note.title && (
                    <>
                      <span className="text-xs text-[#C3CBD6]">·</span>
                      <span className="text-base sm:text-lg font-serif font-semibold text-[#10151F]">
                        {note.title}
                      </span>
                    </>
                  )}
                  {note.category && (
                    <span className="u-chip text-xs">
                      {note.category === 'clinical_impression' ? 'Impression' : note.category}
                    </span>
                  )}
                </div>

                {onDeleteNote && (
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="text-[#9AA4B2] hover:text-[#E11D48] p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-base sm:text-lg font-serif text-[#10151F] leading-relaxed whitespace-pre-wrap font-normal">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
