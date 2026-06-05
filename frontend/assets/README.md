# App icon & splash assets

Drop your source images here, then run the generator (one command) to produce
all Android launcher icons, adaptive icons, the Play Store icon, and splash images.

## Files to add

| File | Size | Purpose |
|---|---|---|
| `icon.png` | **1024 × 1024** (square) | App launcher icon (required) |
| `splash.png` | 2732 × 2732 (square) | Splash screen (optional) |
| `splash-dark.png` | 2732 × 2732 (square) | Dark-mode splash (optional) |

> The logo photo is portrait (~940×1024). Crop/pad it to a **square 1024×1024**
> before saving as `icon.png`, otherwise it gets distorted or awkwardly cropped.
> Keep the calculator centered so the circular/squircle crop on Android looks good.

## Generate (after adding icon.png)

```bash
cd frontend
npx capacitor-assets generate --android
npx cap sync android
```

This writes the icons into `android/app/src/main/res/mipmap-*` and the splash
into `drawable-*`, replacing the default Capacitor icons.
