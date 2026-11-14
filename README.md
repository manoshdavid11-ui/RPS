# IGL Spirits: concept homepage

A one-page website for IGL Spirits Limited. It's plain HTML, CSS and JavaScript, with no build step and nothing to install.

## Preview it on your computer

Double-click `index.html` to open it in Chrome, Edge, Safari or Firefox.

For the background video and the 3D graphics to behave exactly as they will online, run a small local server from this folder instead:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Put it online

Any static host works. Upload the whole folder, not just `index.html`.

- **Netlify:** drag the folder onto https://app.netlify.com/drop.
- **Vercel:** run `vercel` in this folder, or import it from GitHub.
- **GitHub Pages:** push the folder to a repository, then turn on Pages in Settings.
- **Your own server:** copy everything into the web root.

## Folder layout

```
index.html               the page
assets/css/style.css     all styling
assets/js/main.js        all motion, 3D, charts and menus
assets/video/            your video clips go here
assets/images/brands/    your bottle photos go here
assets/images/favicon.svg
```

## The background video

The full-screen "From the field, for real" section plays a YouTube video behind the text. It plays muted and on a loop, with an amber-and-blue tint, and visitors get "Pause video" and "Turn sound on" buttons.

To change it, open `assets/js/main.js`, search for `SHOWREEL`, and edit:

```js
const SHOWREEL = { youtube: 'plR2EIlaCZo', vertical: true, file: 'assets/video/showreel.mp4' };
```

- **A different YouTube video:** replace the ID. It's the part after `/shorts/` or `watch?v=`. Set `vertical: false` for a normal widescreen video.
- **Your own file instead of YouTube:** set `youtube: ''` and save the clip as `assets/video/showreel.mp4`.

Only use videos the company owns or has permission to use. YouTube also lets uploaders block embedding, in which case the section shows the video's thumbnail.

## Real footage for the five "From field to fuel" scenes

Each scene is a live animation until you add a matching clip. Save MP4 files with exactly these names:

| File | Scene |
|---|---|
| `assets/video/01-farm.mp4` | Crops in the field |
| `assets/video/02-distillery.mp4` | Stills or the distillation plant |
| `assets/video/03-storage.mp4` | Storage tanks, pipes |
| `assets/video/04-bottling.mp4` | The bottling line |
| `assets/video/05-fuel-tanker.mp4` | A fuel tanker on the road |

For best results, use MP4 (H.264), 1920×1080, 8 to 15 seconds, made to loop, with no sound needed, and under 10 MB each. The page loads each clip only as you scroll near it.

## Real bottle photos

Each brand on the shelf shows a drawn bottle until you add a photo. Save PNG files with transparent backgrounds, about 1200 px tall, named after the brand in lower case with dashes:

```
assets/images/brands/maqintosh.png
assets/images/brands/amazing-craft-whisky.png
assets/images/brands/soulmate.png
assets/images/brands/single-reserve.png
assets/images/brands/amrut.png
assets/images/brands/zumba.png
assets/images/brands/bunty-rum.png
assets/images/brands/beach-house.png
assets/images/brands/amrut-old-port.png
assets/images/brands/amazing-vodka.png
assets/images/brands/v2o.png
assets/images/brands/bunty-vodka.png
assets/images/brands/bunty-babli.png
assets/images/brands/dabang-gold.png
assets/images/brands/red-apple.png
assets/images/brands/baaz-tejas.png
```

Amrut images need Amrut Distilleries' approval, because the brand is licensed rather than owned.

## Before it goes live

- Replace the three investor links (search for `nseindia.com` in `index.html`) with the direct links to the listing press release, the investor presentation and the disclosures page.
- Check the "Before" gross margin label in the FY26 section against the investor deck.
- Alcohol advertising rules in India: no footage or photos of people drinking, and no aspirational drinking claims. The age gate (25+) is already built in.
- Bacardi is deliberately not named. It needs written approval before use.

## Accessibility and comfort

- Normal browser scrolling. Nothing changes slides or tabs on its own.
- Everyone gets pause and sound controls on the background video.
- If a visitor's device asks for reduced motion, animations are calmed and the video doesn't autoplay.
- If a browser can't run 3D (WebGL), the hero switches to the animated field instead.
