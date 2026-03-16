import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const backend = env.SERVICE_API_URL || 'http://127.0.0.1:5000';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy resume download and other API calls to backend to avoid CORS in dev
          '/resumes': {
            target: backend,
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path,
          },
          '/api': {
            target: backend,
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.SERVICE_API_KEY': JSON.stringify(env.SERVICE_API_KEY),
        'process.env.SERVICE_API_URL': JSON.stringify(env.SERVICE_API_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
