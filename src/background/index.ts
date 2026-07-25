chrome.runtime.onInstalled.addListener(() => {});

// 離席から戻ったタイミングで PR コメントを事前取得する予定の箇所。
// 取得処理は docs/prefetch-design.md の設計に沿って別途実装する。
chrome.idle.onStateChanged.addListener(() => {});
