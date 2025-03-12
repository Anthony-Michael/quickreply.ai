# PowerShell script to configure GitHub repository settings

# Repository settings
$repo = "Anthony-Michael/ReplyRocket.io"

# Enable vulnerability alerts
gh api `
  --method PUT `
  -H "Accept: application/vnd.github.v3+json" `
  /repos/$repo/vulnerability-alerts

# Enable automated security fixes
gh api `
  --method PUT `
  -H "Accept: application/vnd.github.v3+json" `
  /repos/$repo/automated-security-fixes

# Enable Dependabot alerts
gh api `
  --method PUT `
  -H "Accept: application/vnd.github.v3+json" `
  /repos/$repo/dependabot/alerts

# Enable CodeQL
gh api `
  --method PUT `
  -H "Accept: application/vnd.github.v3+json" `
  /repos/$repo/code-scanning/default-setup

# Create branch protection rule for main
gh api `
  --method PUT `
  -H "Accept: application/vnd.github.v3+json" `
  /repos/$repo/branches/main/protection `
  -f required_status_checks='{"strict":true,"contexts":["test-and-build","security"]}' `
  -f enforce_admins=true `
  -f required_pull_request_reviews='{"dismissal_restrictions":{},"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":1}' `
  -f restrictions=null

# Enable auto-merge
gh api `
  --method PATCH `
  -H "Accept: application/vnd.github.v3+json" `
  /repos/$repo `
  -f allow_merge_commit=false `
  -f allow_squash_merge=true `
  -f allow_rebase_merge=false `
  -f delete_branch_on_merge=true `
  -f allow_auto_merge=true

Write-Host "Repository settings configured successfully!" 