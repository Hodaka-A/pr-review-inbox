import { defaultSchema } from "rehype-sanitize";

/**
 * コメント本文（GFM Markdown）用の sanitize スキーマ。
 *
 * CodeRabbit などのボットは本文中で <details> / <summary> / <img> といった生 HTML を使うため
 * rehype-raw で HTML を解釈している。その結果 <script> や onclick などもツリーに入り得るので、
 * rehype-sanitize で許可リスト方式に絞り込む（defaultSchema が GFM の出力＝表・タスクリスト・
 * 脚注・language-* クラスを通す前提の構成になっている）。
 *
 * clobberPrefix を空にしているのは脚注リンクを機能させるため。
 * remark-rehype が脚注の id/href に付ける "user-content-" を sanitize 側でも二重に付けると
 * href="#user-content-fn-1" と id="user-content-user-content-fn-1" がずれてリンクが死ぬ。
 * remark 側の prefix だけを残すことで id 空間は user-content- に隔離したまま整合させる。
 */
export const markdownSanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: "",
};
