/**
 * AutoLoop Module
 * Core autonomous loop logic
 */

import fs from 'fs';
import path from 'path';
import { Logger } from './logger.js';
import { checkEngine, runEngine } from './engine.js';
import { WebSocketServer } from 'ws';

export class AutoLoop {
  constructor(config) {
    this.config = config;
    this.logger = new Logger('loop');
    this.loopCount = 0;
    this.errorCount = 0;
    this.consecutiveErrors = 0;
    this.running = false;
    this.wss = null;
  }
  
  async start() {
    this.logger.info('Starting Auto Company Loop...');
    this.running = true;
    
    // Ensure directories exist
    const logDir = this.config.get('LOG_DIR');
    const memDir = path.join(this.config.get('PROJECT_DIR'), 'memories');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });
    
    // Find engine
    const engineName = this.config.get('ENGINE');
    this.enginePath = await checkEngine(engineName);
    
    // Initialize WebSocket server for real-time updates
    this.initWebSocket();
    
    // Main loop
    while (this.running) {
      await this.runCycle();
      
      // Check for stop signal
      const stopFile = path.join(this.config.get('PROJECT_DIR'), '.auto-company-stop');
      if (fs.existsSync(stopFile)) {
        fs.unlinkSync(stopFile);
        this.logger.info('Stop signal detected, shutting down...');
        break;
      }
      
      // Wait interval
      const interval = this.config.get('INTERVAL') * 1000;
      this.logger.debug(`Sleeping for ${interval}ms...`);
      await this.sleep(interval);
    }
    
    this.cleanup();
  }
  
  initWebSocket() {
    try {
      const port = this.config.get('DASHBOARD_PORT');
      this.wss = new WebSocketServer({ port: port + 1 });
      
      this.wss.on('connection', (ws) => {
        this.logger.debug('WebSocket client connected');
        // Send current state
        ws.send(JSON.stringify({
          type: 'state',
          loopCount: this.loopCount,
          errorCount: this.errorCount,
          running: this.running
        }));
      });
      
      this.logger.info(`WebSocket server started on port ${port + 1}`);
    } catch (e) {
      this.logger.warn(`WebSocket failed to start: ${e.message}`);
    }
  }
  
  broadcast(type, data) {
    if (this.wss) {
      const msg = JSON.stringify({ type, ...data });
      this.wss.clients.forEach(client => {
        if (client.readyState === 1) { // OPEN
          client.send(msg);
        }
      });
    }
  }
  
  async runCycle() {
    this.loopCount++;
    const cycleNum = this.loopCount;
    const startTime = Date.now();
    
    this.logger.cycleStart(cycleNum);
    this.broadcast('cycleStart', { cycleNum });
    
    // Create cycle log file
    const cycleLogFile = path.join(
      this.config.get('LOG_DIR'),
      `cycle-${String(cycleNum).padStart(4, '0')}-${this.timestamp()}.log`
    );
    
    try {
      // Read prompt and consensus
      const prompt = await this.buildPrompt();
      
      // Run engine
      this.logger.info('Executing AI cycle...');
      const result = await this.executeCycle(prompt);
      
      // Save output
      fs.writeFileSync(cycleLogFile, result.stdout);
      
      // Check result
      const success = this.checkResult(result);
      
      if (success) {
        this.logger.cycleEnd(cycleNum, 'SUCCESS', result.duration);
        this.broadcast('cycleEnd', { 
          cycleNum, 
          status: 'success', 
          duration: result.duration 
        });
        this.consecutiveErrors = 0;
        this.saveState('running');
      } else {
        throw new Error('Cycle validation failed');
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.errorCount++;
      this.consecutiveErrors++;
      
      this.logger.error(`Cycle #${cycleNum} FAILED: ${error.message}`);
      this.logger.error(`Error count: ${this.errorCount}, Consecutive: ${this.consecutiveErrors}`);
      
      this.broadcast('cycleError', { 
        cycleNum, 
        error: error.message,
        errorCount: this.errorCount
      });
      
      // Restore consensus from backup
      await this.restoreConsensus();
      
      // Check circuit breaker
      if (this.consecutiveErrors >= this.config.get('MAX_ERRORS')) {
        this.logger.error('CIRCUIT BREAKER TRIGGERED!');
        this.logger.error(`Too many consecutive errors (${this.consecutiveErrors}), cooling down...`);
        
        this.broadcast('circuitBreaker', { 
          consecutiveErrors: this.consecutiveErrors 
        });
        
        const cooldown = this.config.get('COOLDOWN') * 1000;
        this.saveState('cooldown');
        await this.sleep(cooldown);
        
        this.consecutiveErrors = 0;
      }
      
      this.saveState('error');
    }
    
    // Rotate old logs
    await this.rotateLogs();
  }
  
  async buildPrompt() {
    const promptFile = this.config.get('PROMPT_FILE');
    const consensusFile = this.config.get('CONSENSUS_FILE');
    
    if (!fs.existsSync(promptFile)) {
      throw new Error(`PROMPT.md not found at ${promptFile}`);
    }
    
    let prompt = fs.readFileSync(promptFile, 'utf8');
    let consensus = '';
    
    if (fs.existsSync(consensusFile)) {
      consensus = fs.readFileSync(consensusFile, 'utf8');
    } else {
      consensus = 'No consensus file found. This is the very first cycle.';
    }
    
    // Build full prompt with consensus
    const fullPrompt = `${prompt}

---

## Runtime Guardrails (must follow)

1. Early in the cycle, create or update \`memories/consensus.md\` with the required section skeleton.
2. If work scope is large, persist partial decisions to \`memories/consensus.md\` before deep dives.
3. Prefer shipping one completed milestone over broad parallel exploration.

---

## Current Consensus (pre-loaded, do NOT re-read this file)

${consensus}

---

This is Cycle #${this.loopCount}. Act decisively.
`;
    
    return fullPrompt;
  }
  
  async executeCycle(prompt) {
    const args = ['exec'];
    
    // Add sandbox mode
    const sandbox = this.config.get('SANDBOX_MODE');
    args.push('-c', `sandbox_mode="${sandbox}"`);
    
    // Add model if specified
    const model = this.config.get('MODEL');
    if (model) {
      args.push('-m', model);
    }
    
    // Output to file for capture
    const outputFile = path.join(this.config.get('LOG_DIR'), `.cycle-output-${this.loopCount}.txt`);
    args.push('-o', outputFile);
    
    // Add prompt
    args.push(prompt);
    
    return await runEngine(this.enginePath, args);
  }
  
  checkResult(result) {
    // Check exit code
    if (result.code !== 0) {
      this.logger.warn(`Non-zero exit code: ${result.code}`);
      // Don't fail on non-zero if there's output
      if (!result.stdout || result.stdout.length < 10) {
        return false;
      }
    }
    
    // Check for usage/rate limit errors
    const output = result.stdout + result.stderr;
    const limitPatterns = [
      'usage limit', 'rate limit', 'too many requests',
      'resource_exhausted', 'overloaded', 'quota', '429',
      'billing', 'insufficient credits'
    ];
    
    for (const pattern of limitPatterns) {
      if (output.toLowerCase().includes(pattern)) {
        this.logger.error(`Usage limit detected: ${pattern}`);
        // Wait longer on rate limit
        const waitTime = this.config.get('LIMIT_WAIT') * 1000;
        this.sleep(waitTime);
        return false;
      }
    }
    
    return true;
  }
  
  async backupConsensus() {
    const consensusFile = this.config.get('CONSENSUS_FILE');
    if (fs.existsSync(consensusFile)) {
      fs.copyFileSync(consensusFile, consensusFile + '.bak');
    }
  }
  
  async restoreConsensus() {
    const consensusFile = this.config.get('CONSENSUS_FILE');
    const backupFile = consensusFile + '.bak';
    
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, consensusFile);
      this.logger.info('Consensus restored from backup');
    }
  }
  
  async rotateLogs() {
    const logDir = this.config.get('LOG_DIR');
    const maxLogs = this.config.get('MAX_LOGS');
    
    const files = fs.readdirSync(logDir)
      .filter(f => f.startsWith('cycle-') && f.endsWith('.log'))
      .sort();
    
    if (files.length > maxLogs) {
      const toDelete = files.slice(0, files.length - maxLogs);
      for (const f of toDelete) {
        fs.unlinkSync(path.join(logDir, f));
      }
      this.logger.debug(`Rotated ${toDelete.length} old cycle logs`);
    }
  }
  
  saveState(status) {
    const stateFile = this.config.get('STATE_FILE');
    const state = {
      status,
      loopCount: this.loopCount,
      errorCount: this.errorCount,
      consecutiveErrors: this.consecutiveErrors,
      lastRun: new Date().toISOString(),
      engine: this.config.get('ENGINE'),
      model: this.config.get('MODEL') || 'default',
      current: this.running ? `Cycle #${this.loopCount}` : 'Stopped'
    };
    
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  }
  
  timestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  cleanup() {
    this.running = false;
    
    if (this.wss) {
      this.wss.close();
    }
    
    const pidFile = this.config.get('PID_FILE');
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
    
    this.saveState('stopped');
    this.logger.info('Auto Company Loop stopped');
  }
  
  stop() {
    this.running = false;
  }
}
