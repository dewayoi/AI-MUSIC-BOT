# AI Music Bot - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Telegram Bot Endpoints](#telegram-bot-endpoints)
4. [Generation Flow](#generation-flow)
5. [Batch Processing Flow](#batch-processing-flow)
6. [Function Dependency Map](#function-dependency-map)
7. [Function Signatures Reference](#function-signatures-reference)
8. [Issues Found](#issues-found)
9. [Data Flow & Structure](#data-flow--structure)

---

## Overview

The **AI Music Bot** is a Node.js application that generates AI music through a Telegram bot interface. It uses multiple AI services (Groq, Google Generative AI, Pollinations AI) to create complete songs with lyrics, metadata, images, and videos.

### Tech Stack
- **Bot Framework**: node-telegram-bot-api
- **LLM APIs**: Groq (llama-3.3-70b-versatile)
- **Image Generation**: Pollinations AI (free, no auth)
- **Video Processing**: FFmpeg
- **Database**: SQLite3
- **Audio Generation**: Dummy provider (not implemented)

### File Structure
```
├── index.js                          # Main bot entry point
├── config.js                         # Configuration constants
├── package.json
├── database/
│   └── db.js                        # SQLite setup & schema
├── services/
│   ├── audioGenerator.js            # Audio generation stub
│   ├── batchGenerator.js            # Batch song generation (loops)
│   ├── generateSong.js              # Single song generation (incomplete)
│   ├── groq.js                      # Groq API client
│   ├── imageGenerator.js            # Image generation via Pollinations
│   ├── lyricsGenerator.js           # Lyrics via Groq
│   ├── metadataGenerator.js         # Metadata (tags, description) via Groq
│   ├── openai.js                    # OpenRouter API (unused)
│   ├── promptLoader.js              # Load genre prompts from files
│   ├── queue.js                     # Simple job queue
│   ├── saveOutput.js                # Save to outputs/json/
│   ├── saveToDatabase.js            # Save to SQLite
│   ├── titleGenerator.js            # Generate song titles
│   ├── videoGenerator.js            # Video generation via FFmpeg
│   └── visualPromptGenerator.js     # Visual prompt generation via Groq
├── brain/
│   ├── contentBrain.js              # Content planning strategy
│   ├── history.js                   # (empty)
│   ├── memory.js                    # Check for duplicates, get history
│   ├── strategies.js                # Predefined strategies (youtube_lofi, tiktok_phonk)
│   └── trends.js                    # (empty)
├── providers/
│   ├── audio/
│   │   ├── dummyProvider.js         # Dummy audio generation
│   │   └── index.js                 # Audio provider selector
│   ├── image/
│   │   ├── dummyImageProvider.js    # Dummy image provider
│   │   └── index.js                 # Image provider selector
│   └── video/
│       └── ffmpegProvider.js        # (empty)
├── prompts/
│   ├── audiences.js                 # Audience tone prompts
│   ├── buildPrompt.js               # Combine all prompts
│   ├── genres.js                    # Genre descriptions
│   ├── hiphop.txt                   # Hip-hop style prompt
│   ├── hooks.js                     # Hook strategies
│   ├── lofi.txt                     # LoFi style prompt
│   ├── metal.txt                    # Metal style prompt
│   ├── moods.js                     # Mood descriptions
│   ├── platforms.js                 # Platform optimization
│   ├── reggae.txt                   # Reggae style prompt
│   └── structure.js                 # Song structure prompts
├── thumbnail/
│   ├── buildThumbnailPrompt.js      # Create thumbnail art prompt
│   └── thumbnailPrompts.js          # Preset thumbnail styles
├── generators/
│   └── titleGenerator.js            # Genre-aware title generator (DUPLICATE)
├── bot/
│   └── telegram.js                  # Bot initialization helper
└── outputs/
    ├── audio/                       # Generated MP3 files
    ├── images/                      # Generated PNG images
    ├── json/                        # Saved song metadata
    └── videos/                      # Generated MP4 videos
```

---

## Architecture

### System Overview Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Telegram User                           │
│                  /generate or /batch                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │   index.js          │
        │  Bot Event Handler  │
        └─────────┬───────────┘
                  │
      ┌───────────┴───────────┐
      ▼                       ▼
  /generate               /batch
  (single song)          (loop N songs)
      │                       │
      ├─ parseInput           ├─ parseInput
      ├─ generateTitle        ├─ generateContentPlan
      ├─ generateLyrics       ├─ FOR i=0 to total:
      ├─ generateMetadata     │  ├─ generateTitle
      ├─ generateVisuals      │  ├─ generateLyrics
      ├─ loadPrompt           │  ├─ generateMetadata
      ├─ buildPrompt          │  ├─ generateVisuals
      ├─ generateImage        │  ├─ generateImage
      ├─ generateVideo        │  ├─ generateVideo
      ├─ generateAudio        │  └─ generateAudio
      ├─ saveOutput           └─ saveOutput
      ├─ saveToDatabase       └─ saveToDatabase
      └─ sendMessage              └─ sendMessage
      
      ▼
  ┌───────────────────────┐
  │  External APIs        │
  ├───────────────────────┤
  │ Groq API              │ (lyrics, metadata, visuals)
  │ Pollinations AI       │ (image generation)
  │ FFmpeg               │ (video generation)
  │ SQLite               │ (persistence)
  └───────────────────────┘
```

---

## Telegram Bot Endpoints

### Available Commands

| Command | Format | Description |
|---------|--------|-------------|
| `/start` | `/start` | Bot activation, welcome message |
| `/help` | `/help` | List all available commands |
| `/generate` | `/generate [genre] [mood]` | Generate single song |
| `/batch` | `/batch [genre] [mood] [total]` | Generate multiple songs |
| `/queue` | `/queue` | Show pending job count |
| `/library` | `/library` | List 10 most recent songs |
| `/ready` | `/ready` | List songs with "ready" status |
| `/genres` | `/genres` | List available genres |

### Example Usage
```
/generate reggae happy
→ Generates 1 reggae song with happy mood

/batch lofi sad 5
→ Generates 5 lofi songs with sad mood

/queue
→ Shows how many songs are queued

/library
→ Lists last 10 generated songs with titles and genres

/ready
→ Lists completed songs ready for upload
```

### Supported Genres (from config.js)
- Synthwave
- LoFi
- Phonk
- EDM
- Ambient
- reggae
- lofi

### Supported Moods (from config.js)
- Dark
- Sad
- Dreamy
- Energetic
- Emotional

---

## Generation Flow

### Single Song Generation (`/generate reggae happy`)

```
USER INPUT: /generate reggae happy
│
├─ Parse: genre="reggae", mood="happy"
│
├─ STEP 1: Generate Title
│  └─ titleGenerator.js → "Golden Dream" | "Midnight Echo"
│
├─ STEP 2: Generate Lyrics
│  └─ groq.js (Groq API call)
│     └─ lyricsGenerator.js → full song lyrics
│
├─ STEP 3: Generate Metadata
│  └─ groq.js (Groq API call)
│     └─ metadataGenerator.js → YouTube description, tags
│
├─ STEP 4: Load Genre Prompt
│  └─ promptLoader.js → reads prompts/reggae.txt
│
├─ STEP 5: Build Final Prompt
│  └─ buildPrompt.js → combines all prompts
│
├─ STEP 6: Generate Visual Prompt
│  └─ groq.js (Groq API call)
│     └─ visualPromptGenerator.js → art description
│
├─ STEP 7: Generate Image
│  └─ imageGenerator.js
│     └─ Pollinations AI API → outputs/images/{title}.png
│
├─ STEP 8: Generate Video
│  └─ videoGenerator.js
│     └─ FFmpeg command → outputs/videos/{title}.mp4
│
├─ STEP 9: Generate Audio (STUB)
│  └─ audioGenerator.js or dummyProvider.js
│     └─ (Currently dummy, creates empty file)
│
├─ STEP 10: Save Output
│  └─ saveOutput.js → outputs/json/{timestamp}.json
│
├─ STEP 11: Save to Database
│  └─ saveToDatabase.js → INSERT INTO SQLite database
│
└─ STEP 12: Send Response
   └─ bot.sendMessage() → sends title, lyrics, prompt to user

TOTAL TIME: ~30-60 seconds (depending on API response times)
```

---

## Batch Processing Flow

### Batch Song Generation (`/batch lofi sad 5`)

```
USER INPUT: /batch lofi sad 5
│
├─ Parse: genre="lofi", mood="sad", total=5
│
├─ Add to Queue: addToQueue({genre, mood, total})
│
├─ STEP 1: Generate Content Plan
│  └─ generateContentPlan("youtube_lofi")
│     └─ Returns strategy: {genre, mood, structureType, hookType}
│
├─ STEP 2: LOOP FOR i=0 TO 5
│  │
│  ├─ ITERATION 1:
│  │  ├─ generateTitle() → check isDuplicateTitle()
│  │  ├─ generateLyrics(lofi, sad)
│  │  ├─ generateMetadata(title, lofi, sad)
│  │  ├─ generateVisualPrompt(lofi, sad)
│  │  ├─ generateImage(visualPrompt)
│  │  ├─ generateVideo(imagePath)
│  │  ├─ generateAudio(title, lofi, sad, lyrics)
│  │  ├─ saveOutput(songData)
│  │  ├─ saveToDatabase(songData)
│  │  ├─ bot.sendMessage() → "✅ Done: {title}"
│  │  └─ sleep(3000) → rate limiting
│  │
│  ├─ ITERATION 2:
│  │  └─ (repeat same as iteration 1)
│  │
│  └─ ITERATION 3-5:
│     └─ (repeat same as iteration 1)
│
└─ FINAL: bot.sendMessage() → "✅ Batch selesai!"

TOTAL TIME: ~150-300 seconds (30-60s per song + 3s sleep)
DATABASE: 5 new songs inserted into SQLite
OUTPUT: 5 folders in /songs/ with lyrics, metadata, thumbnails
```

### Internal: generateSingleSongInternal() Loop Structure

```javascript
async function generateSingleSongInternal(songIndex, total, genre, mood, contentPlan, onProgress) {
  const title = generateTitle();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const songFolder = path.join(process.cwd(), "songs", slug);
  fs.mkdirSync(songFolder, { recursive: true });

  // 1. DATA GENERATION (parallel capable)
  const lyrics = await generateLyrics(genre, mood);
  const metadata = await generateMetadata(title, genre, mood);
  const visualPrompt = await generateVisualPrompt(genre, mood);
  const finalPrompt = buildPrompt({title, genre, mood, ...contentPlan});
  const thumbnailPrompt = buildThumbnailPrompt({genre, mood, title});

  // 2. ASSET GENERATION (sequential: image → video → audio)
  await generateImage(visualPrompt, title);
  const imagePath = path.join(process.cwd(), "outputs", "images", `${title}.png`);
  
  await generateVideo(imagePath, videoPath);
  
  const audioResult = await audioProvider.generateAudio({
    title, genre, mood, lyrics
  });

  // 3. STORAGE ORGANIZATION
  fs.copyFileSync(videoPath, finalVideoPath);
  fs.copyFileSync(audioResult.audioPath, finalAudioPath);
  fs.writeFileSync(path.join(songFolder, "lyrics.txt"), lyrics);
  fs.writeFileSync(path.join(songFolder, "metadata.json"), JSON.stringify(songData, null, 2));

  // 4. PERSISTENCE
  saveOutput(songData);
  saveToDatabase(songData);

  return songData;
}
```

---

## Function Dependency Map

### Call Hierarchy

```
index.js (/generate)
├─ loadPrompt(genre)
├─ generateTitle()
├─ generateLyrics(genre, mood)
├─ buildPrompt({title, genre, mood, ...})
└─ bot.sendMessage()

index.js (/batch)
├─ addToQueue({genre, mood, total})
└─ generateBatch(genre, mood, total, onProgress)
   ├─ generateContentPlan("youtube_lofi")
   └─ FOR i=0 to total:
      └─ generateSingleSongInternal(i, total, genre, mood, contentPlan, onProgress)
         ├─ generateTitle()
         ├─ generateLyrics(genre, mood)
         ├─ generateMetadata(title, genre, mood)
         ├─ generateVisualPrompt(genre, mood)
         ├─ buildPrompt({title, genre, mood, ...})
         ├─ buildThumbnailPrompt({genre, mood, title})
         ├─ generateImage(visualPrompt, title)
         ├─ generateVideo(imagePath, videoPath)
         ├─ getAudioProvider().generateAudio({title, genre, mood, lyrics})
         ├─ saveOutput(songData)
         └─ saveToDatabase(songData)

External Dependencies:
├─ groq.js
│  ├─ Called by: generateLyrics(), generateMetadata(), generateVisualPrompt()
│  └─ Uses: Groq API (llama-3.3-70b-versatile)
│
├─ imageGenerator.js
│  └─ Uses: Pollinations AI (free image generation)
│
└─ videoGenerator.js
   └─ Uses: FFmpeg command execution
```

---

## Function Signatures Reference

### Generation Functions

#### `generateTitle(genre?)`
- **File**: `services/titleGenerator.js`
- **Input**: `genre` (optional, currently ignored)
- **Output**: `string` - e.g., "Midnight Dream", "Golden Heartbeat"
- **Logic**: Randomly selects from hardcoded word lists
```javascript
const words1 = ["Golden", "Midnight", "Broken", "Silent", "Lonely"];
const words2 = ["Dream", "Smoke", "Echo", "Heartbeat", "Sunset"];
return `${words1[random]} ${words2[random]}`;
```

#### `generateLyrics(genre, mood)`
- **File**: `services/lyricsGenerator.js`
- **Input**: `genre` (string), `mood` (string)
- **Output**: `Promise<string>` - full song lyrics
- **API**: Groq API with llama-3.3-70b-versatile
```javascript
groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [{role: "user", content: "Write song lyrics. Genre: ${genre}, Mood: ${mood}..."}]
})
```

#### `generateMetadata(title, genre, mood)`
- **File**: `services/metadataGenerator.js`
- **Input**: `title` (string), `genre` (string), `mood` (string)
- **Output**: `Promise<string>` - YouTube metadata (description, tags, etc.)
- **API**: Groq API
- **Prompt**: "Create YouTube metadata. Title: ${title}, Genre: ${genre}, Mood: ${mood}"

#### `generateVisualPrompt(genre, mood)`
- **File**: `services/visualPromptGenerator.js`
- **Input**: `genre` (string), `mood` (string)
- **Output**: `Promise<string>` - art prompt for image generation
- **API**: Groq API
- **Prompt**: "Create cinematic artwork prompt. Genre: ${genre}, Mood: ${mood}. Style: YouTube music thumbnail. High quality. Cinematic lighting. No text."

### Asset Generation Functions

#### `generateImage(prompt, filename)`
- **File**: `services/imageGenerator.js`
- **Input**: `prompt` (string), `filename` (string)
- **Output**: `Promise<void>` - writes PNG to `outputs/images/${filename}.png`
- **API**: Pollinations AI (free, no auth)
```javascript
const seed = Math.floor(Math.random() * 1000000);
const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&seed=${seed}`;
// Downloads image via axios
```

#### `generateVideo(imagePath, outputPath)`
- **File**: `services/videoGenerator.js`
- **Input**: `imagePath` (string), `outputPath` (string)
- **Output**: `Promise<outputPath>` - writes MP4 to disk
- **Tool**: FFmpeg
```bash
ffmpeg -y -loop 1 -i "${imagePath}" -c:v libx264 -t 30 -pix_fmt yuv420p "${outputPath}"
```

#### `generateAudio(songData)`
- **File**: `services/audioGenerator.js` or `providers/audio/dummyProvider.js`
- **Input**: `{title, genre, mood, lyrics}`
- **Output**: `Promise<{audioPath, status}>` 
- **Status**: Currently DUMMY - creates empty file, does not actually generate audio
- **TODO**: Implement with actual TTS/audio synthesis

### Batch Processing Functions

#### `generateContentPlan(strategyName)`
- **File**: `brain/contentBrain.js`
- **Input**: `strategyName` (string, e.g., "youtube_lofi")
- **Output**: `{genre, mood, structureType, hookType}`
- **Sources**: `brain/strategies.js`
```javascript
module.exports = {
  youtube_lofi: {
    genres: ["LoFi", "Ambient"],
    moods: ["Dreamy", "Sad"],
    structure: "longForm",
    hook: "atmospheric"
  },
  tiktok_phonk: {
    genres: ["Phonk"],
    moods: ["Dark", "Energetic"],
    structure: "shortForm",
    hook: "viral"
  }
}
```

#### `generateBatch(genre, mood, total, onProgress?)`
- **File**: `services/batchGenerator.js`
- **Input**: 
  - `genre` (string)
  - `mood` (string)
  - `total` (number) - songs to generate
  - `onProgress?` (callback function) - for status updates
- **Output**: `Promise<songData[]>` - array of generated songs
- **Logic**: Loops from i=0 to total, calls `generateSingleSongInternal()` for each
- **Sleep**: 3 second delay between songs to avoid rate limiting

#### `generateSingleSongInternal(songIndex, total, genre, mood, contentPlan, onProgress)`
- **File**: `services/batchGenerator.js`
- **Input**: 
  - `songIndex` (number) - current iteration
  - `total` (number) - total songs to generate
  - `genre` (string)
  - `mood` (string)
  - `contentPlan` (object)
  - `onProgress?` (callback)
- **Output**: `Promise<songData>` - single song object
- **Process**: 
  1. Generate title/lyrics/metadata/visuals (parallel)
  2. Generate image → video → audio (sequential)
  3. Copy files to song folder
  4. Save to JSON and database
  5. Call `onProgress()` for status updates

### Persistence Functions

#### `saveOutput(songData)`
- **File**: `services/saveOutput.js`
- **Input**: `songData` (object with all song information)
- **Output**: Writes file to `outputs/json/${Date.now()}.json`
- **Note**: Creates directory if it doesn't exist

#### `saveToDatabase(songData)`
- **File**: `services/saveToDatabase.js`
- **Input**: `songData` (object)
- **Output**: Inserts record into SQLite table `songs`
- **SQL**:
```sql
INSERT INTO songs (title, genre, mood, lyrics, metadata, prompt, status, created_at)
VALUES (?, ?, ?, ?, ?, ?, "ready", ?)
```
- **Note**: No error handling; silent failures if database insert fails

### Utility Functions

#### `loadPrompt(name)`
- **File**: `services/promptLoader.js`
- **Input**: `name` (string, e.g., "reggae", "lofi")
- **Output**: `string | null` - contents of `prompts/${name}.txt`
- **Returns null if file not found**

#### `isDuplicateTitle(title)`
- **File**: `brain/memory.js`
- **Input**: `title` (string)
- **Output**: `boolean` - true if title already exists
- **Source**: Reads from `songs/database.json` (NOT SQLite!)
- **⚠️ BUG**: Checks JSON file, but new songs saved to SQLite only

#### `getHistory()`
- **File**: `brain/memory.js`
- **Input**: none
- **Output**: `array<songObject>` - all songs from `songs/database.json`

#### `buildPrompt({title, genre, mood, hookType, structureType, audience, platform})`
- **File**: `prompts/buildPrompt.js`
- **Input**: Object with song parameters
- **Output**: `string` - final music generation prompt
- **Sources**: 
  - `prompts/genres.js` - genre style
  - `prompts/moods.js` - mood description
  - `prompts/hooks.js` - hook strategy
  - `prompts/structure.js` - song structure
  - `prompts/audiences.js` - target audience tone
  - `prompts/platforms.js` - platform optimization

#### `buildThumbnailPrompt({genre, mood, title})`
- **File**: `thumbnail/buildThumbnailPrompt.js`
- **Input**: Object with genre, mood, title
- **Output**: `string` - art prompt for thumbnail
- **Sources**: `thumbnail/thumbnailPrompts.js`

---

## Issues Found

Verified issues have been moved to the [Issue Tracker](../ISSUES.md) for better tracking and management.

---

## Data Flow & Structure

### Song Data Object (songData)

This is the central data structure passed through the pipeline:

```javascript
const songData = {
  id: Date.now(),                          // Unique identifier
  title: "Midnight Dream",                 // Song title
  genre: "lofi",                           // Genre
  mood: "sad",                             // Mood
  lyrics: "Verse 1:\n...",                 // Full lyrics
  metadata: "YouTube description:\n...",   // SEO metadata
  visualPrompt: "cinematic dark...",       // Image art prompt
  prompt: "Song Title: Midnight Dream\n..." // Final music generation prompt
  audioPath: "/path/to/audio.mp3",         // Local audio file
  audioStatus: "generated" | "dummy_asset" | "failed",
  videoPath: "/path/to/video.mp4",         // Local video file
  thumbnailPath: "/path/to/thumbnail.png", // Thumbnail image
  thumbnailPrompt: "cozy anime aesthetic...", // Thumbnail art prompt
  status: "completed" | "failed" | "ready", // Overall status
  created_at: new Date(),                   // Timestamp
};
```

### File Organization After Generation

```
songs/
├── midnight-dream/                  # slug-based folder
│   ├── audio.mp3                   # From generateAudio()
│   ├── video.mp4                   # From generateVideo()
│   ├── thumbnail.png               # From thumbnail generation
│   ├── lyrics.txt                  # Raw lyrics text
│   └── metadata.json               # Full songData as JSON
│
└── golden-heartbeat/
    └── (same structure)

outputs/
├── json/
│   ├── 1234567890.json            # songData saved as JSON
│   └── 1234567891.json
│
├── images/
│   ├── Midnight Dream.png          # Generated image
│   └── Golden Heartbeat.png
│
├── videos/
│   ├── Midnight Dream.mp4          # Generated video
│   └── Golden Heartbeat.mp4
│
└── audio/
    ├── Midnight Dream.mp3          # Generated audio
    └── Golden Heartbeat.mp3

database/
└── music.db                        # SQLite database
    └── songs table
        ├── id (INTEGER PRIMARY KEY)
        ├── title (TEXT)
        ├── genre (TEXT)
        ├── mood (TEXT)
        ├── lyrics (TEXT)
        ├── metadata (TEXT)
        ├── prompt (TEXT)
        ├── status (TEXT)
        └── created_at (TEXT)
```

### API Call Sequence

#### Single Song Generation Timeline

```
t=0:    User types: /generate reggae happy
t=100ms: Parse input, start title generation
t=150ms: Start generateLyrics (Groq API) → blocking wait
t=2000ms: Groq returns lyrics
t=2050ms: Start generateMetadata (Groq API) → blocking wait
t=4000ms: Groq returns metadata
t=4050ms: Load prompt from prompts/reggae.txt
t=4100ms: buildPrompt() → synchronous, instant
t=4150ms: Start generateVisualPrompt (Groq API)
t=6000ms: Groq returns visual prompt
t=6050ms: Start generateImage (Pollinations AI)
t=15000ms: Pollinations returns image (~10s)
t=15050ms: Start generateVideo (FFmpeg)
t=18000ms: FFmpeg completes video (~3s for 30 sec video)
t=18050ms: generateAudio (dummy) → instant
t=18100ms: saveOutput() → writes to JSON
t=18150ms: saveToDatabase() → writes to SQLite
t=18200ms: sendMessage() → response to user

TOTAL: ~18 seconds
```

#### Batch Song Generation Timeline (5 songs)

```
t=0:      /batch lofi sad 5
t=100ms:  addToQueue
t=150ms:  generateBatch() starts
t=200ms:  generateContentPlan()

t=300ms:  Song 1: generateSingleSongInternal(0, 5, ...)
t=200-5000: Song 1 generation (same as single above)
t=5000ms: ✅ Song 1 complete, sleep(3000)

t=8000ms: Song 2: generateSingleSongInternal(1, 5, ...)
t=8000-13000: Song 2 generation
t=13000ms: ✅ Song 2 complete, sleep(3000)

t=16000ms: Song 3: generateSingleSongInternal(2, 5, ...)
... (repeat)

t=final:  All 5 songs complete (~90 seconds total)
DATABASE: 5 INSERT statements executed
USER: Gets progress updates via bot.sendMessage() every iteration
```

### Config Constants

From `config.js`:

```javascript
module.exports = {
  SONGS_PER_BATCH: 2,                    // Not used
  OUTPUT_DIR: "songs",                   // Not used
  AUDIO_PROVIDER: "dummy",               // Selects dummyProvider
  IMAGE_PROVIDER: "dummy",               // Selects dummyImageProvider (but not used)
  VIDEO_PROVIDER: "ffmpeg",              // Selects FFmpeg
  GENRES: ["Synthwave", "LoFi", "Phonk", "EDM", "Ambient"],
  MOODS: ["Dark", "Sad", "Dreamy", "Energetic", "Emotional"]
};
```

### Strategy Matrix

From `brain/strategies.js`:

```javascript
module.exports = {
  youtube_lofi: {
    genres: ["LoFi", "Ambient"],           // Random selection
    moods: ["Dreamy", "Sad"],              // Random selection
    structure: "longForm",                 // Song structure style
    hook: "atmospheric"                    // Hook strategy
  },
  tiktok_phonk: {
    genres: ["Phonk"],
    moods: ["Dark", "Energetic"],
    structure: "shortForm",
    hook: "viral"
  }
};
```

Used by `generateContentPlan()` to determine song characteristics for batch generation.

---

## Summary

The AI Music Bot is a functional system for generating AI-created songs through a Telegram interface. However, it has several critical issues that should be fixed:

### What Works ✅
- Telegram bot command parsing
- Groq API integration for lyrics/metadata
- Image generation via Pollinations AI
- Video generation via FFmpeg
- SQLite database persistence
- Batch processing loop with rate limiting

### What Doesn't Work ❌
- Audio generation (stub only)
- Duplicate title detection (checks wrong file)
- Input validation for /batch command
- Error handling in database operations
- Import path consistency

### What Needs Fixing 🔧
1. Fix import paths and merge titleGenerator files
2. Implement actual audio generation
3. Sync memory database with SQLite
4. Add error handling and retry logic
5. Validate batch size input
6. Create directories before writing files
7. Remove unused code and configurations

### Recommended Priority
1. **Critical**: Fix import errors (breaks execution)
2. **High**: Implement audio generation (core feature)
3. **High**: Fix database/memory sync (breaks duplicate detection)
4. **Medium**: Add error handling (affects reliability)
5. **Low**: Code cleanup (improves maintainability)

