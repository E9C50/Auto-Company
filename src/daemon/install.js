/**
 * Daemon Installer for Linux systemd
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_DIR = path.resolve(__dirname, '..');
const SERVICE_NAME = 'auto-company.service';
const SYSTEMD_USER_DIR = path.join(process.env.HOME, '.config', 'systemd', 'user');
const SERVICE_PATH = path.join(SYSTEMD_USER_DIR, SERVICE_NAME);

console.log('╔═══════════════════════════════════════════════════╗');
console.log('║  Auto-Company Daemon Installer (Linux systemd)  ║');
console.log('╚═══════════════════════════════════════════════════╝');
console.log('');

// Check for systemctl
try {
  execSync('systemctl --version', { stdio: 'pipe' });
} catch (e) {
  console.error('Error: systemctl not found.');
  console.error('This script requires systemd (Linux).');
  process.exit(1);
}

// Create systemd directory
if (!fs.existsSync(SYSTEMD_USER_DIR)) {
  fs.mkdirSync(SYSTEMD_USER_DIR, { recursive: true });
}

// Get node path
const nodePath = execSync('which node', { encoding: 'utf8' }).trim();
console.log(`Node path: ${nodePath}`);

// Create service file
const serviceContent = `[Unit]
Description=Auto Company - Autonomous AI Company
After=network.target

[Service]
Type=simple
WorkingDirectory=${PROJECT_DIR}
ExecStart=${nodePath} ${PROJECT_DIR}/src/index.js start:daemon
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=default.target
`;

fs.writeFileSync(SERVICE_PATH, serviceContent);
console.log(`✓ Service file created: ${SERVICE_PATH}`);

// Reload systemd
try {
  execSync('systemctl --user daemon-reload');
  console.log('✓ systemd daemon-reloaded');
} catch (e) {
  console.warn('⚠ Could not reload systemd:', e.message);
}

// Enable service
try {
  execSync(`systemctl --user enable ${SERVICE_NAME}`);
  console.log('✓ Service enabled');
} catch (e) {
  console.warn('⚠ Could not enable service:', e.message);
}

// Check linger state
try {
  const currentUser = execSync('whoami', { encoding: 'utf8' }).trim();
  const lingerState = execSync(`loginctl show-user ${currentUser} -p Linger --value`, { encoding: 'utf8' }).trim();
  
  if (lingerState === 'no') {
    console.log('');
    console.log('⚠ Warning: linger is disabled for your user.');
    console.log('  The service may not start on boot. To enable:');
    console.log(`    sudo loginctl enable-linger ${currentUser}`);
  }
} catch (e) {
  // Ignore
}

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('Installation complete!');
console.log('');
console.log('Commands:');
console.log('  systemctl --user start auto-company    # Start');
console.log('  systemctl --user stop auto-company     # Stop');
console.log('  systemctl --user status auto-company   # Status');
console.log('  journalctl --user -u auto-company -f  # Logs');
console.log('═══════════════════════════════════════════════════');
