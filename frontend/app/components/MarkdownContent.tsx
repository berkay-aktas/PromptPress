"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  markdown: string;
  variant?: "full" | "excerpt";
  maxChars?: number; // used when variant === "excerpt"
};

export function MarkdownContent({
  markdown,
  variant = "full",
  maxChars = 200,
}: MarkdownContentProps) {
  if (!markdown || markdown.trim().length === 0) {
    return <p className="text-gray-500 italic">No content available.</p>;
  }

  // For excerpt variant, truncate the markdown string
  let contentToRender = markdown;
  let wasTruncated = false;
  if (variant === "excerpt") {
    const truncateLength = maxChars ?? 200;
    if (markdown.length > truncateLength) {
      wasTruncated = true;
      // Truncate at word boundary if possible
      const truncated = markdown.substring(0, truncateLength);
      
      // Try to find a good break point (end of sentence, paragraph, or word)
      const lastPeriod = truncated.lastIndexOf(".");
      const lastNewline = truncated.lastIndexOf("\n");
      const lastSpace = truncated.lastIndexOf(" ");
      
      // Prefer sentence end, then paragraph, then word boundary
      let breakPoint = -1;
      if (lastPeriod > truncateLength * 0.6) {
        breakPoint = lastPeriod + 1;
      } else if (lastNewline > truncateLength * 0.7) {
        breakPoint = lastNewline;
      } else if (lastSpace > truncateLength * 0.7) {
        breakPoint = lastSpace;
      }
      
      if (breakPoint > 0) {
        contentToRender = truncated.substring(0, breakPoint).trim();
      } else {
        contentToRender = truncated.trim();
      }
    }
  }

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-gray-200">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border border-gray-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm text-gray-700 border border-gray-300">
              {children}
            </td>
          ),
        }}
      >
        {contentToRender}
      </ReactMarkdown>
      {wasTruncated && variant === "excerpt" && (
        <span className="text-gray-500">...</span>
      )}
    </div>
  );
}

