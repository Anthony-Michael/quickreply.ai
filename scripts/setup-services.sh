#!/bin/bash

# Install Snyk CLI
npm install -g snyk

# Login to Snyk (requires SNYK_TOKEN)
snyk auth

# Initialize Snyk in the project
snyk monitor

# Create Codecov configuration
cat > codecov.yml << EOL
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 2%
    patch:
      default:
        target: 80%
        threshold: 2%

comment:
  layout: "reach, diff, flags, files"
  behavior: default
  require_changes: false
  require_base: no
  require_head: yes
EOL

# Add scripts to package.json
npm pkg set scripts.coverage="npm test -- --coverage --watchAll=false"
npm pkg set scripts.snyk="snyk test"
npm pkg set scripts.monitor="snyk monitor" 