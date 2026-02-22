/**
 * Auto-Company - Main Entry Point
 * Linux-first autonomous AI company runner
 */

import { AutoLoop } from './loop.js';
import { Logger } from './logger.js';
import { Config } from './config.js';
import fs from 'fs';
import path from 'path';

const logger = new Logger('main');
const config = new Config();

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'start';

async function main() {
  logger.info('='.repeat(50));
  logger.info('Auto-Company v2.0.0 (Node.js - Linux Optimized)');
  logger.info('='.repeat(50));
  
  // Load configuration
  config.load();
  logger.info(`Config loaded: engine=${config.get('ENGINE')}, model=${config.get('MODEL')}`);
  
  const stateFile = path.join(config.get('PROJECT_DIR'), '.auto-company-state.json');
  
  switch (command) {
    case 'start':
      await startLoop();
      break;
    case 'start:daemon':
    case '--daemon':
      await startLoop(true);
      break;
    case 'stop':
    case '--stop':
      await stopLoop();
      break;
    case 'status':
    case '--status':
      showStatus();
      break;
    case 'logs':
    case '--logs':
      showLogs();
      break;
    case 'dashboard':
    case '--dashboard':
      const { startDashboard } = await import('./dashboard/server.js');
      startDashboard(config);
      break;
    default:
      logger.error(`Unknown command: ${command}`);
      console.log(`
Usage: npm run <command>

Commands:
  start           Start the auto-loop in foreground
  start:daemon   Start as daemon (background)
  stop           Stop the running loop
  status         Show loop status
  logs           Show recent logs
  dashboard      Start web dashboard (port 3456)

Environment variables:
  ENGINE         Codex or claude-code (default: codex)
  MODEL          Model name override
  INTERVAL       Seconds between cycles (default: 30)
  TIMEOUT        Max seconds per cycle (default: 1800)
  LOG_LEVEL      debug, info, warn, error (default: info)
      `);
  }
}

async function startLoop(daemon = false) {
  // Check if already running
  if (fs.existsSync(config.get('PID_FILE'))) {
    const pid = parseInt(fs.readFileSync(config.get('PID_FILE'), 'utf8'));
    try {
      process.kill(pid, 0);
      logger.error(`Auto-company already running (PID: ${pid}). Stop it first.`);
      process.exit(1);
    } catch (e) {
      logger.warn('Stale PID file found, removing...');
      fs.unlinkSync(config.get('PID_FILE'));
    }
  }
  
  // Check dependencies
  const { checkEngine } = await import('./engine.js');
  const enginePath = await checkEngine(config.get('ENGINE'));
  logger.info(`Engine found: ${enginePath}`);
  
  // Save PID
  fs.writeFileSync(config.get('PID_FILE'), process.pid.toString());
  
  // Handle signals
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down...');
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down...');
    cleanup();
    process.exit(0);
  });
  
  // Start the loop
  const loop = new AutoLoop(config);
  
  // Auto-start dashboard
  const dashboardPort = config.get('DASHBOARD_PORT');
  const { startDashboard } = await import('./dashboard/server.js');
  startDashboard(config);
  logger.info(`Dashboard will be available at http://localhost:${dashboardPort}`);
  
  await loop.start();
}

async function stopLoop() {
  const pidFile = config.get('PID_FILE');
  if (!fs.existsSync(pidFile)) {
    logger.error('No running instance found');
    process.exit(1);
  }
  
  const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));
  try {
    process.kill(pid, 'SIGTERM');
    logger.info(`Sent SIGTERM to PID ${pid}`);
    
    // Wait for graceful shutdown
    setTimeout(() => {
      try {
        process.kill(pid, 0);
        logger.warn('Process did not stop gracefully, forcing...');
        process.kill(pid, 'SIGKILL');
      } catch (e) {
        // Process already dead
      }
      fs.unlinkSync(pidFile);
      logger.info('Stopped');
    }, 5000);
  } catch (e) {
    logger.error(`Failed to stop: ${e.message}`);
    fs.unlinkSync(pidFile);
  }
}

function showStatus() {
  const stateFile = path.join(config.get('PROJECT_DIR'), '.auto-company-state.json');
  if (!fs.existsSync(stateFile)) {
    console.log('No status available - not running or never started');
    return;
  }
  
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  console.log('\n=== Auto-Company Status ===');
  console.log(`Status:      ${state.status}`);
  console.log(`Loop Count:  ${state.loopCount}`);
  console.log(`Error Count: ${state.errorCount}`);
  console.log(`Engine:      ${state.engine}`);
  console.log(`Model:       ${state.model}`);
  console.log(`Last Run:    ${state.lastRun}`);
  console.log(`Current:     ${state.current || 'N/A'}`);
  console.log('==============================\n');
}

function showLogs() {
  const logDir = path.join(config.get('PROJECT_DIR'), 'logs');
  if (!fs.existsSync(logDir)) {
    console.log('No logs found');
    return;
  }
  
  const logFile = path.join(logDir, 'auto-company.log');
  if (!fs.existsSync(logFile)) {
    console.log('No log file found');
    return;
  }
  
  // Show last 50 lines
  const lines = fs.readFileSync(logFile, 'utf8').split('\n').slice(-50);
  console.log('\n=== Recent Logs (last 50 lines) ===');
  console.log(lines.join('\n'));
  console.log('====================================\n');
}

function cleanup() {
  try {
    fs.unlinkSync(config.get('PID_FILE'));
  } catch (e) {}
}

main().catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
