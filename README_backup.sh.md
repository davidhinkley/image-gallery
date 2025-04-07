# Image Gallery Backup System

This document describes the backup system for the Image Gallery project.

## Overview

The `backup.sh` script provides a simple yet powerful way to create, list, and restore backups of your Image Gallery project. It automatically excludes large files and directories that don't need to be backed up (like node_modules, the BACKUP directory itself, and image files in public/images).

## Features

- **Automatic Numbering**: Each backup is automatically numbered (001, 002, etc.)
- **Timestamped Backups**: Includes date and time in the filename (e.g., `001-2025.04.08-15.45.tar.gz`)
- **Efficient Compression**: Uses gzip compression for smaller backup files
- **Smart Exclusions**: Automatically excludes unnecessary files
- **Restore Capability**: Can restore from any backup
- **File Listing**: Can show which files will be included in the next backup
- **Cross-Platform**: Works on any system with bash

## Usage

### Making the Script Executable

Before using the script, make it executable:

```bash
chmod +x backup.sh
```

### Creating a Backup

To create a backup, simply run the script without any arguments:

```bash
./backup.sh
```

This will create a new backup file in the BACKUP directory with an automatically incremented number and the current date and time.

### Listing Files for Backup

To see which files will be included in the next backup:

```bash
./backup.sh -l
```

or

```bash
./backup.sh --list
```

### Listing Available Backups

To see all available backups:

```bash
./backup.sh -b
```

or

```bash
./backup.sh --backups
```

### Restoring from a Backup

To restore from the most recent backup:

```bash
./backup.sh -r
```

or

```bash
./backup.sh --restore
```

To restore from a specific backup (e.g., backup number 001):

```bash
./backup.sh -r 1
```

The script will ask for confirmation before restoring to prevent accidental overwrites.

### Getting Help

For a summary of available commands:

```bash
./backup.sh -h
```

or

```bash
./backup.sh --help
```

## What Gets Backed Up

The backup includes all project files except:

1. Common development files and directories (like node_modules)
2. The `BACKUP` directory and its contents
3. The `backup.sh` script itself
4. The `public/images` directory and its contents

## Backup File Format

Backup files follow this naming convention:

```
NNN-YYYY.MM.DD-HH.MM.tar.gz
```

Where:
- `NNN` is a sequential number (001, 002, etc.)
- `YYYY.MM.DD` is the date (year, month, day)
- `HH.MM` is the time (hour, minute)
- `.tar.gz` indicates a gzipped tar archive

## Technical Details

- Backups are stored as gzipped tar archives (`.tar.gz`)
- The script uses a temporary file during backup creation to avoid "file changed" errors
- Restoration uses `rsync` for efficient and safe file copying
- The script automatically creates the BACKUP directory if it doesn't exist
- All paths are handled using variables to ensure portability across systems

## Troubleshooting

If you encounter any issues:

1. Make sure the script has execute permissions (`chmod +x backup.sh`)
2. Ensure you have sufficient disk space for the backup
3. Check that you have write permissions in the BACKUP directory
4. For restore issues, ensure you have write permissions in the project directory

## Maintenance

It's recommended to periodically clean up old backups to save disk space, especially if you're making frequent backups.