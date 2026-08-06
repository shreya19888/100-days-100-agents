"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
};

export default function MarkdownRenderer({
  content,
}: Props) {
  return (
    <div className="prose prose-slate max-w-none prose-headings:font-bold prose-table:block prose-table:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-slate-900 prose-pre:p-5 prose-code:text-green-300 prose-li:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}