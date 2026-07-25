import { useMemo } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import type { Element } from "hast";
import { markdownSanitizeSchema } from "../../utils/markdownSanitizeSchema";
import { extractSuggestionBase } from "../../utils/extractSuggestionBase";
import { DiffBlock } from "./DiffBlock";
import { SuggestedChange } from "./SuggestedChange";

type CommentMarkdownProps = {
  body: string;
  /** ```suggestion の変更前行を復元するためのスレッド情報（レビューコメントでは無い） */
  diffHunk?: string;
  line?: number;
  startLine?: number;
};

/** <pre><code class="language-xxx"> の子から言語名とソースを取り出す */
const readCodeBlock = (node?: Element) => {
  const code = node?.children.find(
    (child): child is Element => child.type === "element" && child.tagName === "code",
  );
  if (!code) return null;

  const className = code.properties?.className;
  const classNames = Array.isArray(className) ? className.map(String) : [];
  const lang = classNames
    .find((name) => name.startsWith("language-"))
    ?.replace("language-", "");

  // コードフェンスの中身は単一のテキストノードで来る
  const value = code.children
    .map((child) => (child.type === "text" ? child.value : ""))
    .join("");

  return { lang, value };
};

/** 外部リンクだけ新しいタブで開く（脚注の #... は同一ページ内ジャンプなので対象外） */
const Anchor: Components["a"] = ({ node: _node, children, href, ...props }) => {
  const isExternal = href?.startsWith("http");
  return (
    <a
      {...props}
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
};

/**
 * コメント本文の生 Markdown を GFM（表・タスクリスト・打ち消し線・自動リンク・脚注）
 * として描画する。CodeRabbit などが本文に混ぜる生 HTML も rehype-raw で解釈し、
 * rehype-sanitize で許可リストに絞る。
 */
export const CommentMarkdown = ({
  body,
  diffHunk,
  line,
  startLine,
}: CommentMarkdownProps) => {
  // components を毎回新しいオブジェクトで渡すと react-markdown が再レンダーするため memo 化する
  const components = useMemo<Components>(() => {
    const baseLines =
      extractSuggestionBase(diffHunk, line, startLine) ?? undefined;

    return {
      // コードフェンスは言語ごとに専用コンポーネントへ振り分ける。
      // code ではなく pre を差し替えるのは、<pre> ごと独自要素に置き換えたいため
      // （code 側で返すと <pre> の内側にブロック要素が入ってしまう）
      pre({ node, children, ...props }) {
        const block = readCodeBlock(node);
        if (block?.lang === "suggestion") {
          return <SuggestedChange code={block.value} baseLines={baseLines} />;
        }
        if (block?.lang === "diff") return <DiffBlock code={block.value} />;
        return <pre {...props}>{children}</pre>;
      },
      a: Anchor,
    };
  }, [diffHunk, line, startLine]);

  return (
    <div className="markdown-body">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
        components={components}
      >
        {body}
      </Markdown>
    </div>
  );
};
