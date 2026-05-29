# AI Music Bot - Issue Tracker

This document tracks verified issues and bugs found in the AI Music Bot codebase.

## 🔴 Critical Issues (Will Cause Failures)

### 1. Duplicate titleGenerator Files
- **Status**: Fixed
- **Description**: Two different implementations of `titleGenerator.js` exist:
  - `services/titleGenerator.js`: Exports a simple word list generator.
  - `generators/titleGenerator.js`: Exports a genre-aware generator.
- **Problem**: Different function signatures and behaviors lead to unpredictable results depending on which file is imported.
- **Impact**: Inconsistent title generation across the app.

### 2. Memory Check vs Database Mismatch
- **Status**: Fixed
- **Description**: 
  - `brain/memory.js` (isDuplicateTitle) reads from `songs/database.json`.
  - `services/saveToDatabase.js` writes to `database/music.db` (SQLite).
- **Problem**: New songs are saved to SQLite, but the duplicate check looks at an old/unused JSON file.
- `Impact`: Duplicate titles are never detected.

### 3. Missing Directory Creation in saveOutput()
- **Status**: Fixed
- **Description**: `services/saveOutput.js` attempts to write to `outputs/json/` without ensuring the directory exists.
- **Problem**: `fs.writeFileSync` fails with `ENOENT` if the directory is missing.
- **Impact**: Generation crashes at the saving step.

### 4. No Error Handling in saveToDatabase()
- **Status**: Fixed
- **Description**: `services/saveToDatabase.js` uses a console log for errors but does not notify the caller or handle failures gracefully.
- **Impact**: Silent failures or lack of reliability in data persistence.

## 🟡 Medium Issues (Cause Unexpected Behavior)

### 5. Audio Generation is a Stub
- **Status**: Open
- **Description**: `services/audioGenerator.js` creates an empty file (`Buffer.alloc(0)`) instead of generating real audio.
- **Impact**: All generated songs have 0-byte audio files.

### 6. No Input Validation in /batch Command
- **Status**: Open
- **Description**: In `index.js`, the `/batch` command parses the `total` number of songs without validation.
- **Problem**: Users could request thousands of songs, potentially crashing the system or exhausting API limits.
- **Impact**: System vulnerability to excessive resource usage.

### 7. Queue System Not Used
- **Status**: Open
- **Description**: `addToQueue()` is called in `index.js`, but `generateBatch()` is executed immediately after, bypassing any actual queue management.
- **Impact**: Queue is currently cosmetic only.

## 🔵 Minor Issues (Code Quality)

### 8. Unused Imports
- **Status**: Open
- **Description**:
  - `services/openai.js`: Initialized with OpenRouter but never imported/used in the codebase.
  - `config.js` contains constants like `SONGS_PER_BATCH` that aren't used in the logic.

### 9. No Retry Logic
- **Status**: Open
- **Description**: API calls to Groq, Pollinations, or FFmpeg do not have retry mechanisms. If one call fails, the entire generation for that song fails.

### 10. Hardcoded sleep(3000)
- **Status**: Fixed
- **Description**: `services/batchGenerator.js` has a hardcoded 3-second delay between songs, which is not configurable.
