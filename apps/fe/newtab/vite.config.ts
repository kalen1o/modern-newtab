import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler']],
            },
        }),
        federation({
            name: 'newtab-shell',
            remotes: {
                autocomplete: 'http://localhost:5001/assets/remoteEntry.js',
                news: 'http://localhost:5002/assets/remoteEntry.js',
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
        port: 5173,
        cors: true,
    },
    resolve: {
        dedupe: ['react', 'react-dom'],
    },
})
