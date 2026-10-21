import { useCallback, useEffect, useRef, useState } from 'react';

export default function useSearchParams() {
  const [params, setParams] = useState(
    () => new URLSearchParams(window.location.search),
  );

  // Keep in sync with back/forward and external URL changes
  useEffect(() => {
    const onPop = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const stableRef = useRef(params);
  stableRef.current = params;

  const update = useCallback(next => {
    const current = new URLSearchParams(stableRef.current);
    const resolved =
      typeof next === 'function' ? next(current) : next;

    const url = new URL(window.location.href);
    url.search = resolved.toString();
    // replaceState: don't pollute back-button history with every tweak
    window.history.replaceState({}, '', url);
    setParams(new URLSearchParams(resolved.toString()));
  }, []);

  return [params, update];
}