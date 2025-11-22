# Background Music Setup Instructions

I've set up the code to play the YouTube audio as background music at 10% volume alongside the ambience. Here's how to add the audio file:

## Steps to Add the Music:

### 1. Download the Audio from YouTube
Since I can't directly download YouTube content, you'll need to:

**Option A - Use a YouTube Downloader:**
- Visit: https://ytmp3.nu/ or https://y2mate.com/
- Paste the YouTube URL: https://youtu.be/9KVattKxSKg
- Download as MP3

**Option B - Use yt-dlp (if you have it installed):**
```bash
yt-dlp -x --audio-format mp3 https://youtu.be/9KVattKxSKg -o "background-music.mp3"
```

### 2. Add the File to Your Project
1. Create an `audio` folder in your `public` directory:
   ```
   zen-garden/public/audio/
   ```

2. Place the downloaded MP3 file there and rename it to:
   ```
   background-music.mp3
   ```

   Final path should be:
   ```
   zen-garden/public/audio/background-music.mp3
   ```

### 3. Test the Implementation
Once you've added the file:
1. Reload the page
2. You should hear:
   - Ambience sound at 150% volume (as before)
   - Background music at 10% volume (new!)

## What I've Already Done:

✅ Added background music audio loader in `Environment.js`
✅ Set volume to 10% (0.1)
✅ Configured it to loop continuously
✅ Set it to play alongside the existing ambience
✅ Added audio source configuration in `sources.js`

## Troubleshooting:

If the music doesn't play:
1. Check browser console for errors
2. Make sure the file path is exactly: `/audio/background-music.mp3`
3. Try clicking on the page (browsers require user interaction for audio)
4. Check if the file format is MP3 (Three.js AudioLoader works best with MP3)

## To Adjust Volume Later:

Edit `Environment.js` line ~144:
```javascript
this.bgMusic.setVolume(0.1) // Change 0.1 to desired volume (0.0 - 1.0)
```
