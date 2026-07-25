import { useLayoutEffect, useRef } from "react";

/**
 * Activity で非表示にされている間にブラウザがリセットするスクロール位置を復元する。
 * 戻り値の ref を overflow-y-auto を持つ要素に渡す。
 */
export const useScrollRestoration = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const scrollTopRef = useRef(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.scrollTop = scrollTopRef.current;

    const handleScroll = () => {
      scrollTopRef.current = element.scrollTop;
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, []);

  return ref;
};
