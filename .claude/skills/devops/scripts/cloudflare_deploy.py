#!/usr/bin/env python3
"""
Cloudflare Worker Deployment Utility

Automates Cloudflare Worker deployments with wrangler.toml configuration handling,
multi-environment support, and comprehensive error handling.

Usage:
    python cloudflare-deploy.py --env production --dry-run
    python cloudflare-deploy.py --project ./my-worker --env staging
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class CloudflareDeployError(Exception):
    """Custom exception for Cloudflare deployment errors."""
    pass


class CloudflareDeploy:
    """Handle Cloudflare Worker deployments with wrangler CLI."""

    def __init__(self, project_dir: Path, env: Optional[str] = None,
                 dry_run: bool = False, verbose: bool = False):
        """
        Initialize CloudflareDeploy.

        Args:
            project_dir: Path to Worker project directory
            env: Environment name (production, staging, dev)
            dry_run: Preview deployment without actually deploying
            verbose: Enable verbose output
        """
        self.project_dir = Path(project_dir).resolve()
        self.env = env
        self.dry_run = dry_run
        self.verbose = verbose
        self.wrangler_toml = self.project_dir / "wrangler.toml"

    def validate_project(self) -> bool:
        """
        Validate project directory and wrangler.toml existence.

        Returns:
            True if valid, False otherwise

        Raises:
            CloudflareDeployError: If validation fails
        """
        if not self.project_dir.exists():
            raise CloudflareDeployError(
                f"Project directory does not exist: {self.project_dir}"
            )

        if not self.wrangler_toml.exists():
            raise CloudflareDeployError(
                f"wrangler.toml not found in: {self.project_dir}"
            )

        return True

    def check_wrangler_installed(self) -> bool:
        """
        Check if wrangler CLI is installed.

        Returns:
            True if installed, False otherwise
        """
        try:
            result = subprocess.run(
                ["wrangler", "--version"],
                capture_output=True,
                text=True,
                check=True
            )
            if self.verbose:
                print(f"Wrangler version: {result.stdout.strip()}")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def run_command(self, cmd: List[str], check: bool = True) -> Tuple[int, str, str]:
        """
        Run shell command and capture output.

        Args:
            cmd: Command and arguments as list
            check: Raise exception on non-zero exit code

        Returns:
            Tuple of (exit_code, stdout, stderr)

        Raises:
            CloudflareDeployError: If command fails and check=True
        """
        if self.verbose:
            print(f"Running: {' '.join(cmd)}")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=self.project_dir,
                check=check
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.CalledProcessError as e:
            if check:
                raise CloudflareDeployError(
                    f"Command failed: {' '.join(cmd)}\n{e.stderr}"
                )
            return e.returncode, e.stdout, e.stderr

    def get_worker_name(self) -> str:
        """
        Extract worker name from wrangler.toml.

        Returns:
            Worker name

        Raises:
            CloudflareDeployError: If name cannot be extracted
        """
        try:
            with open(self.wrangler_toml, 'r') as f:
                for line in f:
                    if line.strip().startswith('name'):
                        # Parse: name = "worker-name"
