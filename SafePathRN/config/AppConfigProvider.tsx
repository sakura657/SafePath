import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, OPENROUTER_API_KEY, OPENROUTER_MODEL } from './env';

export type AppConfig = {
  apiBaseUrl: string;
  openRouterApiKey: string;
  openRouterModel: string;
};

export type AppConfigContextValue = {
  config: AppConfig;
  isLoaded: boolean;
  updateConfig: (partial: Partial<AppConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
};

const STORAGE_KEY = 'safepath.appConfig.v1';

const DEFAULT_CONFIG: AppConfig = {
  apiBaseUrl: API_BASE_URL,
  openRouterApiKey: OPENROUTER_API_KEY,
  openRouterModel: OPENROUTER_MODEL,
};

const AppConfigContext = createContext<AppConfigContextValue | undefined>(undefined);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw: string | null) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<AppConfig>;
        setConfig((prev) => ({ ...prev, ...parsed }));
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const persist = async (next: AppConfig) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const updateConfig = async (partial: Partial<AppConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      persist(next).catch((error) => console.error('Failed to persist config', error));
      return next;
    });
  };

  const resetConfig = async () => {
    setConfig(DEFAULT_CONFIG);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ config, isLoaded, updateConfig, resetConfig }),
    [config, isLoaded]
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig(): AppConfigContextValue {
  const ctx = useContext(AppConfigContext);
  if (!ctx) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return ctx;
}
