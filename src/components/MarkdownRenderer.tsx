import React from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

type MemoizedMarkdownProps = {
  source: string;
};

const MarkdownRenderer = ({ source }: MemoizedMarkdownProps) => {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, { output: "html" }]]}
    >
      {source}
    </Markdown>
  );
};

export const MemoizedMarkdown = React.memo(MarkdownRenderer);
