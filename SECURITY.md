# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of QuickReply AI seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report a Security Vulnerability?

Please do **NOT** report security vulnerabilities through public GitHub issues.

Instead, please report them via email to [security@yourdomain.com] (replace with your actual security email).

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- A confirmation of your report within 48 hours
- A determination of the severity and priority of the vulnerability
- An estimated timeline for a fix
- A notification when the vulnerability has been fixed

## Security Measures

QuickReply AI implements several security measures:

1. **Authentication**
   - JWT token validation
   - Secure session management
   - Rate limiting on authentication endpoints

2. **Data Protection**
   - All sensitive data is encrypted at rest
   - HTTPS-only communication
   - API keys are stored securely
   - Regular security audits

3. **Code Security**
   - Automated security scanning with CodeQL
   - Dependency vulnerability checking with Dependabot
   - Regular penetration testing
   - Code review requirements

4. **Infrastructure**
   - Regular security updates
   - Secure cloud infrastructure configuration
   - Monitoring and alerting for suspicious activities

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported versions
4. Release new security fix versions

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a pull request. 