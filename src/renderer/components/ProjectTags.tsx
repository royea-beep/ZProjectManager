import React, { useState, useEffect, useRef } from 'react';
import { getTags, addTag, removeTag, getAllTags } from '../services/api';
import { useToast } from './Toast';
import type { ProjectTag } from '../../shared/types';

const TAG_COLORS = ['#3b82f6','#22c55e','#a855f7','#f97316','#ef4444','#eab308','#06b6d4','#ec4899'];

export default function ProjectTags({ projectId, readonly = false }: { projectId: number; readonly?: boolean }) {
  const { toast } = useToast();
  const [tags, setTags] = useState<ProjectTag[]>([]);
  const [allTags, setAllTags] = useState<{ tag: string; color: string }[]>([]);
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState('');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTags(projectId).then(setTags).catch(() => toast('Failed to load tags', 'error'));
  }, [projectId]);

  useEffect(() => {
    if (adding) {
      getAllTags().then(setAllTags);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [adding]);

  const suggestions = input.length > 0
    ? allTags.filter(t => t.tag.toLowerCase().includes(input.toLowerCase()) && !tags.some(existing => existing.tag === t.tag))
    : [];

  const handleAdd = async (tagName: string, color?: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;
    const existing = allTags.find(t => t.tag.toLowerCase() === trimmed.toLowerCase());
    const finalColor = color || existing?.color || TAG_COLORS[tags.length % TAG_COLORS.length];
    try {
      await addTag({ project_id: projectId, tag: trimmed, color: finalColor });
      const updated = await getTags(projectId);
      setTags(updated);
      setInput('');
      setAdding(false);
    } catch {
      toast('Failed to add tag', 'error');
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeTag(id);
      setTags(tags.filter(t => t.id !== id));
    } catch {
      toast('Failed to remove tag', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd(input);
    } else if (e.key === 'Escape') {
      setInput('');
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map(tag => (
        <span
          key={tag.id}
          className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40` }}
          onMouseEnter={() => setHoveredId(tag.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {tag.tag}
          {!readonly && hoveredId === tag.id && (
            <button
              onClick={() => handleRemove(tag.id)}
              className="ml-1 hover:opacity-100 opacity-70 leading-none"
              style={{ color: tag.color }}
            >
              &times;
            </button>
          )}
        </span>
      ))}

      {!readonly && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center justify-center text-xs px-1.5 py-0.5 rounded-full border border-dark-border text-dark-muted hover:text-dark-text hover:border-dark-hover transition-colors"
        >
          +
        </button>
      )}

      {!readonly && adding && (
        <div className="relative">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!input) setAdding(false); }}
            placeholder="tag name"
            className="text-xs px-2 py-0.5 rounded-full bg-dark-surface border border-dark-border text-dark-text outline-none focus:border-accent-blue w-28"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-lg z-50 min-w-[8rem] py-1">
              {suggestions.slice(0, 6).map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => handleAdd(s.tag, s.color)}
                  className="block w-full text-left text-xs px-3 py-1 hover:bg-dark-hover text-dark-text"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
