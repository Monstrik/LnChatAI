# Extension Icons

Place the following PNG files in this directory. Filenames and sizes must match exactly:

Required for manifest/action
- icon-16.png — 16×16 px (toolbar small)
- icon-32.png — 32×32 px (toolbar retina)
- icon-48.png — 48×48 px (extensions page)
- icon-128.png — 128×128 px (extensions page / store preview)

Optional (for Chrome Web Store listing assets)
- 256×256 px
- 512×512 px

Design tips
- Keep it simple at small sizes: 16/32 px should remain recognizable.
- Use high-contrast colors and avoid thin strokes.
- Export as true PNG (no alpha fringing on dark toolbar backgrounds).

Quick ways to generate PNGs from a single source image

A) macOS built-in (sips)
1. Put your base square image as `source.png` (preferably 512×512 or larger).
2. Run in Terminal from this folder:
```
sips -Z 16  source.png --out icon-16.png
sips -Z 32  source.png --out icon-32.png
sips -Z 48  source.png --out icon-48.png
sips -Z 128 source.png --out icon-128.png
```

B) ImageMagick (cross‑platform)
1. Install ImageMagick (https://imagemagick.org)
2. Run in Terminal from this folder:
```
magick convert source.png -resize 16x16   icon-16.png
magick convert source.png -resize 32x32   icon-32.png
magick convert source.png -resize 48x48   icon-48.png
magick convert source.png -resize 128x128 icon-128.png
```

After adding icons
1. Open Chrome → chrome://extensions → Enable Developer mode.
2. Click “Reload” on your extension.
3. Verify:
   - The toolbar shows your 16/32 px icon.
   - The chrome://extensions card shows the 48/128 px icon.
   - No manifest errors about missing icons.

Notes
- Filenames and paths are already referenced in `manifest.json` under `icons` and `action.default_icon`.
- If you change names or sizes, update `manifest.json` accordingly.
- For best results, design at 512×512 and export down to the target sizes rather than scaling up a small image.
