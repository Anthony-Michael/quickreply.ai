#!/bin/bash

# Enable vulnerability alerts and security updates
gh api \
  --method PUT \
  -H "Accept: application/vnd.github.v3+json" \
  /repos/Anthony-Michael/quickreply-ai/vulnerability-alerts

gh api \
  --method PUT \
  -H "Accept: application/vnd.github.v3+json" \
  /repos/Anthony-Michael/quickreply-ai/automated-security-fixes

# Enable Dependabot alerts
gh api \
  --method PUT \
  -H "Accept: application/vnd.github.v3+json" \
  /repos/Anthony-Michael/quickreply-ai/dependabot/alerts

# Enable CodeQL
gh api \
  --method PUT \
  -H "Accept: application/vnd.github.v3+json" \
  /repos/Anthony-Michael/quickreply-ai/code-scanning/default-setup

# Create branch protection rule for main
gh api \
  --method PUT \
  -H "Accept: application/vnd.github.v3+json" \
  /repos/Anthony-Michael/quickreply-ai/branches/main/protection \
  -f required_status_checks='{"strict":true,"contexts":["test-and-build","security"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"dismissal_restrictions":{},"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":1}' \
  -f restrictions=null 