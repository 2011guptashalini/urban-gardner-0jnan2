/// <reference types="vite/client" />

// Type declaration for environment variables with strict typing and readonly protection
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_AI_SERVICE_URL: string;
  readonly VITE_AUTH_DOMAIN: string;
  readonly VITE_AUTH_CLIENT_ID: string;
  readonly VITE_AUTH_AUDIENCE: string;
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
}

// Type augmentation for import.meta to provide environment variable typing
interface ImportMeta {
  readonly env: ImportMetaEnv;
}