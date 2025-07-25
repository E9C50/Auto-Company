# Dependency Security

Scanning, monitoring, and managing vulnerable dependencies.

## npm Audit

### Basic Usage

```bash
# Standard audit
npm audit

# JSON output for parsing
npm audit --json > audit.json

# Only production dependencies
npm audit --omit=dev

# Specific severity threshold
npm audit --audit-level=high

# Auto-fix where possible
npm audit fix

# Force major updates (review carefully)
npm audit fix --force
```

### Interpreting Results

```json
{
  "vulnerabilities": {
    "lodash": {
      "severity": "high",
      "via": ["Prototype Pollution"],
      "range": "<4.17.21",
      "fixAvailable": {
        "name": "lodash",
        "version": "4.17.21"
      }
    }
  }
}
```

### Severity Actions

| Severity | Production | Dev Only |
|----------|------------|----------|
| Critical | Block deploy | Urgent fix |
| High | Fix within 24h | Fix within week |
| Moderate | Fix within week | Fix within sprint |
| Low | Track in backlog | Optional |

### Handling False Positives

Create `.npmauditrc` or use `package.json`:

```json
{
  "audit-level": "moderate",
  "ignore-advisories": [
    "GHSA-xxxx-xxxx-xxxx"  
  ]
}
```

Document exclusions:

```markdown
## Security Audit Exclusions

### GHSA-xxxx-xxxx-xxxx (lodash prototype pollution)
- **Package**: lodash@4.17.15
- **Reason**: Only affects `_.template()` which we don't use
- **Review date**: 2024-01-15
- **Next review**: 2024-04-15
```

---

## pip-audit (Python)

### Installation

```bash
pip install pip-audit
```

### Usage

```bash
# Basic audit
pip-audit

# JSON output
pip-audit --format=json -o audit.json

# Specific requirements file
pip-audit -r requirements.txt

# Fix vulnerabilities
pip-audit --fix

# Strict mode (exit non-zero on any finding)
pip-audit --strict
```

### Safety Check (Alternative)

```bash
pip install safety

# Basic check
safety check

# Full report
safety check --full-report

# JSON output
safety check --json > safety-report.json
```

---

## Snyk Integration

### CLI Setup

```bash
npm install -g snyk
snyk auth
```

### Usage

```bash
# Test for vulnerabilities
snyk test

# Monitor (continuous)
snyk monitor

# Fix interactively
snyk wizard

# Test specific manifest
snyk test --file=package.json

# Test container image
snyk container test <image>

# Test IaC files
snyk iac test
```

### CI/CD Integration

```yaml
