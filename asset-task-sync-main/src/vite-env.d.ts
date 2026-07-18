/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  turnstile?: {
    render: (container: HTMLElement, options: Record<string, unknown>) => string;
    remove: (widgetId: string) => void;
    reset: (widgetId: string) => void;
  };
}
