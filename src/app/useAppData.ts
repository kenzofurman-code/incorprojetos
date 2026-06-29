import { useCallback, useEffect, useMemo, useState } from 'react';
import { repository } from '../lib/repository';
import type { AppState } from '../types/models';

interface UseAppDataResult {
  state: AppState | null;
  loading: boolean;
  error: string | null;
  mode: string;
  reload: () => Promise<void>;
}

export function useAppData(): UseAppDataResult {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repository.loadAppState();
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return useMemo(() => ({ state, loading, error, mode: repository.mode, reload }), [state, loading, error, reload]);
}
