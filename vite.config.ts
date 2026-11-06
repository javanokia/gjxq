import { defineConfig } from 'vite';
import { ChessMultiplayerServer } from './server/chess-server.ts';

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'chess-multiplayer-ws',
      configureServer(server) {
        if (server.httpServer) {
          const wsServer = new ChessMultiplayerServer();
          wsServer.attach(server.httpServer);
        }
      },
      configurePreviewServer(server) {
        if (server.httpServer) {
          const wsServer = new ChessMultiplayerServer();
          wsServer.attach(server.httpServer);
        }
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
});
