import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import compression from 'vite-plugin-compression';
import checker from 'vite-plugin-checker';

// Production-ready Vite configuration for Urban Gardening Assistant
export default defineConfig({
  plugins: [
    // React plugin with Fast Refresh support for development
    react({ 
      fastRefresh: true 
    }),
    
    // TypeScript path alias resolution
    tsconfigPaths(),
    
    // Gzip compression for production builds
    compression({ 
      algorithm: 'gzip',
      ext: '.gz' 
    }),
    
    // Type checking and linting during development
    checker({ 
      typescript: true,
      eslint: {
        lintCommand: 'eslint ./src'
      }
    })
  ],

  // Development server configuration
  server: {
    port: 3000,
    host: true,
    // API proxy configuration for backend communication
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    // Security headers
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';"
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    modulePreload: {
      polyfill: true
    },
    // Chunk splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@emotion/react']
        }
      }
    },
    // Terser optimization options
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },

  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@utils': '/src/utils'
    }
  },

  // CSS configuration
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/variables.scss";'
      }
    }
  },

  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/setupTests.ts']
    }
  },

  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material'],
    exclude: ['@testing-library/react']
  }
});