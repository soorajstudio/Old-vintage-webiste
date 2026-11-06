import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: true,
  },
  plugins: [
    {
      name: 'serve-local-glb',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.includes('.glb')) {
            const cleanUrl = req.url.split('?')[0].replace(/^\//, '');
            const filePath = path.resolve(process.cwd(), decodeURIComponent(cleanUrl));
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const stat = fs.statSync(filePath);
              res.setHeader('Content-Type', 'model/gltf-binary');
              res.setHeader('Content-Length', stat.size);
              res.setHeader('Access-Control-Allow-Origin', '*');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
          next();
        });
      }
    }
  ]
});
