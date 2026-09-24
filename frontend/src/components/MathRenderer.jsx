import React from 'react';
import katex from 'katex';

/**
 * MathRenderer: Parses text with embedded LaTeX math ($...$ or $$...$$) and HTML tags.
 */
export default function MathRenderer({ content, className = '' }) {
  if (!content) return null;

  // Function to render math segments
  const renderMathAndText = (text) => {
    // Split by $$...$$ (display math) or $...$ (inline math)
    const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|<br\s*\/?>|<\/?[b|i|u|strong|em]>)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Display math $$...$$
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2);
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="block my-2 overflow-x-auto max-w-full text-center" />;
        } catch (e) {
          return <span key={index} className="font-mono text-amber-400">{part}</span>;
        }
      }

      // Inline math $...$
      if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1);
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="inline-block mx-0.5" />;
        } catch (e) {
          return <span key={index} className="font-mono text-amber-400">{part}</span>;
        }
      }

      // Line break HTML tag
      if (/<br\s*\/?>/i.test(part)) {
        return <br key={index} />;
      }

      // Simple HTML tags
      if (/^<\/?(b|i|u|strong|em)>$/i.test(part)) {
        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`leading-relaxed text-slate-200 ${className}`}>
      {renderMathAndText(content)}
    </div>
  );
}
