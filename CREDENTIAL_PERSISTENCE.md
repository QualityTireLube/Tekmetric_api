# Credential Persistence Feature

## Overview

API credentials are now automatically saved to a file, allowing them to persist across server restarts. Previously, credentials were only stored in memory and would be lost when the server was restarted.

## How It Works

### File Storage

- **Location**: `server/data/credentials.json`
- **Format**: JSON file containing all saved credential sets
- **Security**: Automatically excluded from git via `.gitignore`

### Automatic Persistence

Credentials are automatically saved to the file when you:

1. **Add a new credential set** - Via the Settings page "Save Credentials" button
2. **Switch between credential sets** - When you select a different credential set
3. **Delete a credential set** - When you remove a saved credential

### File Structure

```json
{
  "credentials": [
    {
      "id": "1738761234567",
      "name": "Sandbox Environment",
      "clientId": "your-client-id",
      "clientSecret": "your-client-secret",
      "environment": "sandbox.tekmetric.com",
      "createdAt": "2026-02-05T10:30:00.000Z",
      "updatedAt": "2026-02-05T10:30:00.000Z"
    },
    {
      "id": "1738761234568",
      "name": "Production Environment",
      "clientId": "your-prod-client-id",
      "clientSecret": "your-prod-client-secret",
      "environment": "api.tekmetric.com",
      "createdAt": "2026-02-05T11:00:00.000Z",
      "updatedAt": "2026-02-05T11:00:00.000Z"
    }
  ],
  "currentCredentialId": "1738761234567",
  "lastUpdated": "2026-02-05T11:00:00.000Z"
}
```

## Implementation Details

### Service Layer Changes

The `TekmetricService` class now includes:

1. **`loadCredentialsFromFile()`** - Automatically called on server startup
   - Creates the data directory if it doesn't exist
   - Loads saved credentials from the JSON file
   - Restores the active credential set

2. **`saveCredentialsToFile()`** - Called after any credential operation
   - Saves all credentials to the JSON file
   - Includes the currently active credential ID
   - Adds a timestamp for the last update

### Modified Methods

The following methods now automatically save to file:

- `saveCredentialSet()` - Saves after adding/updating a credential
- `switchToCredentialSet()` - Saves after switching active credential
- `deleteCredentialSet()` - Saves after deleting a credential

### Security

1. **Git Exclusion**: The `credentials.json` file is excluded from version control
2. **File Permissions**: The file is only accessible to the server process
3. **Masked Display**: Credentials are masked when displayed in the UI

## Benefits

1. **Persistence**: Credentials survive server restarts
2. **Convenience**: No need to re-enter credentials after restarting
3. **Multiple Environments**: Easily switch between sandbox and production
4. **Backup**: Credentials are backed up in a file
5. **Migration**: Easy to move credentials between servers

## Usage

No changes needed to your workflow! The feature works automatically:

1. Go to Settings page
2. Enter your API credentials
3. Click "Save Credentials"
4. Your credentials are now saved to file
5. Restart the server - credentials are automatically loaded

## File Location

The credentials file is stored at:
```
server/data/credentials.json
```

This directory structure is maintained in the repository with a `.gitkeep` file, but the actual credentials file is excluded via `.gitignore`.

## Troubleshooting

### Credentials Not Loading

If credentials aren't loading after restart:

1. Check that `server/data/credentials.json` exists
2. Verify the JSON format is valid
3. Check server logs for error messages
4. Ensure the server has read/write permissions to the data directory

### Resetting Credentials

To reset all saved credentials:

1. Stop the server
2. Delete `server/data/credentials.json`
3. Restart the server
4. Re-enter your credentials in the Settings page

## Technical Notes

- The file is created automatically on first save
- The data directory is created if it doesn't exist
- File operations use synchronous I/O for reliability
- Errors are logged but don't crash the server
- The file is formatted with 2-space indentation for readability
