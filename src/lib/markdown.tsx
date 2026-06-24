import React from 'react';

// Inline Markdown Parser: parses `code`, **bold**, *italics*, [links](url)
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let keyIdx = 0;

  while (currentText) {
    const boldMatch = currentText.match(/(\*\*|__)(.*?)\1/);
    const codeMatch = currentText.match(/(`)(.*?)\1/);
    const italicMatch = currentText.match(/(\*|_)(.*?)\1/);
    const linkMatch = currentText.match(/\[(.*?)\]\((.*?)\)/);

    // Find the first matching markdown symbol
    const matches = [
      { type: 'bold', index: boldMatch?.index ?? -1, length: boldMatch ? boldMatch[0].length : 0, match: boldMatch },
      { type: 'code', index: codeMatch?.index ?? -1, length: codeMatch ? codeMatch[0].length : 0, match: codeMatch },
      { type: 'italic', index: italicMatch?.index ?? -1, length: italicMatch ? italicMatch[0].length : 0, match: italicMatch },
      { type: 'link', index: linkMatch?.index ?? -1, length: linkMatch ? linkMatch[0].length : 0, match: linkMatch },
    ].filter(m => m.index !== -1).sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      parts.push(currentText);
      break;
    }

    const firstMatch = matches[0];
    
    // Add text before the match
    if (firstMatch.index > 0) {
      parts.push(currentText.substring(0, firstMatch.index));
    }

    const matchContent = firstMatch.match;
    if (!matchContent) continue;

    if (firstMatch.type === 'bold') {
      parts.push(<strong key={`b-${keyIdx++}`}>{matchContent[2]}</strong>);
    } else if (firstMatch.type === 'code') {
      parts.push(<code key={`c-${keyIdx++}`}>{matchContent[2]}</code>);
    } else if (firstMatch.type === 'italic') {
      parts.push(<em key={`i-${keyIdx++}`}>{matchContent[2]}</em>);
    } else if (firstMatch.type === 'link') {
      parts.push(
        <a 
          key={`l-${keyIdx++}`} 
          href={matchContent[2]} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: 'var(--primary)', textDecoration: 'underline' }}
        >
          {matchContent[1]}
        </a>
      );
    }

    currentText = currentText.substring(firstMatch.index + firstMatch.length);
  }

  return parts;
}

// A simple client-side markdown formatter that parses headings, bold text, code blocks, lists, blockquotes, and tables into safe React elements.
export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';

  let inList = false;
  let listItems: string[] = [];
  let isNumberedList = false;

  let inTable = false;
  let tableHeaderRow: string[] = [];
  let tableDataRows: string[][] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return null;
    const items = listItems.map((item, idx) => (
      <li key={`li-${idx}`}>{parseInlineMarkdown(item)}</li>
    ));
    const isNum = isNumberedList;
    listItems = [];
    inList = false;
    if (isNum) {
      return <ol key={key}>{items}</ol>;
    } else {
      return <ul key={key}>{items}</ul>;
    }
  };

  const flushTable = (key: string) => {
    if (tableHeaderRow.length === 0 && tableDataRows.length === 0) return null;
    const header = tableHeaderRow.length > 0 ? (
      <tr>
        {tableHeaderRow.map((cell, idx) => (
          <th key={`th-${idx}`}>{parseInlineMarkdown(cell.trim())}</th>
        ))}
      </tr>
    ) : null;
    const body = tableDataRows.map((row, rIdx) => (
      <tr key={`tr-${rIdx}`}>
        {row.map((cell, cIdx) => (
          <td key={`td-${cIdx}`}>{parseInlineMarkdown(cell.trim())}</td>
        ))}
      </tr>
    ));

    tableHeaderRow = [];
    tableDataRows = [];
    inTable = false;

    return (
      <table key={key}>
        {header && <thead>{header}</thead>}
        <tbody>{body}</tbody>
      </table>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimLine = line.trim();

    // 1. Code Blocks
    if (trimLine.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <pre key={`code-${i}`}>
            <code className={codeBlockLang ? `language-${codeBlockLang}` : ''}>
              {codeBlockLines.join('\n')}
            </code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLang = trimLine.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Flush list if we get a non-list line
    const isBulletLine = trimLine.startsWith('- ') || trimLine.startsWith('* ') || trimLine.startsWith('+ ');
    const isNumberedLine = /^\d+\.\s/.test(trimLine);
    
    if (inList && !isBulletLine && !isNumberedLine) {
      const listEl = flushList(`list-${i}`);
      if (listEl) elements.push(listEl);
    }

    // Flush table if we get a non-table line
    const isTableLine = trimLine.startsWith('|');
    if (inTable && !isTableLine) {
      const tableEl = flushTable(`table-${i}`);
      if (tableEl) elements.push(tableEl);
    }

    // 2. Headings
    if (trimLine.startsWith('#')) {
      const depth = (trimLine.match(/^#+/) || [''])[0].length;
      const content = trimLine.replace(/^#+\s*/, '');
      if (depth === 1) elements.push(<h1 key={`h-${i}`}>{parseInlineMarkdown(content)}</h1>);
      else if (depth === 2) elements.push(<h2 key={`h-${i}`}>{parseInlineMarkdown(content)}</h2>);
      else if (depth === 3) elements.push(<h3 key={`h-${i}`}>{parseInlineMarkdown(content)}</h3>);
      else elements.push(<h4 key={`h-${i}`}>{parseInlineMarkdown(content)}</h4>);
      continue;
    }

    // 3. Blockquotes
    if (trimLine.startsWith('>')) {
      const content = trimLine.replace(/^>\s*/, '');
      elements.push(<blockquote key={`quote-${i}`}>{parseInlineMarkdown(content)}</blockquote>);
      continue;
    }

    // 4. Tables
    if (isTableLine) {
      inTable = true;
      const cells = trimLine.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // Check if it's the divider row (e.g. |---|---|)
      const isDivider = cells.every(cell => /^:?-+:?$/.test(cell));
      if (isDivider) {
        continue;
      }

      if (tableHeaderRow.length === 0) {
        tableHeaderRow = cells;
      } else {
        tableDataRows.push(cells);
      }
      continue;
    }

    // 5. Lists
    if (isBulletLine) {
      inList = true;
      isNumberedList = false;
      const content = trimLine.replace(/^[-*+]\s+/, '');
      listItems.push(content);
      continue;
    }

    if (isNumberedLine) {
      inList = true;
      isNumberedList = true;
      const content = trimLine.replace(/^\d+\.\s+/, '');
      listItems.push(content);
      continue;
    }

    // 6. Regular paragraphs
    if (trimLine === '') {
      continue;
    }

    elements.push(<p key={`p-${i}`}>{parseInlineMarkdown(line)}</p>);
  }

  // Flush any final open list or table
  if (inList) {
    const listEl = flushList('list-final');
    if (listEl) elements.push(listEl);
  }
  if (inTable) {
    const tableEl = flushTable('table-final');
    if (tableEl) elements.push(tableEl);
  }

  return <div className="markdown-content">{elements}</div>;
}
