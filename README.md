# Helia — Lizza Tivadze

Static portfolio website built with HTML, CSS, and JavaScript. No build step or package installation is required.

## Project structure

Keep the HTML pages, stylesheet, and main script at the repository root. This lets GitHub Pages find `index.html` and keeps the existing relative links working.

```text
.
├── index.html
├── about.html
├── work.html
├── project.html
├── cv.html
├── zin-book.html
├── style.css
├── script.js
└── assets/
    ├── data/       # Content and gallery data used by the pages
    ├── docs/       # CV and project book
    ├── fonts/      # Local font files and font information
    ├── images/     # Site-wide images
    ├── optimized/  # Optimized images for the site
    └── works/      # Project images and video
```

The folders under `assets/` are intentionally grouped by purpose. Do not rename or move them unless you also update every reference in the HTML, CSS, and JavaScript.

## Upload the complete site to GitHub

This project contains more than 100 files, so use Git or GitHub Desktop rather than GitHub's browser uploader. The browser uploader has per-upload and per-file limits; the optimized video is also larger than its per-file limit.

1. Create an empty repository on GitHub. Do not add a README or other starter files there.
2. Open a terminal in this project folder and run:

   ```bash
   git init -b main
   git add .
   git commit -m "Initial website"
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

3. Replace the remote URL with your repository's URL.
4. On GitHub, open **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/(root)`, then save.

The unoptimized `assets/works/future-traces-new-mary.mp4` source video is not used by the site and is excluded from Git because it exceeds GitHub's 100 MB per-file limit. The site uses `future-traces-new-mary-optimized.mp4` instead.
