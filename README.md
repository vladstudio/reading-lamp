# 🔦 Reading Lamp

A command-line utility to convert text to speech using OpenAI's Text-to-Speech API.

## Installation

```bash
npm install
```

## Usage

### Basic Usage

```bash
node reading-lamp
```

This will start the interactive mode where you'll be prompted for all required parameters.

### Command Line Arguments

```bash
node reading-lamp --api-key "your-openai-key" --text "Hello world" --voice alloy --audio-format mp3 --output hello
```

### Available Options

- `-k, --api-key <key>` - OpenAI API key
- `-t, --text <text>` - Text to convert to speech
- `-f, --file <path>` - Path to text file
- `-v, --voice <voice>` - Voice to use (alloy, echo, fable, onyx, nova, shimmer)
- `-a, --audio-format <format>` - Audio format (mp3, opus, aac, flac, wav, pcm)
- `-o, --output <filename>` - Output filename without extension (default: output)

### Environment Variables

You can also set these environment variables:

- `OPENAI_API_KEY` or `READING_LAMP_API_KEY` - OpenAI API key
- `READING_LAMP_VOICE` - Default voice
- `READING_LAMP_AUDIO_FORMAT` - Default audio format
- `READING_LAMP_OUTPUT` - Default output filename

### Examples

#### Convert text directly:
```bash
node reading-lamp --text "Welcome to Reading Lamp!" --voice nova --audio-format mp3
```

#### Convert from file:
```bash
node reading-lamp --file story.txt --voice fable --audio-format wav --output story
```

#### Using environment variables:
```bash
export OPENAI_API_KEY="your-api-key"
export READING_LAMP_VOICE="alloy"
node reading-lamp --text "Hello world"
```

## Supported File Formats

- `.txt` - Plain text
- `.md` - Markdown
- `.json` - JSON
- `.js` - JavaScript
- `.ts` - TypeScript
- `.html` - HTML
- `.css` - CSS
- `.xml` - XML
- `.csv` - CSV

## Voices

- `alloy` - Neutral, balanced voice
- `echo` - Clear, authoritative voice
- `fable` - Warm, storytelling voice
- `onyx` - Deep, resonant voice
- `nova` - Bright, energetic voice
- `shimmer` - Soft, whispery voice

## Audio Formats

- `mp3` - Most compatible
- `opus` - High quality, small size
- `aac` - Good compression
- `flac` - Lossless compression
- `wav` - Uncompressed
- `pcm` - Raw audio

## Error Handling

The utility provides clear error messages for common issues:

- Invalid API key format
- File not found
- Empty files
- API quota exceeded
- Rate limit exceeded
- Network errors

## Requirements

- Node.js 16+
- OpenAI API key with TTS access
- FFmpeg (required for processing long texts that need chunking)

## Long Text Handling

For texts longer than 4,096 characters, the tool automatically:
- Splits text into chunks at sentence boundaries
- Processes each chunk separately
- Merges the resulting audio files using FFmpeg
- Provides progress updates during processing

Install FFmpeg:
- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt update && sudo apt install ffmpeg`
- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
