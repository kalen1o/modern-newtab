import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
    plugins: [
        react(),
        federation({
            name: 'autocomplete',
            filename: 'remoteEntry.js',
            exposes: {
                './Autocomplete': './src/components/AutocompleteInput.tsx',
            },
            shared: ['react', 'react-dom'],
        }),
    ],
    build: {
        target: 'esnext',
        modulePreload: false,
        minify: false,
        cssCodeSplit: false,
    },
    server: {
        port: 5001,
        cors: true,
    },
    preview: {
        port: 5001,
        cors: true,
    },
    resolve: {
        dedupe: ['react', 'react-dom'],
    },
})
