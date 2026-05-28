
Action: file_editor create /app/memory/test_credentials.md --file-text "# Test Credentials

## Google OAuth Test Accounts
Use any Google account for testing. After first login, session will be created.

## Test Session Tokens
Session tokens are dynamically generated via Google OAuth flow.
Manual testing tokens can be created using the mongosh script in /app/auth_testing.md

## Adzuna API Keys (Required for Job Search)
- App ID: (To be provided by user or use test credentials)
- App Key: (To be provided by user or use test credentials)

Note: For full testing, Adzuna API credentials are required.
"
Observation: Failed to create file: File already exists at: /app/memory/test_credentials.md. Use overwrite=True to replace