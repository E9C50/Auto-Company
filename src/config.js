/**
 * Configuration Module
 * Handles environment variables and defaults
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Config {
  constructor() {
    this.config = {};
    this.projectDir = null;
  }
  
  load() {
    // Project directory (parent of src/)
    this.projectDir = path.resolve(__dirname, '..');
    
    // Load .env if exists
    const envFile = path.join(this.projectDir, '.env');
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          process.env[match[1].trim()] = match[2].trim();
        }
      });
    }
    
    // Set defaults
    this.config = {
      PROJECT_DIR: this.projectDir,
      
      // Engine settings
      ENGINE: process.env.ENGINE || 'codex',
      MODEL: process.env.MODEL || '',
      SANDBOX_MODE: process.env.SANDBOX_MODE || 'danger-full-access',
      
      // Binary paths
      CODEX_BIN: process.env.CODEX_BIN || '',
      CLAUDE_BIN: process.env.CLAUDE_BIN || '',
      
      // Timing
      INTERVAL: parseInt(process.env.INTERVAL || '30'),
      TIMEOUT: parseInt(process.env.TIMEOUT || '1800'),
      COOLDOWN: parseInt(process.env.COOLDOWN || '300'),
      LIMIT_WAIT: parseInt(process.env.LIMIT_WAIT || '3600'),
      
      // Circuit breaker
      MAX_ERRORS: parseInt(process.env.MAX_ERRORS || '5'),
      
      // Logging
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      MAX_LOGS: parseInt(process.env.MAX_LOGS || '200'),
      
      // Files
      PID_FILE: path.join(this.projectDir, '.auto-company.pid'),
      STATE_FILE: path.join(this.projectDir, '.auto-company-state.json'),
      LOG_DIR: path.join(this.projectDir, 'logs'),
      CONSENSUS_FILE: path.join(this.projectDir, 'memories', 'consensus.md'),
      PROMPT_FILE: path.join(this.projectDir, 'PROMPT.md'),
      
      // Dashboard
      DASHBOARD_PORT: parseInt(process.env.DASHBOARD_PORT || '3456'),
    };
    
    return this.config;
  }
  
  get(key) {
    return this.config[key] || null;
  }
  
  set(key, value) {
    this.config[key] = value;
  }
  
  getAll() {
    return { ...this.config };
  }
}
