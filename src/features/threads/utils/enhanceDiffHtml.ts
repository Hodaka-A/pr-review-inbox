/**
 * GitHub の bodyHTML に含まれる ```diff コードブロックを、
 * 行ごとに <span class="diff-line diff-line-{add|del|context}"> でラップした形に書き換える。
 *
 * GitHub の diff 表現は行頭の `-` / `+` マーカーだけを <span class="pl-md"> / .pl-mi1 で包むため、
 * CSS だけでは行全体の背景色を塗り分けられない。DOM を分解して 1 行単位で括り直すことで、
 * .diff-line-del / .diff-line-add に指定した行背景（左端マーカー列）を適用できるようにする。
 */
export const enhanceDiffHtml = (html: string): string => {
  if (!html || typeof DOMParser === "undefined") return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const pres = doc.querySelectorAll<HTMLPreElement>("pre");
  pres.forEach((pre) => {
    const isDiff =
      pre.getAttribute("lang") === "diff" ||
      pre.closest(".highlight-source-diff") !== null ||
      pre.querySelector('code[class*="language-diff"]') !== null ||
      pre.querySelector(".pl-md, .pl-mi1") !== null;
    if (!isDiff) return;

    // GitHub の bodyHTML は <pre><code> の入れ子で来る場合と、<div class="highlight..."><pre> のように
    // <code> を持たない場合の 2 パターンがある。行区切りを走査する対象を source として拾い、
    // 出力先は必ず新規の <code class="diff-code"> に寄せる（CSS が pre > code だけを見れば良くなる）
    const source: Element = pre.querySelector("code") ?? pre;

    const lines: Node[][] = [[]];
    Array.from(source.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue ?? "";
        const parts = text.split("\n");
        parts.forEach((part, i) => {
          if (i > 0) lines.push([]);
          if (part.length > 0) {
            lines[lines.length - 1].push(doc.createTextNode(part));
          }
        });
      } else {
        // 要素ノードは中身に改行が含まれない前提でそのまま現在行に積む
        lines[lines.length - 1].push(node.cloneNode(true));
      }
    });

    // 末尾の空行は除去（<pre> の末尾改行由来のノイズ）
    if (lines.length > 0 && lines[lines.length - 1].length === 0) lines.pop();
    if (lines.length === 0) return;

    // pre の中身を新規 <code class="diff-code"> に置き換えて行ラッパーを流し込む
    while (pre.firstChild) pre.removeChild(pre.firstChild);
    const container = doc.createElement("code");
    container.className = "diff-code";
    pre.appendChild(container);

    lines.forEach((lineNodes) => {
      const wrapper = doc.createElement("span");
      wrapper.className = "diff-line";

      // 行の先頭文字でタイプを決める
      let firstChar = "";
      for (const n of lineNodes) {
        const text = n.textContent ?? "";
        if (text.length > 0) {
          firstChar = text.charAt(0);
          break;
        }
      }
      if (firstChar === "-") wrapper.classList.add("diff-line-del");
      else if (firstChar === "+") wrapper.classList.add("diff-line-add");
      else wrapper.classList.add("diff-line-context");

      if (lineNodes.length === 0) {
        // 空行でも高さを確保
        wrapper.appendChild(doc.createTextNode(" "));
      } else {
        lineNodes.forEach((n) => wrapper.appendChild(n));
      }
      // 各 diff-line は display:block なので、行間の改行テキストノードは挿入しない
      container.appendChild(wrapper);
    });

    pre.classList.add("diff-enhanced");
  });

  return doc.body.innerHTML;
};
