'use client';

import React from 'react';

/**
 * Formats inline ChatGPT / Markdown text:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Code: `code`
 */
function renderFormattedInline(text: string): React.ReactNode {
  // Regex splitting by bold, italic, and inline code tokens
  const parts = text.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return (
        <strong key={index} style={{ fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return (
        <em key={index} style={{ fontStyle: 'italic' }}>
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.9em',
            background: 'var(--tag-bg)',
            padding: '2px 6px',
            borderRadius: '4px',
            color: 'var(--badge-green-text)'
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Formatted Story/Chapter Content Renderer
 * - Handles horizontal scene breaks: `***`, `---`, `___`, or `* * *` -> end-to-end divider line
 * - Handles Markdown headings: `# `, `## `, `### `
 * - Handles blockquotes: `> `
 * - Handles regular narrative paragraphs with bold, italics, code
 */
export default function FormattedChapterContent({
  content,
  className = ''
}: {
  content: string;
  className?: string;
}) {
  if (!content) return null;

  // Split into paragraphs / lines
  const rawParagraphs = content.split(/\n\s*\n/);

  return (
    <div className={`formatted-story-content ${className}`}>
      {rawParagraphs.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Check for horizontal divider / scene break: *** or --- or ___ or * * *
        if (/^(\*{3,}|-{3,}|_{3,}|\*\s+\*\s+\*)$/.test(trimmed)) {
          return (
            <div key={i} className="story-scene-divider" role="separator">
              <hr />
            </div>
          );
        }

        // Headings: #, ##, ###
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={i} style={{ fontSize: '18px', fontWeight: 800, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>
              {renderFormattedInline(trimmed.replace(/^###\s+/, ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={i} style={{ fontSize: '21px', fontWeight: 800, margin: '28px 0 14px 0', color: 'var(--text-main)' }}>
              {renderFormattedInline(trimmed.replace(/^##\s+/, ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={i} style={{ fontSize: '24px', fontWeight: 800, margin: '32px 0 16px 0', color: 'var(--text-main)' }}>
              {renderFormattedInline(trimmed.replace(/^#\s+/, ''))}
            </h1>
          );
        }

        // Blockquotes: > quote
        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed
            .split('\n')
            .map((l) => l.replace(/^>\s?/, ''))
            .join(' ');
          return (
            <blockquote
              key={i}
              style={{
                borderLeft: '3px solid var(--primary-accent)',
                paddingLeft: '16px',
                margin: '18px 0',
                color: 'var(--text-muted)',
                fontStyle: 'italic'
              }}
            >
              {renderFormattedInline(quoteLines)}
            </blockquote>
          );
        }

        // Normal narrative paragraph
        // Handle single newlines inside paragraph with <br />
        const lines = trimmed.split('\n');
        return (
          <p key={i} style={{ marginBottom: '20px' }}>
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {renderFormattedInline(line)}
                {lineIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
