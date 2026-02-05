# Credentials Storage

This directory stores saved API credentials for the Tekmetric API integration.

## Files

- `credentials.json` - Contains saved credential sets (excluded from git)
- `.gitkeep` - Ensures this directory exists in the repository

## Security

The `credentials.json` file is automatically excluded from version control via `.gitignore` to protect sensitive API credentials.

## Structure

The `credentials.json` file has the following structure:

```json
{
  "credentials": [
    {
      "id": "unique-id",
      "name": "Credential Set Name",
      "clientId": "your-client-id",
      "clientSecret": "your-client-secret",
      "environment": "sandbox.tekmetric.com",
      "createdAt": "2026-02-05T...",
      "updatedAt": "2026-02-05T..."
    }
  ],
  "currentCredentialId": "unique-id",
  "lastUpdated": "2026-02-05T..."
}
```

## Usage

Credentials are automatically saved to this file when you:
- Add a new credential set via the Settings page
- Switch between credential sets
- Delete a credential set

The file is automatically created when the first credential is saved.
