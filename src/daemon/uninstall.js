/**
 * Daemon Uninstaller for Linux systemd
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
console.log('║  Auto-Company Daemon Uninstaller                ║');
console.log('╚═══════════════════════════════════════════════════╝');
console.log('');

// Stop service if running
try {
  execSync(`systemctl --user stop ${SERVICE_NAME}`, { stdio: 'pipe' });
  console.log('✓ Service stopped');
} catch (e) {
  // Not running, that's fine
}

// Disable service
try {
  execSync(`systemctl --user disable ${SERVICE_NAME}`, { stdio: 'pipe' });
  console.log('✓ Service disabled');
} catch (e) {
  // Not enabled, that's fine
}

// Remove service file
if (fs.existsSync(SERVICE_PATH)) {
  fs.unlinkSync(SERVICE_PATH);
  console.log(`✓ Service file removed: ${SERVICE_PATH}`);
} else {
  console.log('⚠ Service file not found');
}

// Reload systemd
try {
  execSync('systemctl --user daemon-reload');
  console.log('✓ systemd daemon-reloaded');
} catch (e) {
  // Ignore
}

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('Uninstallation complete!');
console.log('═══════════════════════════════════════════════════');
