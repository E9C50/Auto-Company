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
let currentConfig = {};

export function startDashboard(config) {
  const app = express();
  const port = config.get('DASHBOARD_PORT');
  const projectDir = config.get('PROJECT_DIR');
  const dashboardDir = path.join(projectDir, 'dashboard');
  
  // Store config for global access
  currentConfig = config;
  
  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
  
  app.use(express.json());
  
  // Serve static files from dashboard folder
  app.use(express.static(dashboardDir));
  
  // Serve index.html for root path
  app.get('/', (req, res) => {
    res.sendFile(path.join(dashboardDir, 'index.html'));
  });

  // ========== API Endpoints ==========
  
  // Get all config options
  app.get('/api/config', (req, res) => {
    const configPath = path.join(projectDir, '.env');
    let envVars = {};
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) envVars[match[1]] = match[2];
      });
    }
    
    res.json({
      engine: config.get('ENGINE'),
      model: config.get('MODEL') || '',
      interval: config.get('INTERVAL'),
      timeout: config.get('TIMEOUT'),
      dashboardPort: config.get('DASHBOARD_PORT'),
      envVars
    });
  });
  
  // Update config
  app.post('/api/config', (req, res) => {
    const { engine, model, interval, timeout } = req.body;
    const configPath = path.join(projectDir, '.env');
    
    let envVars = {};
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) envVars[match[1]] = match[2];
      });
    }
    
    if (engine) envVars.ENGINE = engine;
    if (model !== undefined) envVars.MODEL = model;
    if (interval) envVars.INTERVAL = String(interval);
    if (timeout) envVars.TIMEOUT = String(timeout);
    
    const newContent = Object.entries(envVars)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    
    fs.writeFileSync(configPath, newContent + '\n');
    
    res.json({ success: true, message: 'Config updated. Restart to apply changes.' });
  });
  
  // Get current status
  app.get('/api/status', (req, res) => {
    const stateFile = config.get('STATE_FILE');
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      res.json(state);
    } else {
      res.json({ status: 'stopped', loopCount: 0, errorCount: 0 });
    }
  });
  
  // Get current config values
  app.get('/api/settings', (req, res) => {
    res.json({
      engine: config.get('ENGINE'),
      model: config.get('MODEL') || '',
      interval: config.get('INTERVAL'),
      timeout: config.get('TIMEOUT'),
      paused: fs.existsSync(path.join(projectDir, '.auto-company-paused'))
    });
  });
  
  // Pause/Resume cycle
  app.post('/api/pause', (req, res) => {
    const pauseFile = path.join(projectDir, '.auto-company-paused');
    fs.writeFileSync(pauseFile, Date.now().toString());
    res.json({ success: true, paused: true });
  });
  
  app.post('/api/resume', (req, res) => {
    const pauseFile = path.join(projectDir, '.auto-company-paused');
    if (fs.existsSync(pauseFile)) {
      fs.unlinkSync(pauseFile);
    }
    res.json({ success: true, paused: false });
  });
  
  // Send new idea to AI
  app.post('/api/idea', (req, res) => {
    const { idea } = req.body;
    if (!idea) {
      return res.status(400).json({ error: 'Idea is required' });
    }
    
    const ideaFile = path.join(projectDir, '.auto-company-idea');
    fs.writeFileSync(ideaFile, idea);
    
    // Also update consensus to trigger action
    const consensusFile = config.get('CONSENSUS_FILE');
    let consensus = '';
    if (fs.existsSync(consensusFile)) {
      consensus = fs.readFileSync(consensusFile, 'utf8');
    }
    
    // Add idea to consensus
    const newConsensus = `${consensus}

---

## New Idea Received (from dashboard)
${idea}

Please analyze this idea, refine it into a concrete plan, and execute it!
`;
    
    fs.writeFileSync(consensusFile, newConsensus);
    
    res.json({ success: true, message: 'Idea submitted! AI will analyze and execute it in the next cycle.' });
  });
  
  // Get all cycles (history)
  app.get('/api/cycles', (req, res) => {
    const logDir = path.join(projectDir, 'logs');
    if (!fs.existsSync(logDir)) {
      return res.json([]);
    }
    
    const cycles = fs.readdirSync(logDir)
      .filter(f => f.startsWith('cycle-') && f.endsWith('.log'))
      .sort()
      .reverse()
      .map(f => {
        const filePath = path.join(logDir, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          size: stats.size,
          modified: stats.mtime.toISOString()
        };
      });
    
    res.json(cycles);
  });
  
  // Get specific cycle content
  app.get('/api/cycle/:name', (req, res) => {
    const logDir = path.join(projectDir, 'logs');
    const filePath = path.join(logDir, req.params.name);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Cycle not found' });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content });
  });
  
  // Get memories/consensus
  app.get('/api/consensus', (req, res) => {
    const consensusFile = path.join(projectDir, 'memories', 'consensus.md');
    if (fs.existsSync(consensusFile)) {
      const content = fs.readFileSync(consensusFile, 'utf8');
      res.json({ content, exists: true });
    } else {
      res.json({ content: null, exists: false });
    }
  });
  
  // Get all files in memories directory
  app.get('/api/memories', (req, res) => {
    const memoriesDir = path.join(projectDir, 'memories');
    if (!fs.existsSync(memoriesDir)) {
      return res.json([]);
    }
    
    const files = getAllFiles(memoriesDir, memoriesDir);
    res.json(files);
  });
  
  // Get specific memory file
  app.get('/api/memory/:file(*)', (req, res) => {
    const memoryPath = path.join(projectDir, 'memories', req.params.file);
    
    if (!fs.existsSync(memoryPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const content = fs.readFileSync(memoryPath, 'utf8');
    res.json({ content });
  });
  
  // Get project directory structure
  app.get('/api/files', (req, res) => {
    const dir = req.query.dir || '';
    const baseDir = path.join(projectDir, dir);
    
    if (!fs.existsSync(baseDir)) {
      return return res.status(404).json({ error: 'Directory not found' });
    }
    
    try {
      const items = fs.readdirSync(baseDir, { withFileTypes: true });
      const result = items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        path: path.join(dir, item.name)
      }));
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  
  // Get file content
  app.get('/api/file/:path(*)', (req, res) => {
    const filePath = path.join(projectDir, req.params.path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    try {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        return res.status(400).json({ error: 'Is a directory' });
      }
      
      // Limit file size
      if (stats.size > 1024 * 1024) {
        return res.status(400).json({ error: 'File too large' });
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      res.json({ content, size: stats.size });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  
  // Get logs
  app.get('/api/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const logFile = path.join(projectDir, 'logs', 'auto-company.log');
    
    if (!fs.existsSync(logFile)) {
      return res.json([]);
    }
    
    const lines = fs.readFileSync(logFile, 'utf8').split('\n').slice(-limit);
    res.json(lines.filter(l => l.length > 0));
  });
  
  // Stop command
  app.post('/api/stop', (req, res) => {
    const stopFile = path.join(projectDir, '.auto-company-stop');
    fs.writeFileSync(stopFile, '');
    res.json({ success: true });
  });
  
  // Restart command
  app.post('/api/restart', (req, res) => {
    const stopFile = path.join(projectDir, '.auto-company-stop');
    const restartFile = path.join(projectDir, '.auto-company-restart');
    fs.writeFileSync(stopFile, '');
    fs.writeFileSync(restartFile, '1');
    res.json({ success: true, message: 'Restarting...' });
  });
  
  // Create HTTP server
  const server = createServer(app);
  
  // WebSocket for real-time updates
  wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('[dashboard] WebSocket client connected');
    
    // Send current state immediately
    const stateFile = config.get('STATE_FILE');
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      ws.send(JSON.stringify({ type: 'state', ...state }));
    }
    
    // Send current settings
    ws.send(JSON.stringify({
      type: 'settings',
      engine: config.get('ENGINE'),
      model: config.get('MODEL'),
      paused: fs.existsSync(path.join(projectDir, '.auto-company-paused'))
    }));
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
  
  // Broadcast function for external use
  return {
    broadcast: (type, data) => {
      if (wss) {
        const msg = JSON.stringify({ type, ...data });
        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(msg);
          }
        });
      }
    }
  };
}

function getAllFiles(dir, baseDir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  let result = [];
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (item.isDirectory()) {
      result.push({
        name: item.name,
        type: 'directory',
        path: relativePath
      });
      result = result.concat(getAllFiles(fullPath, baseDir));
    } else {
      result.push({
        name: item.name,
        type: 'file',
        path: relativePath
      });
    }
  }
  
  return result;
}
