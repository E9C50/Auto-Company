/**
 * Dashboard Server
 * Web-based monitoring dashboard for Linux
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let wss = null;
let state = { loopCount: 0, errorCount: 0, running: false };

export function startDashboard(config) {
  const app = express();
  const port = config.get('DASHBOARD_PORT');
  const projectDir = config.get('PROJECT_DIR');
  const dashboardDir = path.join(projectDir, 'dashboard');
  
  // Serve static files from dashboard folder
  app.use(express.static(dashboardDir));
  
  // Serve index.html for root path
  app.get('/', (req, res) => {
    res.sendFile(path.join(dashboardDir, 'index.html'));
  });
  
  // API endpoints
  app.get('/api/status', (req, res) => {
    const stateFile = config.get('STATE_FILE');
    if (fs.existsSync(stateFile)) {
      state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
    res.json(state);
  });
  
  app.get('/api/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const logFile = path.join(config.get('LOG_DIR'), 'auto-company.log');
    
    if (!fs.existsSync(logFile)) {
      return res.json([]);
    }
    
    const lines = fs.readFileSync(logFile, 'utf8').split('\n').slice(-limit);
    res.json(lines.filter(l => l.length > 0));
  });
  
  app.get('/api/cycles', (req, res) => {
    const logDir = config.get('LOG_DIR');
    const limit = parseInt(req.query.limit) || 10;
    
    if (!fs.existsSync(logDir)) {
      return res.json([]);
    }
    
    const cycles = fs.readdirSync(logDir)
      .filter(f => f.startsWith('cycle-') && f.endsWith('.log'))
      .sort()
      .reverse()
      .slice(0, limit)
      .map(f => {
        const filePath = path.join(logDir, f);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        const preview = content.substring(0, 500);
        
        // Try to determine status
        let status = 'unknown';
        if (content.includes('successfully') || content.includes('✓') || content.includes('done')) {
          status = 'success';
        } else if (content.includes('error') || content.includes('failed') || content.includes('✗')) {
          status = 'error';
        }
        
        return {
          name: f,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          preview,
          status
        };
      });
    
    res.json(cycles);
  });
  
  app.get('/api/consensus', (req, res) => {
    const consensusFile = config.get('CONSENSUS_FILE');
    if (fs.existsSync(consensusFile)) {
      const content = fs.readFileSync(consensusFile, 'utf8');
      res.json({ content, exists: true });
    } else {
      res.json({ content: null, exists: false });
    }
  });
  
  app.post('/api/stop', (req, res) => {
    const stopFile = path.join(config.get('PROJECT_DIR'), '.auto-company-stop');
    fs.writeFileSync(stopFile, '');
    res.json({ success: true });
  });
  
  // Create HTTP server
  const server = createServer(app);
  
  // WebSocket for real-time updates
  wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('[dashboard] WebSocket client connected');
    
    // Send current state immediately
    ws.send(JSON.stringify({ type: 'state', ...state }));
    
    // Watch for state changes
    const stateFile = config.get('STATE_FILE');
    let lastState = '';
    
    const watchInterval = setInterval(() => {
      try {
        if (fs.existsSync(stateFile)) {
          const currentState = fs.readFileSync(stateFile, 'utf8');
          if (currentState !== lastState) {
            lastState = currentState;
            const parsed = JSON.parse(currentState);
            ws.send(JSON.stringify({ type: 'state', ...parsed }));
          }
        }
      } catch (e) {}
    }, 2000);
    
    ws.on('close', () => {
      clearInterval(watchInterval);
    });
  });
  
  server.listen(port, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║     Auto-Company Dashboard                        ║
║     http://localhost:${port}                       ║
╠═══════════════════════════════════════════════════╣
║  Access from:                                     ║
║    - localhost:${port}                            ║
║    - http://<your-ip>:${port}                    ║
╚═══════════════════════════════════════════════════╝
    `);
  });
}
