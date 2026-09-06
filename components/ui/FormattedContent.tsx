"use client";

import React, { useState } from "react";
import { Check, Copy, Code2 } from "lucide-react";

interface FormattedContentProps {
  content: string;
  className?: string;
}

export function FormattedContent({ content, className = "" }: FormattedContentProps) {
  if (!content) return null;

  // Split content by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-3 leading-relaxed text-gray-800 dark:text-gray-200 ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          // Code block
          const lines = part.slice(3, -3).trim().split("\n");
          const language = lines[0]?.match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : "";
          const codeText = language ? lines.slice(1).join("\n") : lines.join("\n");

          return <CodeBlock key={index} code={codeText} language={language} />;
        }

        // Normal text blocks with headings, lists, tables, paragraphs
        return <TextSection key={index} text={part} />;
      })}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 text-gray-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-gray-800/80 border-b border-gray-700/60 text-[11px] font-mono text-gray-400">
        <span className="flex items-center space-x-1.5">
          <Code2 className="h-3.5 w-3.5 text-blue-400" />
          <span className="uppercase text-[10px] font-semibold tracking-wider text-gray-300">
            {language || "code"}
          </span>
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 hover:text-white px-2 py-0.5 rounded bg-gray-700/50 hover:bg-gray-700 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-gray-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function TextSection({ text }: { text: string }) {
  const lines = text.split("\n");
  const renderedElements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = (keyIndex: number) => {
    if (tableRows.length > 0) {
      renderedElements.push(<TableBlock key={`table-${keyIndex}`} rows={tableRows} />);
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushTable(i);
      continue;
    }

    // Table Row Detection
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      tableRows.push(trimmed);
      continue;
    } else {
      flushTable(i);
    }

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      renderedElements.push(<hr key={i} className="my-4 border-gray-200 dark:border-gray-800" />);
      continue;
    }

    // Heading 1
    if (trimmed.startsWith("# ")) {
      renderedElements.push(
        <h1 key={i} className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 pt-2 pb-1 border-b border-gray-100 dark:border-gray-800">
          {renderInlineFormatting(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // Heading 2
    if (trimmed.startsWith("## ")) {
      renderedElements.push(
        <h2 key={i} className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 pt-3 pb-0.5 text-blue-600 dark:text-blue-400">
          {renderInlineFormatting(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    // Heading 3
    if (trimmed.startsWith("### ")) {
      renderedElements.push(
        <h3 key={i} className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 pt-2">
          {renderInlineFormatting(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    // Heading 4
    if (trimmed.startsWith("#### ")) {
      renderedElements.push(
        <h4 key={i} className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 pt-1">
          {renderInlineFormatting(trimmed.slice(5))}
        </h4>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      renderedElements.push(
        <blockquote
          key={i}
          className="p-3 my-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-blue-500 text-xs text-gray-800 dark:text-gray-200 italic"
        >
          {renderInlineFormatting(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet List Item
    if (trimmed.match(/^[-*+]\s+/)) {
      renderedElements.push(
        <li key={i} className="ml-5 list-disc text-xs sm:text-sm py-0.5">
          {renderInlineFormatting(trimmed.replace(/^[-*+]\s+/, ""))}
        </li>
      );
      continue;
    }

    // Numbered List Item
    if (trimmed.match(/^\d+\.\s+/)) {
      renderedElements.push(
        <div key={i} className="flex items-start space-x-2 text-xs sm:text-sm py-0.5 pl-1">
          <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0">
            {trimmed.match(/^\d+\./)?.[0]}
          </span>
          <span className="flex-1">{renderInlineFormatting(trimmed.replace(/^\d+\.\s+/, ""))}</span>
        </div>
      );
      continue;
    }

    // Standard Paragraph
    renderedElements.push(
      <p key={i} className="text-xs sm:text-sm leading-relaxed">
        {renderInlineFormatting(trimmed)}
      </p>
    );
  }

  flushTable(lines.length);

  return <div className="space-y-2">{renderedElements}</div>;
}

function TableBlock({ rows }: { rows: string[] }) {
  if (rows.length < 2) return null;

  // Filter out separator rows like |:---|:---|
  const headerRow = rows[0];
  const dataRows = rows.slice(1).filter((r) => !r.match(/^\|?\s*[-:]+[-| :]*\|?$/));

  const parseCells = (row: string) => {
    return row
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
  };

  const headers = parseCells(headerRow);

  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs">
        <thead className="bg-gray-50 dark:bg-gray-800/80">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3.5 py-2 text-left font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-[11px]"
              >
                {renderInlineFormatting(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
          {dataRows.map((r, rowIdx) => {
            const cells = parseCells(r);
            return (
              <tr key={rowIdx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                {cells.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-3.5 py-2 text-gray-700 dark:text-gray-300">
                    {renderInlineFormatting(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Parses bold (**text**), italics (*text*), inline code (`code`), math ($x$), and links ([title](url))
 */
function renderInlineFormatting(text: string): React.ReactNode {
  if (!text) return "";

  // Split by inline code `...`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-[11px] text-purple-600 dark:text-purple-300 font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold formatting **text**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, j) => {
      if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length > 4) {
        return (
          <strong key={`${i}-${j}`} className="font-bold text-gray-900 dark:text-gray-100">
            {bPart.slice(2, -2)}
          </strong>
        );
      }

      // Italic formatting *text*
      const italicParts = bPart.split(/(\*[^*]+\*)/g);
      return italicParts.map((iPart, k) => {
        if (iPart.startsWith("*") && iPart.endsWith("*") && iPart.length > 2) {
          return (
            <em key={`${i}-${j}-${k}`} className="italic">
              {iPart.slice(1, -1)}
            </em>
          );
        }

        // Clean LaTeX math symbols e.g. $O(N)$ -> O(N) or cleanly styled badge
        const mathParts = iPart.split(/(\$[^$]+\$)/g);
        return mathParts.map((mPart, l) => {
          if (mPart.startsWith("$") && mPart.endsWith("$") && mPart.length > 2) {
            return (
              <span
                key={`${i}-${j}-${k}-${l}`}
                className="font-mono text-blue-600 dark:text-blue-400 font-semibold px-0.5"
              >
                {mPart.slice(1, -1)}
              </span>
            );
          }
          return mPart;
        });
      });
    });
  });
}
