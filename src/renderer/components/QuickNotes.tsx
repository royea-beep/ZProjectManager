import React, { useState, useEffect, useCallback } from 'react';
import { getNotes, createNote, updateNote, deleteNote } from '../services/api';
import { useToast } from './Toast';
import ConfirmDialog from './ConfirmDialog';
import type { ProjectNote } from '../../shared/types';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function QuickNotes({ projectId }: { projectId: number }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      const data = await getNotes(projectId);
      const sorted = [...data].sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned - a.pinned;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      setNotes(sorted);
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  }, [projectId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreate = async () => {
    const trimmed = newContent.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await createNote({ project_id: projectId, content: trimmed, pinned: 0 });
      setNewContent('');
      toast('Note added');
      await loadNotes();
    } catch {
      toast('Failed to create note', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleTogglePin = async (note: ProjectNote) => {
    try {
      await updateNote(note.id, { pinned: note.pinned ? 0 : 1 });
      await loadNotes();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNote(id);
      toast('Note deleted', 'info');
      await loadNotes();
    } catch {
      toast('Failed to delete note', 'error');
    }
    setDeleteConfirmId(null);
  };

  const startEdit = (note: ProjectNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    const trimmed = editContent.trim();
    if (!trimmed) return;
    try {
      await updateNote(editingId, { content: trimmed });
      setEditingId(null);
      setEditContent('');
      await loadNotes();
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <div className="space-y-2">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Quick note... (Ctrl+Enter to save)"
          rows={3}
          className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text placeholder-dark-muted text-sm resize-none focus:outline-none focus:border-accent-blue/50 transition-colors"
        />
        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            disabled={!newContent.trim() || saving}
            className="px-3 py-1.5 bg-accent-blue/20 text-accent-blue text-sm rounded-lg hover:bg-accent-blue/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Note
          </button>
        </div>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <p className="text-dark-muted text-sm text-center py-8">
          No notes yet. Quick notes help you capture thoughts without committing to a full session log.
        </p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`bg-dark-surface rounded-lg p-3 border border-dark-border ${
                note.pinned ? 'border-l-2 border-l-accent-blue' : ''
              }`}
            >
              {editingId === note.id ? (
                /* Editing Mode */
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    rows={4}
                    autoFocus
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-dark-text text-sm resize-none focus:outline-none focus:border-accent-blue/50 transition-colors"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={cancelEdit}
                      className="px-2.5 py-1 text-dark-muted text-xs rounded hover:text-dark-text transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={!editContent.trim()}
                      className="px-2.5 py-1 bg-accent-blue/20 text-accent-blue text-xs rounded hover:bg-accent-blue/30 transition-colors disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <>
                  <p className="text-dark-text text-sm whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-border/50">
                    <span className="text-dark-muted text-xs">
                      {relativeTime(note.updated_at)}
                    </span>
                    <div className="flex items-center gap-1">
                      {/* Pin */}
                      <button
                        onClick={() => handleTogglePin(note)}
                        title={note.pinned ? 'Unpin' : 'Pin'}
                        className={`p-1 rounded transition-colors ${
                          note.pinned
                            ? 'text-accent-blue hover:text-accent-blue/70'
                            : 'text-dark-muted hover:text-dark-text'
                        }`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="17" x2="12" y2="22" />
                          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                        </svg>
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => startEdit(note)}
                        title="Edit"
                        className="p-1 text-dark-muted rounded hover:text-dark-text transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirmId(note.id)}
                        title="Delete"
                        className="p-1 text-dark-muted rounded hover:text-accent-red transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmId !== null}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (deleteConfirmId) handleDelete(deleteConfirmId); }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
