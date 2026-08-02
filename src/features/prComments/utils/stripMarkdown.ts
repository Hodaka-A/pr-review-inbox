/**
 * マークダウン記法を除去してプレーンテキストに変換
 * @param markdown - マークダウン形式のテキスト
 * @returns プレーンテキスト
 */
export const stripMarkdown = (markdown: string): string => {
  let text = markdown;

  // 画像リンクを [画像] に置き換え
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "[画像]");

  // リンクをテキスト部分のみに
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // コードブロックを除去
  text = text.replace(/```[\s\S]*?```/g, "[コード]");

  // インラインコードのバッククォートを除去
  text = text.replace(/`([^`]+)`/g, "$1");

  // 太字・斜体のマーカーを除去
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");

  // 見出しのマーカーを除去
  text = text.replace(/^#+\s+/gm, "");

  // 余分な空白を整理
  text = text.replace(/\s+/g, " ").trim();

  return text;
};
