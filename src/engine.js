/**
 * Engine Module
 * Detects and manages Codex/Claude Code executables
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Logger } from './logger.js';

const logger = new Logger('engine');

export async function checkEngine(engineName) {
  logger.info(`Checking for engine: ${engineName}`);
  
  const engines = {
    'codex': ['codex', 'codex-cli'],
    'claude-code': ['claude-code', 'claude'],
    'claude': ['claude', 'claude-code']
  };
  
  const candidates = engines[engineName] || [engineName];
  
  // Try explicit path first
  const config = new (await import('./config.js')).Config();
  config.load();
  
  const explicitPath = config.get('CODEX_BIN') || config.get('CLAUDE_BIN');
  if (explicitPath) {
    if (fs.existsSync(explicitPath) && isExecutable(explicitPath)) {
      logger.info(`Using explicit path: ${explicitPath}`);
      return explicitPath;
    }
  }
  
  // Try candidates in order
  for (const candidate of candidates) {
    const found = findInPath(candidate);
    if (found) {
      logger.info(`Found ${engineName}: ${found}`);
      
      // Verify it works
      try {
        const version = execSync(`"${found}" --version 2>&1`, { 
          timeout: 10000,
          encoding: 'utf8'
        }).substring(0, 200);
        logger.debug(`Version: ${version}`);
      } catch (e) {
        logger.warn(`Could not get version: ${e.message}`);
      }
      
      return found;
    }
  }
  
  // Try nvm-installed version
  const nvmPath = findNvmVersion(engineName);
  if (nvmPath) {
    logger.info(`Found via nvm: ${nvmPath}`);
    return nvmPath;
  }
  
  throw new Error(`${engineName} not found. Install it and ensure it's in PATH.`);
}

function findInPath(cmd) {
  const PATH = process.env.PATH || '';
  const paths = PATH.split(process.platform === 'win32' ? ';' : ':');
  
  for (const dir of paths) {
    const fullPath = path.join(dir, cmd);
    const fullPathWin = path.join(dir, `${cmd}.exe`);
    
    if (isExecutable(fullPath)) return fullPath;
    if (isExecutable(fullPathWin)) return fullPathWin;
  }
  
  return null;
}

function isExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch (e) {
    return false;
  }
}

function findNvmVersion(engine) {
  const home = os.homedir();
  const nvmDir = process.env.NVM_DIR || path.join(home, '.nvm');
  
  if (!fs.existsSync(nvmDir)) return null;
  
  const versionsDir = path.join(nvmDir, 'versions', 'node');
  if (!fs.existsSync(versionsDir)) return null;
  
  const versions = fs.readdirSync(versionsDir).sort().reverse();
  
  for (const version of versions) {
    const binDir = path.join(versionsDir, version, 'bin');
    if (!fs.existsSync(binDir)) continue;
    
    const engineBin = path.join(binDir, engine);
    if (isExecutable(engineBin)) {
      return engineBin;
    }
    
    // Try claude-code alias
    if (engine === 'codex') {
      const claudeBin = path.join(binDir, 'claude-code');
      if (isExecutable(claudeBin)) return claudeBin;
    }
  }
  
  return null;
}

export async function runEngine(enginePath, args, options = {}) {
  const { spawn } = await import('child_process');
  const config = new (await import('./config.js')).Config();
  config.load();
  
  const timeout = options.timeout || config.get('TIMEOUT') * 1000;
  
  logger.debug(`Running: ${enginePath} ${args.join(' ')}`);
  logger.debug(`Timeout: ${timeout}ms`);
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const proc = spawn(enginePath, args, {
      cwd: config.get('PROJECT_DIR'),
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      logger.debug(`[stdout] ${chunk.substring(0, 200)}`);
    });
    
    proc.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      logger.debug(`[stderr] ${chunk.substring(0, 200)}`);
    });
    
    const timer = setTimeout(() => {
      logger.warn(`Process timed out after ${timeout}ms, killing...`);
      proc.kill('SIGKILL');
      reject(new Error(`Timeout after ${timeout}ms`));
    }, timeout);
    
    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      clearTimeout(timer);
      
      logger.debug(`Process exited with code ${code} in ${duration}ms`);
      
      resolve({
        code,
        stdout,
        stderr,
        duration,
        timedOut: false
      });
    });
    
    proc.on('error', (err) => {
      clearTimeout(timer);
      logger.error(`Process error: ${err.message}`);
      reject(err);
    });
  });
}
