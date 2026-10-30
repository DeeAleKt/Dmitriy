import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

/** Поточний час, що оновлюється раз на period мс (для темпу зміни). */
export function useNow(period = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), period);
    const onVis = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [period]);
  return now;
}
