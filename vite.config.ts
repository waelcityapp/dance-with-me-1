import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'import.meta.env.VITE_ADMIN_EMAIL': JSON.stringify(process.env.VITE_ADMIN_EMAIL || ''),
      'import.meta.env.VITE_CLOUDINARY_CLOUD_NAME': JSON.stringify(process.env.VITE_CLOUDINARY_CLOUD_NAME || ''),
      'import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET': JSON.stringify(process.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''),
      'import.meta.env.VITE_CLOUDINARY_API_KEY': JSON.stringify(process.env.VITE_CLOUDINARY_API_KEY || ''),
      'import.meta.env.VITE_CLOUDINARY_API_SECRET': JSON.stringify(process.env.VITE_CLOUDINARY_API_SECRET || ''),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
