# ZPM backup and restore

**Before big changes** (migrations, bulk edits, or before trying something risky): create a backup so you can restore if needed.

## How to back up

1. Open **ZProjectManager** → **Settings**.
2. In **Auto Backup**, click **Backup Now**.
3. Backups are saved to the app’s backup folder (path shown under “Backup folder”). The last 10 backups are kept.

## How to restore

1. **Settings** → **Auto Backup** → under **Existing Backups**, pick a backup from the list.
2. Click **Restore** for that backup.
3. **Restart the app** so it reloads the restored database.

## Auto backup

You can set an interval (e.g. 6 hours) so ZPM backs up automatically. Same backups are used for manual restore.
