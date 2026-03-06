import React from 'react';

export default function TechStackTags({ techStack }: { techStack: string | null }) {
  if (!techStack) return <span className="text-dark-muted italic text-sm">Not set</span>;

  let tags: string[] = [];
  try {
    tags = JSON.parse(techStack);
  } catch {
    return <span className="text-sm">{techStack}</span>;
  }

  if (!Array.isArray(tags) || tags.length === 0) {
    return <span className="text-dark-muted italic text-sm">Not set</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag, i) => (
        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/20">
          {tag}
        </span>
      ))}
    </div>
  );
}
