# Audio Files for AudioRecorder

This directory contains the following audio files for the AudioRecorder component:

- `start.mp3` - Sound played when recording starts ✅
- `stop.mp3` - Sound played when recording stops ✅
- `send.mp3` - Sound played when audio is sent for transcription (uses system beep)

## Current Status

The AudioRecorder component will use the available sound files. If a file is missing or fails to load, it will:
- Log a warning to the console
- Use a system-generated beep sound via Web Audio API (for start/stop sounds only)
- Continue functioning normally

## Fallback Behavior

- **start.mp3 & stop.mp3**: If missing, will use system beep as fallback
- **send.mp3**: Uses system beep (no file needed)
