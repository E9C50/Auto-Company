---
name: deep-analysis
description: Analytical thinking patterns for comprehensive evaluation, code audits, security analysis, and performance reviews. Provides structured templates for thorough investigation with extended thinking support.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
  - WebFetch
  - WebSearch
dependencies:
  - extended-thinking
  - complex-reasoning
triggers:
  - analyze
  - audit
  - review
  - assess
  - evaluate
  - investigate
  - deep dive
  - comprehensive review
  - security analysis
  - performance analysis
  - code audit
---

# Deep Analysis Skill

Comprehensive analytical templates for thorough investigation, audits, and evaluations leveraging extended thinking capabilities.

## When to Use

- **Code audits** requiring systematic review
- **Security assessments** and threat modeling
- **Performance analysis** and optimization planning
- **Architecture reviews** and technical debt assessment
- **Incident post-mortems** and root cause analysis
- **Compliance audits** and risk assessments

## Analysis Templates

### Code Audit Template

```markdown
## Code Audit Report

**Repository**: [repo-name]
**Scope**: [files/modules audited]
**Date**: [YYYY-MM-DD]
**Auditor**: Claude + [Human reviewer]

### Executive Summary
[2-3 sentence overview of findings]

### Audit Criteria
- [ ] Code quality and maintainability
- [ ] Security vulnerabilities
- [ ] Performance concerns
- [ ] Test coverage
- [ ] Documentation completeness
- [ ] Dependency health

### Critical Findings
| ID | Severity | Location | Issue | Recommendation |
|----|----------|----------|-------|----------------|
| C1 | Critical | file:line | [Issue] | [Fix] |
| C2 | Critical | file:line | [Issue] | [Fix] |

### High Priority Findings
| ID | Severity | Location | Issue | Recommendation |
|----|----------|----------|-------|----------------|
| H1 | High | file:line | [Issue] | [Fix] |

### Medium Priority Findings
[...]

### Low Priority / Suggestions
[...]

### Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Test Coverage | 75% | 80% | ⚠️ |
| Cyclomatic Complexity | 12 | <10 | ⚠️ |
| Technical Debt | 4.2d | <3d | ❌ |
| Security Score | 8/10 | 9/10 | ⚠️ |

### Recommendations
1. **Immediate**: [Critical fixes]
2. **Short-term**: [Within sprint]
3. **Long-term**: [Tech debt reduction]

### Sign-off
- [ ] All critical issues addressed
- [ ] High priority issues have timeline
- [ ] Audit findings documented in backlog
```

### Security Threat Model Template

```markdown
## Threat Model: [System/Component Name]

**Version**: [1.0]
**Last Updated**: [YYYY-MM-DD]
**Classification**: [Internal/Confidential]

### System Overview
[Brief description of the system being modeled]

### Assets
| Asset | Description | Sensitivity | Owner |
|-------|-------------|-------------|-------|
| User Data | PII, credentials | Critical | Auth Team |
| API Keys | Service credentials | High | DevOps |
| Business Data | Transactions | High | Product |

### Trust Boundaries
```
┌─────────────────────────────────────────┐
│           External (Untrusted)          │
│  [Internet Users] [Third-party APIs]    │
└──────────────────┬──────────────────────┘
                   │ WAF/Load Balancer
┌──────────────────┴──────────────────────┐
│              DMZ (Semi-trusted)         │
│  [API Gateway] [CDN] [Public Services]  │
└──────────────────┬──────────────────────┘
