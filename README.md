# Helia — Lizza Tivadze

Static portfolio website built with HTML, CSS, and JavaScript. No build step or package installation is required to serve it.

## Everyday workflow

The live site is built from the `main` branch. Every push to `main` deploys automatically through GitHub Actions; check progress in the repository's **Actions** tab.

1. Open the folder in VS Code and choose **Go Live** to preview at `http://127.0.0.1:5500`.
2. Make the change, then check it in the preview.
3. Upload it:

   ```bash
   git add .
   git commit -m "Describe the change"
   git push
   ```

Notes:

- Work on `main`. Run `git status` first; it should list only the files you meant to change.
- GitHub refuses any single file over 100 MB. Compress large videos first, and put unused originals in `.gitignore`.
- The preview and the live site remember the Sound setting separately, so a visitor's saved choice never affects yours.
- Browsers may block audible autoplay until a visitor interacts with the page. Allowing sound in site settings does not necessarily override autoplay restrictions.

## Add or edit a project

1. Add the images or video to `assets/works/<project>/`, and optimised copies to `assets/optimized/`.
2. Add or edit the project in `assets/data/stories.js`, plus any photo list in `assets/data/`.
3. Add the project's id to `ids` in `scripts/build-project-pages.cjs`, and to `STORY_ORDER` in `script.js`.
4. Add a row for it in the project index in `work.html`.
5. Run `node scripts/build-project-pages.cjs`, which needs [Node.js](https://nodejs.org), to regenerate the static pages.
6. Preview, then commit and push as above.

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
├── <project>.html  # Generated project pages (see "Add or edit a project")
├── style.css
├── script.js
├── scripts/        # build-project-pages.cjs, which generates the project pages
├── .github/        # GitHub Pages deployment workflow
├── .gitattributes  # Keeps line endings identical on Windows and GitHub
├── .editorconfig   # Shared editor settings (UTF-8, LF, 4 spaces)
├── .gitignore      # Files Git should never upload
└── assets/
    ├── data/       # Content and gallery data used by the pages
    ├── docs/       # CV and project book
    ├── fonts/      # Local font files and font information
    ├── images/     # Site-wide images
    ├── optimized/  # Optimized images for the site
    └── works/      # Project images and video
```

The folders under `assets/` are intentionally grouped by purpose. Do not rename or move them unless you also update every reference in the HTML, CSS, and JavaScript.

Project stories and image references live in `assets/data/`. After changing those files, run `node scripts/build-project-pages.cjs` to regenerate the static project pages and sharing metadata. Commit the generated HTML alongside the data changes. Old `project.html?id=...` links redirect to the corresponding static page when JavaScript is enabled; without it the old page lists the projects.

The Sound control remembers the visitor’s background-ambience preference in browser storage across pages. The Sound and Video buttons turn grey whenever nothing is actually playing (switched off, blocked by the browser until the first tap, muted, or paused), and show moving bars in rose only while sound is really coming out. On the main page the frosted-glass buttons turn dark at night so their light text stays readable. On phones (800 px and narrower) the four spaces are folded behind a round three-dot button at the bottom right; tapping it opens them as a small panel, and tapping elsewhere, pressing Escape or choosing a space closes it. The site attempts to start it on arrival, but browsers may require a tap first. Future Traces and Bugsphere also have a separate Video sound control; background ambience pauses during video playback and resumes afterwards if enabled. Future Traces attempts to play with sound on arrival; browsers that block audible autoplay show a play button instead. Bugsphere plays only when the viewer starts its film.

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
