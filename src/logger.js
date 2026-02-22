/**
 * Logger Module
 * Detailed logging with timestamps and levels
 */

import fs from 'fs';
import path from 'path';
import { Config } from './config.js';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

export class Logger {
  constructor(name = 'auto-company') {
    this.name = name;
    this.config = new Config();
    this.config.load();
    
    // Ensure log directory exists
    const logDir = this.config.get('LOG_DIR');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    this.logFile = path.join(logDir, 'auto-company.log');
    this.level = LOG_LEVELS[this.config.get('LOG_LEVEL')] || LOG_LEVELS.info;
  }
  
  getTimestamp() {
    return new Date().toISOString();
  }
  
  format(level, message) {
    const ts = this.getTimestamp();
    return `[${ts}] [${level.toUpperCase()}] [${this.name}] ${message}`;
  }
  
  write(level, message) {
    if (LOG_LEVELS[level] < this.level) return;
    
    const formatted = this.format(level, message);
    
    // Console output
    console.log(formatted);
    
    // File output
    try {
      fs.appendFileSync(this.logFile, formatted + '\n');
    } catch (e) {
      console.error('Failed to write to log file:', e.message);
    }
  }
  
  debug(message) {
    this.write('debug', message);
  }
  
  info(message) {
    this.write('info', message);
  }
  
  warn(message) {
    this.write('warn', message);
  }
  
  error(message) {
    this.write('error', message);
  }
  
  // Cycle-specific logging
  cycleStart(cycleNum) {
    this.info(`═══════════════════════════════════════════════════`);
    this.info(`CYCLE #${cycleNum} STARTED`);
    this.info(`═══════════════════════════════════════════════════`);
  }
  
  cycleEnd(cycleNum, status, duration, details = '') {
    this.info(`CYCLE #${cycleNum} ${status} (${duration}ms) ${details}`);
    this.info(`───────────────────────────────────────────────────`);
  }
  
  // Command output logging
  commandStart(cmd) {
    this.debug(`Executing: ${cmd}`);
  }
  
  commandOutput(output) {
    this.debug(`Output: ${output.substring(0, 500)}`);
  }
  
  commandError(error) {
    this.error(`Command failed: ${error}`);
  }
}
