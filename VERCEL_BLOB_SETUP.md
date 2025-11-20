# Vercel Blob Upload Guide

## Setup Instructions

### 1. Get Your Vercel Blob Token
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Storage → Blob
3. Create a new Blob store (if you haven't already)
4. Get your `BLOB_READ_WRITE_TOKEN`

### 2. Upload Resources
Run the upload script with your token:

```bash
# Windows (PowerShell)
$env:BLOB_READ_WRITE_TOKEN="your-token-here"; node upload-to-vercel-blob.js

# Windows (CMD)
set BLOB_READ_WRITE_TOKEN=your-token-here && node upload-to-vercel-blob.js

# Linux/Mac
BLOB_READ_WRITE_TOKEN=your-token-here node upload-to-vercel-blob.js
```

### 3. Update sources.js
After upload completes, the script will create `uploaded-urls.json`. Use these URLs to update `src/Experience/sources.js`.

### 4. (Optional) Add resources to .gitignore
Since the resources are now hosted on Vercel Blob, you can add them to `.gitignore`:

```
# Resources (hosted on Vercel Blob)
/resources/
```

## What Gets Uploaded
- `aerial_grass_rock.webp` (~0.59 MB)
- `aster_red.glb` (~3.74 MB)
- `bush.glb` (~3.53 MB)
- `cherry_blossom_trees.glb` (~18.10 MB)
- `citrus_orchard_road_puresky_2k.exr` (~18.77 MB)
- `flower.glb` (~2.92 MB)
- `free_pack_-_rocks_stylized.glb` (~1.07 MB)
- `mossy_cobblestone.webp` (~0.67 MB)
- `white_flower.glb` (~8.71 MB)

**Total:** ~58 MB

## Benefits
- ✓ Smaller Git repository
- ✓ Faster clones
- ✓ CDN-backed asset delivery
- ✓ Better performance for users worldwide
