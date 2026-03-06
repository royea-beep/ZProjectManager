import React, { useState, useRef } from 'react';

interface TagInputProps {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TagInput({ value, onChange, placeholder = 'Add tag...' }: TagInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  let tags: string[] = [];
  if (value) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) tags = parsed;
    } catch {
      // If not valid JSON, treat as comma-separated
      tags = value.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const next = [...tags, trimmed];
    onChange(JSON.stringify(next));
    setInput('');
  };

  const removeTag = (index: number) => {
    const next = tags.filter((_, i) => i !== index);
    onChange(next.length > 0 ? JSON.stringify(next) : '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      className="flex flex-wrap gap-1.5 bg-dark-bg border border-dark-border rounded px-2 py-1.5 min-h-[38px] cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/20">
          {tag}
          <button
            onClick={(e) => { e.stopPropagation(); removeTag(i); }}
            className="text-accent-blue/50 hover:text-accent-blue ml-0.5"
          >
            x
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder-dark-muted"
      />
    </div>
  );
}
