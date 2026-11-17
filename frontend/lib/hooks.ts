'use client';
import { useEffect, useState, useCallback } from 'react';

// Runs an async loader and tracks loading / error state. `reload()` runs it again.
export function useLoad(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await loader()); } catch (e) { setError(e); }
    setLoading(false);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run]);
  return { data, error, loading, reload: run };
}
