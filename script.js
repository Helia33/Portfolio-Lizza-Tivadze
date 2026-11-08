const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const byId = (id) => document.getElementById(id);

document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
});

/* ---------- Arrival and departure: the page dissolves into mist ---------- */

requestAnimationFrame(() => document.body.classList.add("is-ready"));
window.addEventListener("pageshow", () => {
    document.body.classList.remove("is-leaving");
    document.querySelectorAll(".is-chosen").forEach((link) => link.classList.remove("is-chosen"));
});

document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-travel]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
    }

    const url = new URL(link.href, window.location.href);
    if (url.pathname === window.location.pathname) {
        return;
    }

    event.preventDefault();
    if (reducedMotion) {
        window.location.href = url.href;
        return;
    }

    link.classList.add("is-chosen");
    ambience.fadeOut();
    document.body.classList.add("is-leaving");
    window.setTimeout(() => {
        window.location.href = url.href;
    }, 750);
});

/* ---------- Navigation ---------- */

const menuToggle = byId("menu-toggle");
const siteNav = byId("site-nav");

if (menuToggle && siteNav) {
    const setMenu = (open) => {
        menuToggle.setAttribute("aria-expanded", String(open));
        siteNav.classList.toggle("is-open", open);
    };

    menuToggle.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));
    siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setMenu(false);
        }
    });
}

/* ---------- The work: each project told as a story of photographs and words ---------- */

const STORY_ORDER = ["wool-cups", "tklapi-lamp", "zin", "closet-memories", "future-traces"];

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
        node.className = className;
    }
    if (text !== undefined) {
        node.textContent = text;
    }
    return node;
}

// a photograph from a project, as a real image file lifted out of its original board
function photo(id, ref) {
    if (id === "future-traces" && window.FUTURE_TRACES_PHOTOS && window.FUTURE_TRACES_PHOTOS[ref]) {
        return window.FUTURE_TRACES_PHOTOS[ref];
    }
    if (id === "closet-memories" && window.MAPPING_PHOTOS && window.MAPPING_PHOTOS[ref]) {
        return window.MAPPING_PHOTOS[ref];
    }
    if (id === "tklapi-lamp" && window.TKLAPI_PHOTOS && window.TKLAPI_PHOTOS[ref]) {
        return window.TKLAPI_PHOTOS[ref];
    }
    if (id === "wool-cups" && window.WOOL_CUPS_PHOTOS && window.WOOL_CUPS_PHOTOS[ref]) {
        return window.WOOL_CUPS_PHOTOS[ref];
    }
    const [page, index] = ref.split("-").map(Number);
    const cut = window.WORKS && window.WORKS[id] && window.WORKS[id][page - 1] && window.WORKS[id][page - 1].cuts[index - 1];
    if (!cut) {
        return null;
    }
    return { src: cut.src, w: cut.w, h: cut.h, alt: cut.desc };
}

function picture(id, ref, className = "", eager = false) {
    const data = photo(id, ref);
    if (!data) {
        return null;
    }
    const figure = element("figure", `shot ${className}`.trim());
    const image = element("img");
    image.alt = data.alt;
    image.decoding = "async";
    image.loading = eager ? "eager" : "lazy";
    if (eager) {
        image.fetchPriority = "high";
    }
    if (data.w && data.h) {
        image.width = data.w;
        image.height = data.h;
    }
    image.dataset.view = "";
    figure.style.setProperty("--ratio", `${data.w} / ${data.h}`);
    image.src = data.src;
    figure.appendChild(image);
    return figure;
}

function caption(text) {
    return text ? element("p", "story-caption", text) : null;
}

function renderBlock(id, block) {
    const sizeClass = block.size ? ` story-${block.type}--${block.size}` : "";
    const section = element("section", `story-block story-${block.type}${sizeClass} reveal`);
    if (id === "tklapi-lamp" && block.type === "full" && block.image === "lamp-final-dark") {
        section.classList.add("story-lamp-night");
    }
    const add = (...nodes) => nodes.filter(Boolean).forEach((node) => section.appendChild(node));
    switch (block.type) {
    case "lede":
        add(element("p", "story-lede", block.text));
        break;
    case "paragraph":
        add(element("p", "story-text", block.text));
        break;
    case "quote": {
        const quote = element("blockquote", "story-quote");
        quote.appendChild(element("p", "", block.text));
        add(quote);
        break;
    }
    case "text":
        add(element("h2", "story-heading", block.heading), element("p", "story-text", block.text));
        break;
    case "text-image": {
        const words = element("div", "text-image-words");
        words.append(element("h2", "story-heading", block.heading), element("p", "story-text", block.text));
        add(words, picture(id, block.image, "shot-full"));
        break;
    }
    case "full":
        add(picture(id, block.image, "shot-full", block.image === "lamp-final-dark"), caption(block.caption));
        break;
    case "archive-grid": {
        const grid = element("div", "archive-grid");
        grid.tabIndex = 0;
        grid.setAttribute("aria-label", "Image archive arranged in rows across five categories");
        const rowCount = Math.max(...block.categories.map((category) => category.images.length));
        for (let row = 0; row < rowCount; row += 1) {
            block.categories.forEach((category) => {
                const ref = category.images[row];
                if (!ref) {
                    return;
                }
                const shot = picture(id, ref);
                if (shot) {
                    grid.appendChild(shot);
                }
            });
        }
        block.categories.forEach((category) => {
            grid.appendChild(element("h3", "archive-category-title", category.label));
        });
        add(grid);
        break;
    }
    case "feature-collection": {
        add(element("p", "story-label", block.label));
        const layout = element("div", "feature-collection-layout");
        const feature = element("div", "feature-collection-feature");
        const featureImage = picture(id, block.image, "shot-full");
        if (featureImage) {
            feature.append(featureImage, caption(block.caption));
        }
        const collection = element("div", "feature-collection-grid");
        collection.tabIndex = 0;
        collection.setAttribute("aria-label", "Scroll sideways through related map photographs");
        block.images.forEach((ref) => {
            const shot = picture(id, ref);
            if (shot) {
                collection.appendChild(shot);
            }
        });
        layout.append(feature, collection);
        add(layout);
        break;
    }
    case "pair":
    case "trio": {
        const row = element("div", "story-row");
        row.tabIndex = 0;
        row.setAttribute("aria-label", "Scroll sideways through the images");
        block.images.forEach((ref) => {
            const shot = picture(id, ref);
            if (shot) {
                row.appendChild(shot);
            }
        });
        add(row, caption(block.caption));
        break;
    }
    case "split": {
        section.classList.toggle("is-flipped", Boolean(block.flip));
        const words = element("div", "split-words");
        if (block.heading) {
            words.appendChild(element("h2", "story-heading", block.heading));
        }
        words.appendChild(element("p", "story-text", block.text));
        let image;
        if (block.images) {
            const layoutClass = block.layout ? ` split-gallery--${block.layout}` : "";
            image = element("div", `split-image split-gallery split-gallery--${block.images.length}${layoutClass}`);
            block.images.forEach((ref) => {
                const shot = picture(id, ref);
                if (shot) {
                    image.appendChild(shot);
                }
            });
        } else {
            image = picture(id, block.image, "split-image");
        }
        add(image, words);
        break;
    }
    case "video": {
        section.classList.toggle("story-video--with-text", Boolean(block.text));
        const player = element("video", "story-video-player");
        player.dataset.src = block.src;
        player.autoplay = true;
        player.controls = true;
        player.playsInline = true;
        player.muted = false;
        player.loop = true;
        player.preload = "none";
        if (block.poster) {
            player.poster = block.poster;
        }
        player.setAttribute("aria-label", "Future Traces video study");

        const media = element("div", "story-video-media");
        const playButton = element("button", "button story-video-play", "Play video with sound");
        playButton.type = "button";
        playButton.hidden = true;
        const status = element("p", "story-video-status");
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        media.append(player, playButton, status);

        player.addEventListener("playing", () => {
            if (id === "future-traces") {
                ambience.pause();
            }
            playButton.hidden = true;
            status.textContent = "";
        });
        const loadVideo = () => {
            if (!player.src) {
                player.src = player.dataset.src;
            }
            player.play().catch((error) => {
                playButton.hidden = false;
                status.textContent = error.name === "NotAllowedError"
                    ? "Your browser blocked autoplay with sound. Choose “Play video with sound” to start it."
                    : "The video could not start automatically. Choose “Play video with sound” to try again.";
            });
        };
        playButton.addEventListener("click", () => {
            loadVideo();
        });
        add(block.text ? element("p", "story-text", block.text) : null, media, caption(block.caption));
        if ("IntersectionObserver" in window) {
            const videoObserver = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    videoObserver.disconnect();
                    loadVideo();
                }
            }, { rootMargin: "300px" });
            videoObserver.observe(player);
        } else {
            loadVideo();
        }
        break;
    }
    case "mosaic": {
        if (block.label) {
            add(element("p", "story-label", block.label));
        }
        const grid = element("div", "mosaic-grid");
        grid.tabIndex = 0;
        grid.setAttribute("aria-label", "Scroll sideways through the images");
        block.images.forEach((ref, i) => {
            const shot = picture(id, ref);
            if (shot) {
                shot.style.setProperty("--i", i);
                grid.appendChild(shot);
            }
        });
        add(grid, caption(block.caption));
        break;
    }
    case "strip": {
        const track = element("div", "strip-track");
        track.tabIndex = 0;
        track.setAttribute("aria-label", "Scroll sideways through the images");
        block.images.forEach((ref) => {
            const shot = picture(id, ref);
            if (shot) {
                track.appendChild(shot);
            }
        });
        add(track, caption(block.caption));
        break;
    }
    case "senses": {
        const groups = element("div", "senses-grid");
        block.groups.forEach(([label, senses]) => {
            const group = element("div", "senses-group");
            group.appendChild(element("p", "story-label", label));
            const list = element("ul");
            senses.forEach((sense) => {
                const item = element("li", block.focus.includes(sense) ? "is-focus" : "", sense);
                list.appendChild(item);
            });
            group.appendChild(list);
            groups.appendChild(group);
        });
        add(groups, caption("The twelve senses. ZIN gathers around touch and movement."));
        break;
    }
    case "inscription": {
        const stone = element("div", "inscription-lines");
        block.lines.forEach((line) => stone.appendChild(element("p", "", line)));
        add(stone, caption(block.caption));
        break;
    }
    case "book": {
        const heading = element("h2", "story-heading", block.heading);
        const description = element("p", "story-text", block.text);
        const actions = element("div", "book-actions");
        const open = element("a", "button", "Open in a new tab ↗");
        open.href = block.reader;
        open.target = "_blank";
        open.rel = "noopener noreferrer";
        open.setAttribute("aria-label", "Open the ZIN project book in a two-page reader in a new tab");
        const download = element("a", "button", "Download the book ↓");
        download.href = block.src;
        download.download = "ZIN-project-book.pdf";
        actions.append(open, download);
        const frame = element("iframe", "book-frame");
        frame.src = `${block.reader}?embedded=1`;
        frame.title = "ZIN project book, displayed two pages at a time";
        frame.loading = "lazy";
        frame.setAttribute("allow", "fullscreen");
        frame.appendChild(element("p", "", "Your browser cannot display this PDF inline. Use the open or download link above."));
        const intro = element("div", "book-intro");
        intro.append(heading, description, actions);
        add(intro, frame);
        break;
    }
    case "steps": {
        const steps = element("ol", "steps-list");
        block.steps.forEach(([title, text, images], i) => {
            const step = element("li", "step");
            step.append(element("span", "step-number", String(i + 1).padStart(2, "0")), element("h3", "", title), element("p", "", text));
            const row = element("div", "step-images");
            row.tabIndex = 0;
            row.setAttribute("aria-label", `Scroll sideways through ${title} images`);
            images.forEach((ref) => {
                const shot = picture(id, ref);
                if (shot) {
                    const image = shot.querySelector("img");
                    const description = image.alt.replace(/^Fig\.\s*[\d.]+:\s*/i, "");
                    shot.appendChild(element("figcaption", "step-image-caption", description));
                    row.appendChild(shot);
                }
            });
            step.appendChild(row);
            steps.appendChild(step);
        });
        add(steps);
        break;
    }
    default:
        break;
    }
    return section;
}

const storyRoot = byId("story");

if (storyRoot && window.STORIES && window.WORKS) {
    const requested = new URLSearchParams(window.location.search).get("id");
    const id = window.STORIES[requested] ? requested : STORY_ORDER[0];
    const story = window.STORIES[id];
    const position = STORY_ORDER.indexOf(id);
    document.body.classList.add(`project-${id}`);
    document.title = `${story.title} — Lizza Tivadze`;
    document.body.style.setProperty("--tone", story.tone);
    storyRoot.replaceChildren();

    // the opening: the project's strongest photograph, filling the screen, with its title laid over it
    const hero = element("header", "story-hero");
    hero.classList.toggle("story-hero--artwork-cover", id === "tklapi-lamp");
    const cover = picture(id, story.cover, "hero-image", true);
    if (cover) {
        hero.appendChild(cover);
    }
    const heroText = element("div", "hero-words");
    heroText.append(
        element("p", "hero-meta", `${story.number} — ${story.discipline} · ${story.year}`),
        Object.assign(element("h1", "hero-title", story.title), { id: "story-title" }),
        element("p", "hero-tagline", story.tagline)
    );
    hero.appendChild(heroText);
    const cue = element("span", "hero-cue", "Scroll");
    cue.setAttribute("aria-hidden", "true");
    hero.appendChild(cue);
    storyRoot.appendChild(hero);

    const facts = element("dl", "story-facts section-wrap reveal");
    story.facts.forEach(([label, value]) => {
        const row = element("div");
        row.append(element("dt", "", label), element("dd", "", value));
        facts.appendChild(row);
    });
    storyRoot.appendChild(facts);

    const body = element("div", "story-body");
    story.blocks.forEach((block) => body.appendChild(renderBlock(id, block)));
    storyRoot.appendChild(body);

    // onward: the next project waits at the end, as its own image
    const nextId = STORY_ORDER[(position + 1) % STORY_ORDER.length];
    const next = window.STORIES[nextId];
    const onward = element("a", "story-next");
    onward.href = `project.html?id=${nextId}`;
    onward.dataset.travel = "";
    const nextImage = picture(nextId, next.cover, "next-image");
    if (nextImage) {
        nextImage.querySelector("img").removeAttribute("data-view");
        onward.appendChild(nextImage);
    }
    const nextWords = element("span", "next-words");
    nextWords.append(element("span", "next-label", "Next project"), element("span", "next-title", next.title), element("span", "next-line", next.tagline));
    onward.appendChild(nextWords);
    storyRoot.appendChild(onward);

    const back = element("a", "story-back section-wrap", "← All work");
    back.href = "work.html";
    back.dataset.travel = "";
    storyRoot.appendChild(back);
}

/* ---------- The exhibition: the work page as a sequence of rooms ---------- */

const exhibition = byId("exhibition");

if (exhibition && window.STORIES && window.WORKS) {
    exhibition.replaceChildren();
    const indexList = document.querySelector(".index-list");
    if (indexList) {
        const previews = new Map([...indexList.querySelectorAll("a[href]")].map((link) => {
            const id = new URL(link.href, window.location.href).searchParams.get("id");
            return [id, { src: link.dataset.preview, fit: link.dataset.previewFit }];
        }));
        const rows = STORY_ORDER.map((id) => {
            const story = window.STORIES[id];
            const link = element("a", "index-row");
            link.href = `project.html?id=${id}`;
            link.dataset.travel = "";
            link.setAttribute("aria-label", `${story.title}: ${story.tagline}`);
            const preview = previews.get(id);
            if (preview && preview.src) {
                link.dataset.preview = preview.src;
                if (preview.fit) {
                    link.dataset.previewFit = preview.fit;
                }
            }
            [story.number, story.title, story.discipline, story.year].forEach((value) => {
                link.appendChild(element("span", "", value));
            });
            const item = element("li");
            item.appendChild(link);
            return item;
        });
        indexList.replaceChildren(...rows);
    }

    STORY_ORDER.forEach((id, i) => {
        const story = window.STORIES[id];
        const room = element("article", `room ${i % 2 ? "is-flipped" : ""} reveal`.trim());
        room.style.setProperty("--tone", story.tone);
        const link = element("a", "room-link");
        link.href = `project.html?id=${id}`;
        link.dataset.travel = "";
        link.setAttribute("aria-label", `${story.title}: ${story.tagline}`);

        const stage = element("div", "room-stage");
        const main = picture(id, story.cover, "room-cover", i === 0);
        if (main) {
            main.querySelector("img").removeAttribute("data-view");
            stage.appendChild(main);
        }
        story.fragments.forEach((ref, k) => {
            const fragment = picture(id, ref, `room-fragment fragment-${k + 1}`);
            if (fragment) {
                fragment.querySelector("img").removeAttribute("data-view");
                fragment.dataset.depth = String(0.06 + k * 0.05);
                stage.appendChild(fragment);
            }
        });

        const words = element("div", "room-words");
        words.append(
            element("span", "room-number", story.number),
            element("h2", "room-title", story.title),
            element("p", "room-meta", `${story.discipline} · ${story.year}`),
            element("p", "room-tagline", story.tagline),
            element("span", "room-enter", "Enter the project →")
        );
        link.append(stage, words);
        room.appendChild(link);
        exhibition.appendChild(room);
    });

    // the fragments drift at their own depth as the page scrolls
    const fragments = [...exhibition.querySelectorAll("[data-depth]")];
    if (fragments.length && !reducedMotion) {
        let ticking = false;
        const drift = () => {
            ticking = false;
            const middle = window.innerHeight / 2;
            fragments.forEach((fragment) => {
                const box = fragment.parentElement.getBoundingClientRect();
                const offset = (box.top + box.height / 2 - middle) * Number(fragment.dataset.depth);
                fragment.style.setProperty("--drift", `${(-offset).toFixed(1)}px`);
            });
        };
        window.addEventListener("scroll", () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(drift);
            }
        }, { passive: true });
        drift();
    }
}

/* ---------- Looking closer: any photograph opens full screen ---------- */

if (document.querySelector("[data-view]")) {
    const viewer = element("div", "viewer");
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.setAttribute("aria-label", "Photograph");
    viewer.hidden = true;
    const viewerImage = element("img", "viewer-image");
    const viewerCaption = element("p", "viewer-caption");
    const close = element("button", "viewer-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    const prev = element("button", "viewer-step viewer-prev", "←");
    prev.type = "button";
    prev.setAttribute("aria-label", "Previous photograph");
    const nextButton = element("button", "viewer-step viewer-next", "→");
    nextButton.type = "button";
    nextButton.setAttribute("aria-label", "Next photograph");
    viewer.append(viewerImage, viewerCaption, close, prev, nextButton);
    document.body.appendChild(viewer);

    let images = [];
    let current = 0;
    let fullResolutionRequest = 0;
    let opener = null;
    const fullResolutionExtensionOverrides = new Map([
        ["assets/works/mapping/originals/mapping-resolution-005", ".webp"],
        ["assets/works/mapping/originals/mapping-resolution-008", ".webp"],
        ["assets/works/mapping/originals/mapping-resolution-007", ".webp"],
        ["assets/works/mapping/originals/mapping-resolution-004", ".webp"],
        ["assets/works/cuts/zin-sketch-concept", ".png"],
        ["assets/works/cuts/zin-sketch-structure", ".png"],
        ["assets/works/mapping/originals/mapping-resolution-003", ".webp"],
        ["assets/works/mapping/originals/mapping-resolution-002", ".webp"],
        ["assets/works/mapping/originals/mapping-resolution-001", ".webp"],
        ["assets/works/mapping/originals/mapping-resolution-009", ".webp"],
        ["assets/works/future-traces/cracked-icon-isolated", ".png"],
        ["assets/works/cuts/zin-gauze-model-side", ".jpeg"],
        ["assets/works/tklapi-lamp/lamp-final-dark", ".png"],
        ["assets/works/cuts/zin-sketch-materials", ".png"],
        ["assets/works/cuts/zin-landscape-study", ".jpeg"],
        ["assets/works/mapping/originals/mapping-resolution-006", ".webp"],
        ["assets/works/cuts/zin-gauze-model-front", ".jpeg"],
        ["assets/works/future-traces/final-back", ".png"],
        ["assets/works/future-traces/final-front", ".png"]
    ]);
    const show = (index) => {
        current = (index + images.length) % images.length;
        const selectedImage = images[current];
        viewerImage.src = selectedImage.currentSrc || selectedImage.src;
        viewerImage.alt = selectedImage.alt;
        viewerCaption.textContent = selectedImage.dataset.caption || selectedImage.alt;

        const imagePath = selectedImage.getAttribute("src") || selectedImage.src;
        const originalPath = imagePath
            .replace(/^assets\/optimized\//, "assets/")
            .replace(/\/cuts\/(?:half|half two)\//, "/cuts/")
            .replace(/\.webp$/i, "");
        if (originalPath === imagePath) {
            return;
        }

        const request = ++fullResolutionRequest;
        const extension = fullResolutionExtensionOverrides.get(originalPath) || ".jpg";
        const fullImage = new Image();
        fullImage.onload = () => {
            if (request === fullResolutionRequest && images[current] === selectedImage) {
                viewerImage.src = fullImage.src;
            }
        };
        fullImage.src = `${originalPath}${extension}`;
    };
    const open = (image) => {
        images = [...document.querySelectorAll("img[data-view]")];
        opener = image;
        show(images.indexOf(image));
        viewer.hidden = false;
        requestAnimationFrame(() => viewer.classList.add("is-open"));
        document.body.classList.add("is-viewing");
        close.focus({ preventScroll: true });
    };
    const shut = () => {
        viewer.classList.remove("is-open");
        document.body.classList.remove("is-viewing");
        window.setTimeout(() => {
            viewer.hidden = true;
            if (opener) {
                opener.focus({ preventScroll: true });
            }
        }, 400);
    };

    document.addEventListener("click", (event) => {
        const image = event.target.closest("img[data-view]");
        if (image) {
            open(image);
        }
    });
    document.querySelectorAll("img[data-view]").forEach((image) => {
        image.tabIndex = 0;
    });
    document.addEventListener("keydown", (event) => {
        if (viewer.hidden) {
            const image = event.target.closest && event.target.closest("img[data-view]");
            if (image && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                open(image);
            }
            return;
        }
        if (event.key === "Escape") {
            shut();
        } else if (event.key === "ArrowRight") {
            show(current + 1);
        } else if (event.key === "ArrowLeft") {
            show(current - 1);
        }
    });
    viewer.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") {
            return;
        }
        const focusable = [...viewer.querySelectorAll("button:not([disabled])")];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !viewer.contains(document.activeElement))) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !viewer.contains(document.activeElement))) {
            event.preventDefault();
            first.focus();
        }
    });
    close.addEventListener("click", shut);
    prev.addEventListener("click", () => show(current - 1));
    nextButton.addEventListener("click", () => show(current + 1));
    viewer.addEventListener("click", (event) => {
        if (event.target === viewer) {
            shut();
        }
    });
}

/* ---------- Things surface out of the mist ---------- */

const revealTargets = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    revealTargets.forEach((target) => revealObserver.observe(target));
} else {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
}

const lampNightTarget = document.querySelector(".story-lamp-night");

if (lampNightTarget) {
    const lampNightOverlay = element("div", "lamp-night-overlay");
    lampNightOverlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(lampNightOverlay);
}

if (lampNightTarget) {
    const lampNightOverlay = document.querySelector(".lamp-night-overlay");
    const updateLampNight = () => {
        const bounds = lampNightTarget.getBoundingClientRect();
        const inFocus = bounds.top < window.innerHeight * 0.75 && bounds.bottom > window.innerHeight * 0.25;
        document.body.classList.toggle("is-lamp-night", inFocus);
        lampNightOverlay.classList.toggle("is-active", inFocus);
    };

    window.addEventListener("scroll", updateLampNight, { passive: true });
    window.addEventListener("resize", updateLampNight);
    updateLampNight();
}

/* ---------- Drifting particles of light ---------- */

const motesLayer = byId("motes");

if (motesLayer && !reducedMotion) {
    const count = window.innerWidth < 700 ? 14 : 26;

    for (let i = 0; i < count; i += 1) {
        const mote = document.createElement("span");
        const size = 3 + Math.random() * 9;
        mote.className = "mote";
        mote.style.left = `${Math.random() * 100}%`;
        mote.style.width = `${size}px`;
        mote.style.height = `${size}px`;
        mote.style.animationDuration = `${26 + Math.random() * 30}s`;
        mote.style.animationDelay = `${-Math.random() * 46}s`;
        mote.style.setProperty("--sway", `${(Math.random() - 0.5) * 140}px`);
        mote.style.setProperty("--glow", String(0.35 + Math.random() * 0.5));
        motesLayer.appendChild(mote);
    }
}

/* ---------- Pointer ---------- */

const orb = byId("cursor-orb");
const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: 0, strength: 0 };
let orbX = window.innerWidth / 2;
let orbY = window.innerHeight / 2;
let orbTargetX = orbX;
let orbTargetY = orbY;

if (finePointer) {
    window.addEventListener("pointermove", (event) => {
        orbTargetX = event.clientX;
        orbTargetY = event.clientY;
        pointer.tx = event.clientX / window.innerWidth;
        pointer.ty = 1 - event.clientY / window.innerHeight;
        pointer.active = 1;
        if (orb) {
            orb.classList.add("is-active");
        }
    }, { passive: true });

    document.addEventListener("pointerleave", () => {
        pointer.active = 0;
        if (orb) {
            orb.classList.remove("is-active");
        }
    });
}

/* ---------- Sound: a generative ambience of the age of mist ---------- */

const ambience = (() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const header = document.querySelector(".site-header");
    if (!AudioContextClass || !header) {
        return { fadeOut() {} };
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "sound-toggle";
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", "Turn sound on");
    button.innerHTML = '<span class="sound-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="sound-label">Sound</span>';
    header.appendChild(button);

    // D major pentatonic, the open, unresolved scale of bells heard across water
    const scale = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880];
    let context = null;
    let master = null;
    let bus = null;
    let enabled = false;
    let chimeTimer = 0;
    let lastHover = { target: null, time: 0 };

    const impulse = (seconds, decay) => {
        const length = Math.floor(context.sampleRate * seconds);
        const buffer = context.createBuffer(2, length, context.sampleRate);
        for (let channel = 0; channel < 2; channel += 1) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < length; i += 1) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return buffer;
    };

    const modulate = (param, rate, depth) => {
        const lfo = context.createOscillator();
        const amount = context.createGain();
        lfo.frequency.value = rate;
        amount.gain.value = depth;
        lfo.connect(amount).connect(param);
        lfo.start();
    };

    const build = () => {
        context = new AudioContextClass();
        master = context.createGain();
        master.gain.value = 0;
        master.connect(context.createDynamicsCompressor()).connect(context.destination);

        // everything rings out in a long, cathedral-like space
        bus = context.createGain();
        const reverb = context.createConvolver();
        const wet = context.createGain();
        const dry = context.createGain();
        reverb.buffer = impulse(7, 2.6);
        wet.gain.value = 0.85;
        dry.gain.value = 0.32;
        bus.connect(dry).connect(master);
        bus.connect(reverb).connect(wet).connect(master);

        // a slowly breathing drone of D, A, D, F sharp and A
        const padFilter = context.createBiquadFilter();
        padFilter.type = "lowpass";
        padFilter.frequency.value = 720;
        padFilter.Q.value = 0.4;
        padFilter.connect(bus);
        modulate(padFilter.frequency, 0.021, 320);

        [[73.42, 0.085], [110, 0.06], [146.83, 0.05], [185, 0.03], [220, 0.024]].forEach(([frequency, level], index) => {
            const voice = context.createGain();
            voice.gain.value = level;
            modulate(voice.gain, 0.03 + index * 0.017, level * 0.65);
            ["sine", "triangle"].forEach((type, k) => {
                const oscillator = context.createOscillator();
                oscillator.type = type;
                oscillator.frequency.value = frequency;
                oscillator.detune.value = k ? 5 : -5;
                oscillator.connect(voice);
                oscillator.start();
            });
            voice.connect(padFilter);
        });

        // wind moving over still water: soft brown noise that swells and recedes
        const noiseBuffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
        const samples = noiseBuffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < samples.length; i += 1) {
            last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
            samples[i] = last * 3.5;
        }
        const wind = context.createBufferSource();
        const windFilter = context.createBiquadFilter();
        const windGain = context.createGain();
        wind.buffer = noiseBuffer;
        wind.loop = true;
        windFilter.type = "bandpass";
        windFilter.frequency.value = 520;
        windFilter.Q.value = 0.7;
        windGain.gain.value = 0.11;
        modulate(windGain.gain, 0.05, 0.07);
        modulate(windFilter.frequency, 0.033, 260);
        wind.connect(windFilter).connect(windGain).connect(bus);
        wind.start();
    };

    // a glass-like bell: a fundamental with soft, slightly inharmonic overtones
    const chime = (volume, frequency) => {
        if (!enabled || !context) {
            return;
        }
        const now = context.currentTime;
        const pitch = frequency || scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.3 ? 2 : 1);
        const envelope = context.createGain();
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(volume, now + 0.02);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + 5);
        [[1, 1], [2.76, 0.25], [5.4, 0.08]].forEach(([ratio, level]) => {
            const oscillator = context.createOscillator();
            const partial = context.createGain();
            oscillator.frequency.value = pitch * ratio;
            partial.gain.value = level;
            oscillator.connect(partial).connect(envelope);
            oscillator.start(now);
            oscillator.stop(now + 5.2);
        });
        if (context.createStereoPanner) {
            const pan = context.createStereoPanner();
            pan.pan.value = Math.random() * 1.4 - 0.7;
            envelope.connect(pan).connect(bus);
        } else {
            envelope.connect(bus);
        }
    };

    const scheduleChimes = () => {
        window.clearTimeout(chimeTimer);
        chimeTimer = window.setTimeout(() => {
            chime(0.045 + Math.random() * 0.03);
            scheduleChimes();
        }, 3500 + Math.random() * 6500);
    };

    const rampTo = (value, seconds) => {
        const now = context.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(value, now + seconds);
    };

    let mediaPauseTimer = 0;
    const setEnabled = (value) => {
        window.clearTimeout(mediaPauseTimer);
        enabled = value;
        button.setAttribute("aria-pressed", String(value));
        button.setAttribute("aria-label", value ? "Turn sound off" : "Turn sound on");

        if (value) {
            if (!context) {
                build();
            }
            context.resume().catch((error) => {
                if (!enabled) {
                    return;
                }
                enabled = false;
                button.setAttribute("aria-pressed", "false");
                button.setAttribute(
                    "aria-label",
                    error.name === "NotAllowedError" ? "Tap or press a key to start sound" : "Sound unavailable"
                );
                window.clearTimeout(chimeTimer);
            });
            rampTo(0.55, 3);
            scheduleChimes();
        } else if (context) {
            window.clearTimeout(chimeTimer);
            rampTo(0, 1.2);
            window.setTimeout(() => {
                if (!enabled) {
                    context.suspend();
                }
            }, 1400);
        }
    };

    button.addEventListener("click", () => {
        setEnabled(!enabled || (context && context.state !== "running"));
    });

    // a faint note answers whenever the pointer finds a link
    document.addEventListener("pointerover", (event) => {
        const target = event.target.closest("a, button");
        const now = performance.now();
        if (!target || target === lastHover.target || now - lastHover.time < 220) {
            return;
        }
        lastHover = { target, time: now };
        chime(0.016, scale[5 + Math.floor(Math.random() * 4)]);
    });

    // Try to start on arrival, then resume on the first gesture if the browser blocks autoplay.
    const resume = (event) => {
        window.removeEventListener("pointerdown", resume);
        window.removeEventListener("keydown", resume);
        if (event && event.target.closest && event.target.closest(".sound-toggle")) {
            return;
        }
        setEnabled(true);
    };
    setEnabled(true);
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);

    return {
        fadeOut() {
            if (enabled && context) {
                rampTo(0, 0.7);
            }
        },
        pause() {
            if (!enabled || !context) {
                return;
            }
            window.clearTimeout(chimeTimer);
            rampTo(0, 0.7);
            mediaPauseTimer = window.setTimeout(() => {
                context.suspend();
            }, 750);
        }
    };
})();

/* ---------- Water ripple on hovered project images ---------- */

const rippleNoise = byId("ripple-noise");
let rippleTarget = null;

document.querySelectorAll(".project-media").forEach((media) => {
    const start = () => {
        if (!reducedMotion && finePointer) {
            rippleTarget = media;
            media.classList.add("is-rippling");
        }
    };
    const stop = () => {
        media.classList.remove("is-rippling");
        if (rippleTarget === media) {
            rippleTarget = null;
        }
    };

    media.addEventListener("pointerenter", start);
    media.addEventListener("pointerleave", stop);
});

/* ---------- Work index: an image surfaces beside the cursor ---------- */

const indexPreview = byId("index-preview");

if (indexPreview && finePointer) {
    const previewImage = indexPreview.querySelector("img");
    let previewX = 0;
    let previewY = 0;
    let targetX = 0;
    let targetY = 0;
    let following = false;

    const follow = () => {
        previewX += (targetX - previewX) * 0.16;
        previewY += (targetY - previewY) * 0.16;
        indexPreview.style.transform = `translate3d(${previewX}px, ${previewY}px, 0)`;
        if (following) {
            requestAnimationFrame(follow);
        }
    };

    document.querySelectorAll("[data-preview]").forEach((row) => {
        row.addEventListener("pointerenter", (event) => {
            previewImage.src = row.dataset.preview;
            indexPreview.classList.toggle("is-portrait", row.dataset.previewFit === "portrait");
            targetX = event.clientX;
            targetY = event.clientY;
            if (!following) {
                previewX = targetX;
                previewY = targetY;
                following = true;
                requestAnimationFrame(follow);
            }
            indexPreview.classList.add("is-visible");
        });
        row.addEventListener("pointermove", (event) => {
            targetX = event.clientX;
            targetY = event.clientY;
        });
        row.addEventListener("pointerleave", () => {
            indexPreview.classList.remove("is-visible");
            window.setTimeout(() => {
                if (!indexPreview.classList.contains("is-visible")) {
                    following = false;
                }
            }, 450);
        });
    });
}

/* ---------- The world: a walkable Atlantis among the high Caucasus ---------- */

// how the noise becomes land: valleys stay low and soft, summits rise steeply
const SHAPE_LOW = 0.36;
const SHAPE_POWER = 1.8;
const SHAPE_SCALE = 44;
// lakes fill the valley floors up to this height
const WATER_LEVEL = -0.15;

const canvas = byId("mist-canvas");
const explorable = document.body.classList.contains("landing");
const compact = window.innerWidth < 700;
let borjgali = null;

if (canvas) {
    const arm = "M0 -15 C 3 -25, 15 -33, 27 -28 C 35 -24, 34 -15, 27 -13 C 22 -11, 18 -16, 21 -20";
    const arms = Array.from({ length: 7 }, (_, index) => `<path d="${arm}" transform="rotate(${(index * 360 / 7).toFixed(2)})"/>`).join("");
    borjgali = document.createElement("div");
    borjgali.className = "borjgali";
    borjgali.setAttribute("aria-hidden", "true");
    borjgali.innerHTML = `<svg viewBox="-50 -50 100 100" focusable="false">${arms}<circle r="44" stroke-dasharray="1 5"/></svg>`;
    canvas.after(borjgali);
}

// The terrain is evaluated both on the GPU (to draw it) and here (so the viewer floats above the ground).
// Its noise uses an integer permutation that stays exact in 32-bit floats, so both sides agree.
const world = explorable ? (() => {
    const perm = (x) => ((x * 34 + 1) * x) % 289;
    const wrap = (x) => x - Math.floor(x / 289) * 289;
    const lattice = (x, y) => perm(perm(wrap(x)) + wrap(y)) / 289;

    const gnoise = (x, y) => {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;
        const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
        const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
        const corner = (cx, cy, dx, dy) => {
            const angle = lattice(cx, cy) * 6.2831853;
            return Math.cos(angle) * dx + Math.sin(angle) * dy;
        };
        const a = corner(ix, iy, fx, fy);
        const b = corner(ix + 1, iy, fx - 1, fy);
        const c = corner(ix, iy + 1, fx, fy - 1);
        const d = corner(ix + 1, iy + 1, fx - 1, fy - 1);
        const top = a + (b - a) * ux;
        return top + (c + (d - c) * ux - top) * uy;
    };

    // the land: ridged, eroded ranges whose crests bend naturally, as real mountain chains do
    const height = (x, z) => {
        // domain warping lets the ridges wander instead of running in straight lines
        const wx = x + gnoise(x * 0.011 + 3.1, z * 0.011) * 9;
        const wz = z + gnoise(x * 0.011, z * 0.011 + 7.7) * 9;
        let qx = wx * 0.034;
        let qz = wz * 0.034;
        let h = 0;
        let amplitude = 0.5;
        let weight = 1;
        for (let i = 0; i < 6; i += 1) {
            let ridge = Math.min(Math.max(1 - Math.abs(gnoise(qx, qz)) * 1.4, 0), 1);
            ridge *= ridge;
            h += ridge * amplitude * weight;
            weight = Math.min(Math.max(ridge * 1.6, 0), 1);
            const nx = 1.6 * qx - 1.2 * qz;
            qz = 1.2 * qx + 1.6 * qz;
            qx = nx;
            amplitude *= 0.47;
        }
        const raised = Math.max(h - SHAPE_LOW, 0);
        let land = Math.pow(raised, SHAPE_POWER) * SHAPE_SCALE - 0.6 + gnoise(x * 0.12, z * 0.12) * 0.5;
        // high ground is cut by fine gullies and rock ribs; valley floors stay smooth and soft
        const rugged = Math.min(1, raised * 3.2);
        land += (Math.abs(gnoise(wx * 0.42, wz * 0.42)) - 0.3) * 0.7 * rugged;
        land += gnoise(wx * 1.3 + 5.1, wz * 1.3) * 0.16 * rugged;
        return land;
    };

    // the great named summits are added once the view is known; until then this is the bare range
    let peaks = [];
    const peakHeight = (x, z) => {
        let top = 0;
        peaks.forEach(([px, pz, ph, pr], i) => {
            const d = Math.hypot(x - px, z - pz);
            if (d < pr) {
                const around = Math.atan2(z - pz, x - px);
                const rib = 1 - Math.abs(Math.sin(around * (i === 0 ? 7 : 4) + gnoise(x * 0.15, z * 0.15) * 2.5));
                const fall = 1 - d / pr;
                const crest = 1 - Math.abs(gnoise(x * 0.32 + i * 3.7, z * 0.32));
                const cone = ph * Math.pow(fall, i === 0 ? 1.5 : 2.3) * (0.82 + 0.18 * rib * (1 - fall * 0.6)) + crest * crest * crest * 2.2 * Math.sqrt(fall);
                top = Math.max(top, cone);
            }
        });
        return top;
    };
    const rangeHeight = height;
    const fullHeight = (x, z) => rangeHeight(x, z) + (peaks.length ? peakHeight(x, z) : 0);

    const slope = (x, z) => Math.abs(height(x + 0.4, z) - height(x - 0.4, z)) + Math.abs(height(x, z + 0.4) - height(x, z - 0.4));

    // judge a view: a clear foreground, then the grandest summits rising in the distance
    const viewScore = (x, z, yaw) => {
        const base = height(x, z);
        let blocked = 0;
        for (let distance = 1; distance <= 14; distance += 1.5) {
            blocked = Math.max(blocked, height(x + Math.sin(yaw) * distance, z + Math.cos(yaw) * distance) - base - distance * 0.12);
        }
        let summit = -Infinity;
        for (let distance = 22; distance <= 70; distance += 4) {
            summit = Math.max(summit, height(x + Math.sin(yaw) * distance, z + Math.cos(yaw) * distance) - distance * 0.04);
        }
        return summit - Math.max(blocked, 0) * 3;
    };

    // begin on a low valley floor, wherever the view towards the mountains is finest
    let start = null;
    let view = { yaw: 0, score: -Infinity };
    for (let x = -36; x <= 36; x += 6) {
        for (let z = -36; z <= 36; z += 6) {
            const h = height(x, z);
            if (h > WATER_LEVEL - 0.03) {
                continue;
            }
            for (let i = 0; i < 24; i += 1) {
                const yaw = (i / 24) * Math.PI * 2;
                const score = viewScore(x, z, yaw);
                if (score > view.score) {
                    view = { yaw, score };
                    start = { x, z, h };
                }
            }
        }
    }
    if (!start) {
        start = { x: 0, z: 0, h: height(0, 0) };
    }
    for (let i = -6; i <= 6; i += 1) {
        const yaw = view.yaw + i * 0.04;
        const score = viewScore(start.x, start.z, yaw);
        if (score > view.score) {
            view = { yaw, score };
        }
    }

    const around = (yaw, distance) => ({ x: start.x + Math.sin(yaw) * distance, z: start.z + Math.cos(yaw) * distance });

    // a great glaciated cone straight ahead, as Kazbek stands over Stepantsminda,
    // and to the left the twin horns of an Ushba, as over Svaneti
    const kazbek = around(view.yaw + 0.05, 78);
    const ushba = around(view.yaw - 0.72, 52);
    const side = [Math.cos(view.yaw - 0.72) * 1.3, -Math.sin(view.yaw - 0.72) * 1.3];
    peaks = [
        [kazbek.x, kazbek.z, 17, 34],
        [ushba.x + side[0], ushba.z + side[1], 13, 9],
        [ushba.x - side[0], ushba.z - side[1], 11.5, 8.5]
    ];

    // villages gather in every valley: on gentle ground above the water, never on steep slopes,
    // a few nearby so the traveller passes them, more scattered through the distance
    const villages = [];
    const villageSpots = [];
    const flatEnough = (x, z) => slope(x, z) < 1.1;
    for (let ring = 0; ring < 3; ring += 1) {
        const near = [7, 18, 32][ring];
        const far = [16, 30, 52][ring];
        const count = [6, 8, 8][ring];
        for (let k = 0; k < count; k += 1) {
            const bearing = (k / count) * Math.PI * 2 + ring * 0.37;
            let best = null;
            for (let offset = -0.3; offset <= 0.3; offset += 0.1) {
                for (let distance = near; distance <= far; distance += 1.5) {
                    const spot = around(view.yaw + bearing + offset, distance);
                    const h = fullHeight(spot.x, spot.z);
                    if (h < WATER_LEVEL + 0.25 || h > 3.4 || !flatEnough(spot.x, spot.z)) {
                        continue;
                    }
                    if (villageSpots.some((v) => Math.hypot(v.x - spot.x, v.z - spot.z) < 5.5)) {
                        continue;
                    }
                    const score = slope(spot.x, spot.z) + Math.abs(h - 0.7) * 0.12;
                    if (!best || score < best.score) {
                        best = { ...spot, h, score };
                    }
                }
            }
            if (best) {
                villageSpots.push(best);
                villages.push([best.x, best.h, best.z, 0.37 + villages.length * 1.91]);
            }
        }
    }

    // cross-domed churches keeping watch from hilltops, as Gergeti does
    const churches = [[0.5, 11, 20], [-1.3, 10, 22], [2.5, 12, 24], [-2.6, 20, 34], [1.1, 24, 40]].map(([bearing, near, far], k) => {
        let best = null;
        for (let offset = -0.3; offset <= 0.3; offset += 0.1) {
            for (let distance = near; distance <= far; distance += 1) {
                const spot = around(view.yaw + bearing + offset, distance);
                const h = fullHeight(spot.x, spot.z);
                if (h < WATER_LEVEL + 0.3) {
                    continue;
                }
                const score = h - slope(spot.x, spot.z) * 1.6 - Math.max(h - start.h - 4, 0) * 3;
                if (!best || score > best.score) {
                    best = { ...spot, h, score };
                }
            }
        }
        best = best || { ...around(view.yaw + bearing, near), h: 0 };
        return [best.x, best.h, best.z, view.yaw + k * 1.3];
    });

    return {
        height: fullHeight,
        start,
        yaw: view.yaw,
        peaks,
        villages,
        churches
    };
})() : {
    height: () => WATER_LEVEL,
    start: { x: 0, z: 0, h: WATER_LEVEL },
    yaw: 0,
    peaks: [],
    villages: [],
    churches: []
};

const camera = {
    x: world.start.x,
    z: world.start.z,
    y: world.start.h + 0.22,
    yaw: world.yaw,
    pitch: 0.07,
    targetYaw: world.yaw,
    targetPitch: 0.07,
    vx: 0,
    vz: 0,
    lift: 0,
    targetY: world.start.h + 0.22,
    glide: 0
};

const FOCAL = 1.25;

/* ---------- Fluid moments: now and then the whole world turns briefly liquid ---------- */

const liquid = { value: 0, seconds: 0, start: 0, next: performance.now() + 25000 + Math.random() * 20000 };

function updateLiquid(now, seconds) {
    liquid.seconds = seconds;
    if (reducedMotion) {
        liquid.value = 0;
        return;
    }
    if (!liquid.start && now > liquid.next) {
        liquid.start = now;
    }
    if (!liquid.start) {
        liquid.value = 0;
        return;
    }
    const elapsed = (now - liquid.start) / 1000;
    const ease = (x) => x * x * (3 - 2 * x);
    if (elapsed < 2.5) {
        liquid.value = ease(elapsed / 2.5);
    } else if (elapsed < 5.5) {
        liquid.value = 1;
    } else if (elapsed < 9) {
        liquid.value = 1 - ease((elapsed - 5.5) / 3.5);
    } else {
        liquid.value = 0;
        liquid.start = 0;
        liquid.next = now + 35000 + Math.random() * 35000;
    }
}

// the camera follows the same liquid swell as the shader's land
const flowOffset = (x, z) => liquid.value * 0.55 * Math.sin(x * 0.35 + liquid.seconds * 1.3) * Math.sin(z * 0.3 - liquid.seconds * 1.1);
const groundAt = (x, z) => Math.max(world.height(x, z) + flowOffset(x, z), WATER_LEVEL);

/* ---------- Day and night: one slow day passes every eight minutes ---------- */

const DAY_LENGTH = 480;
// the cycle carries across pages, so moving through the site never resets the light
const cycleOrigin = (() => {
    const fresh = Date.now() - 0.06 * DAY_LENGTH * 1000;
    try {
        const stored = Number(sessionStorage.getItem("helia-day"));
        if (stored) {
            return stored;
        }
        sessionStorage.setItem("helia-day", String(fresh));
    } catch (error) {
        // storage unavailable: the day simply begins again at dawn
    }
    return fresh;
})();
// inner pages only ever reach a soft dusk, so their text stays easy to read
const nightDepth = explorable ? 1 : 0.4;
let nightShown = false;

function orbit(phase) {
    const angle = phase * Math.PI * 2;
    const elevation = Math.sin(angle) * 0.34;
    const azimuth = world.yaw + 0.22 + Math.cos(angle) * 1.2;
    return [Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation)];
}

function skyState() {
    // 0 is sunrise, 0.25 midday, 0.5 sunset, 0.75 midnight; ?hour=0.5 in the address pins a moment
    const pinned = Number.parseFloat(new URLSearchParams(window.location.search).get("hour"));
    const flowing = (((Date.now() - cycleOrigin) / 1000 / DAY_LENGTH) % 1 + 1) % 1;
    const phase = Number.isFinite(pinned) ? pinned : reducedMotion ? 0.12 : flowing;
    const sun = orbit(phase);
    const moon = orbit(phase + 0.5);
    const rise = Math.min(1, Math.max(0, (sun[1] + 0.12) / 0.3));
    const fullDay = rise * rise * (3 - 2 * rise);
    const day = 1 - (1 - fullDay) * nightDepth;
    const dusk = Math.exp(-Math.pow(sun[1] / 0.12, 2)) * (explorable ? 1 : 0.6);

    if (explorable) {
        const night = 1 - fullDay;
        if (!nightShown && night > 0.6) {
            nightShown = true;
            document.body.classList.add("is-night");
        } else if (nightShown && night < 0.45) {
            nightShown = false;
            document.body.classList.remove("is-night");
        }
    }
    return { sun, moon, day, dusk };
}

const cameraBasis = () => {
    const cp = Math.cos(camera.pitch);
    const forward = [Math.sin(camera.yaw) * cp, Math.sin(camera.pitch), Math.cos(camera.yaw) * cp];
    const right = [forward[2], 0, -forward[0]];
    const rightLength = Math.hypot(right[0], right[2]) || 1;
    right[0] /= rightLength;
    right[2] /= rightLength;
    const up = [
        forward[1] * right[2] - forward[2] * right[1],
        forward[2] * right[0] - forward[0] * right[2],
        forward[0] * right[1] - forward[1] * right[0]
    ];
    return { forward, right, up };
};

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// the borjgali stays fixed around the moon as the view turns
function placeBorjgali(light, elapsed) {
    if (!borjgali) {
        return;
    }
    const { forward, right, up } = cameraBasis();
    const depth = dot(light.moon, forward);
    const rising = Math.min(1, Math.max(0, (light.moon[1] + 0.04) / 0.16));
    borjgali.style.opacity = String(0.17 * rising * (0.35 + 0.65 * (1 - light.day)) * Math.min(1, elapsed / 4000));
    if (depth < 0.15) {
        borjgali.style.visibility = "hidden";
        return;
    }
    const sx = (dot(light.moon, right) / depth) * FOCAL;
    const sy = (dot(light.moon, up) / depth) * FOCAL;
    borjgali.style.visibility = "visible";
    borjgali.style.left = `${window.innerWidth / 2 + sx * window.innerHeight}px`;
    borjgali.style.top = `${window.innerHeight / 2 - sy * window.innerHeight}px`;
}

/* ---------- Moving through the world ---------- */

const keys = new Set();
const pad = { forward: 0, back: 0, left: 0, right: 0, up: 0, down: 0 };
const walkRipples = Array.from({ length: 4 }, () => ({ x: 0, z: 0, born: -Infinity }));
let nextWalkRipple = 0;
let lastWalkRipple = 0;
let walkedOnWater = 0;
let previousWalkPosition = { x: camera.x, z: camera.z };
let drag = null;
let wheelImpulse = 0;
let requestDraw = () => {};

if (explorable) {
    const keyMap = {
        KeyW: "forward", ArrowUp: "forward",
        KeyS: "back", ArrowDown: "back",
        KeyA: "left", ArrowLeft: "left",
        KeyD: "right", ArrowRight: "right",
        KeyE: "up", PageUp: "up",
        KeyQ: "down", PageDown: "down",
        ShiftLeft: "fast", ShiftRight: "fast"
    };

    window.addEventListener("keydown", (event) => {
        const action = keyMap[event.code];
        if (!action || event.metaKey || event.ctrlKey || event.altKey || event.target.closest("input, textarea, select, dialog")) {
            return;
        }
        if (action !== "fast") {
            event.preventDefault();
        }
        keys.add(action);
        requestDraw();
    });

    window.addEventListener("keyup", (event) => {
        keys.delete(keyMap[event.code]);
    });

    window.addEventListener("blur", () => keys.clear());

    // a double click calls up a fluid moment at will
    document.addEventListener("dblclick", (event) => {
        if (event.target.closest("a, button, dialog") || reducedMotion || liquid.start) {
            return;
        }
        liquid.start = performance.now();
        requestDraw();
    });

    document.addEventListener("pointerdown", (event) => {
        if ((event.pointerType === "mouse" && event.button !== 0) || event.target.closest("a, button, input, dialog, .site-nav, .explore-pad")) {
            return;
        }
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
        document.body.classList.add("is-dragging");
        requestDraw();
    });

    window.addEventListener("pointermove", (event) => {
        if (!drag || event.pointerId !== drag.id) {
            return;
        }
        camera.targetYaw -= (event.clientX - drag.x) * 0.0045;
        camera.targetPitch = Math.min(1.2, Math.max(-1.2, camera.targetPitch + (event.clientY - drag.y) * 0.0035));
        drag.x = event.clientX;
        drag.y = event.clientY;
        requestDraw();
    });

    const endDrag = (event) => {
        if (drag && event.pointerId === drag.id) {
            drag = null;
            document.body.classList.remove("is-dragging");
        }
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    window.addEventListener("wheel", (event) => {
        if (event.target.closest("dialog")) {
            return;
        }
        event.preventDefault();
        wheelImpulse = Math.max(-14, Math.min(14, wheelImpulse - event.deltaY * 0.012));
        requestDraw();
    }, { passive: false });

    document.querySelectorAll("[data-move]").forEach((button) => {
        const direction = button.dataset.move;
        const release = () => {
            pad[direction] = 0;
        };
        button.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            button.setPointerCapture(event.pointerId);
            pad[direction] = 1;
            requestDraw();
        });
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("lostpointercapture", release);
    });

    // wandering hides the words so only the landscape remains
    const wander = byId("wander-toggle");
    const leave = byId("explore-return");
    const setWandering = (on) => {
        document.body.classList.toggle("is-exploring", on);
        if (on && leave) {
            leave.focus({ preventScroll: true });
        } else if (!on && wander) {
            wander.focus({ preventScroll: true });
        }
    };
    if (wander) {
        wander.addEventListener("click", () => setWandering(true));
    }
    if (leave) {
        leave.addEventListener("click", () => setWandering(false));
    }
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && document.body.classList.contains("is-exploring")) {
            setWandering(false);
        }
    });
}

function updateCamera(dt, time, scroll) {
    const sinYaw = Math.sin(camera.yaw);
    const cosYaw = Math.cos(camera.yaw);

    if (explorable) {
        const forward = (keys.has("forward") ? 1 : 0) - (keys.has("back") ? 1 : 0) + pad.forward - pad.back;
        const strafe = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0) + pad.right - pad.left;
        const length = Math.hypot(forward, strafe) || 1;
        const speed = keys.has("fast") ? 8 : 3.2;
        let targetVx = ((sinYaw * forward + cosYaw * strafe) / length) * speed;
        let targetVz = ((cosYaw * forward - sinYaw * strafe) / length) * speed;
        targetVx += sinYaw * wheelImpulse;
        targetVz += cosYaw * wheelImpulse;
        wheelImpulse *= Math.pow(0.04, dt);
        const ease = Math.min(1, dt * 3.5);
        camera.vx += (targetVx - camera.vx) * ease;
        camera.vz += (targetVz - camera.vz) * ease;
    } else {
        // on the inner pages the view simply glides on, slowly turning
        camera.targetYaw = world.yaw + Math.sin(time * 0.02) * 0.3;
        camera.targetPitch = 0.07 - scroll * 0.22;
        camera.vx = reducedMotion ? 0 : sinYaw * 0.3;
        camera.vz = reducedMotion ? 0 : cosYaw * 0.3;
    }

    // nothing holds the traveller back: the view rises over ridges and peaks and sinks into the valleys
    camera.x += camera.vx * dt;
    camera.z += camera.vz * dt;
    if (explorable) {
        const rise = (keys.has("up") ? 1 : 0) - (keys.has("down") ? 1 : 0) + pad.up - pad.down;
        camera.lift = Math.min(120, Math.max(0, camera.lift + rise * (keys.has("fast") ? 9 : 3.5) * dt));
    }
    const turn = Math.min(1, dt * 7);
    camera.yaw += (camera.targetYaw - camera.yaw) * turn;
    camera.pitch += (camera.targetPitch - camera.pitch) * turn;

    const ground = groundAt(camera.x, camera.z);
    let around = Math.max(ground, groundAt(camera.x + sinYaw * 0.9, camera.z + cosYaw * 0.9));
    for (let i = 0; i < 4; i += 1) {
        const angle = (i / 4) * Math.PI * 2;
        around = Math.max(around, groundAt(camera.x + Math.sin(angle) * 0.8, camera.z + Math.cos(angle) * 0.8) - 0.3);
    }
    // wandering, the viewer sinks down to drift at the surface of the water
    const afloat = world.height(camera.x, camera.z) < WATER_LEVEL + 0.05;
    const wandering = document.body.classList.contains("is-exploring");
    const heightAboveSurface = afloat ? (wandering ? 0.18 : 0.24) : (wandering ? 0.8 : 0.95);
    const target = (afloat ? WATER_LEVEL : around) + heightAboveSurface + camera.lift;
    camera.targetY = target;
    camera.y += (target - camera.y) * Math.min(1, dt * 2.6);
    camera.y = Math.max(camera.y, ground + (afloat && camera.lift < 0.1 ? 0.2 : 0.5));
}

function updateWalkRipples(now) {
    const moved = Math.hypot(camera.x - previousWalkPosition.x, camera.z - previousWalkPosition.z);
    previousWalkPosition = { x: camera.x, z: camera.z };
    const onWater = world.height(camera.x, camera.z) < WATER_LEVEL + 0.05;
    if (!onWater) {
        walkedOnWater = 0;
        return;
    }
    walkedOnWater += moved;
    if (walkedOnWater < 0.7 || now - lastWalkRipple < 360) {
        return;
    }
    walkRipples[nextWalkRipple] = { x: camera.x, z: camera.z, born: now };
    nextWalkRipple = (nextWalkRipple + 1) % walkRipples.length;
    walkedOnWater = 0;
    lastWalkRipple = now;
}

function rippleUniform(ripple, now) {
    const age = (now - ripple.born) / 1000;
    return age >= 1.7 ? [0, 0, 0, 0] : [ripple.x, ripple.z, Math.max(0, age), 1];
}

function isMoving() {
    return Boolean(drag) || keys.size > 0 || pad.forward + pad.back + pad.left + pad.right + pad.up + pad.down > 0 ||
        Math.abs(camera.y - camera.targetY) > 0.01 ||
        Math.abs(wheelImpulse) > 0.02 || Math.hypot(camera.vx, camera.vz) > 0.01 ||
        Math.abs(camera.targetYaw - camera.yaw) > 0.0005 || Math.abs(camera.targetPitch - camera.pitch) > 0.0005;
}

/* ---------- The live world: a real 3D landscape ---------- */
// The land is drawn as a mesh of triangles built from the very same height function the viewer walks on.
// Unlike a per-pixel landscape, this prepares in moments and runs smoothly on ordinary laptops.

const gl = canvas && explorable ? canvas.getContext("webgl", { antialias: true, alpha: false, depth: true, powerPreference: "high-performance" }) : null;

const MESH_SIZE = 256;
const MESH_REACH = 190;
const MESH_NEAR = 0.16;
const NEAR_PLANE = 0.06;
const FAR_PLANE = 420;

const COMMON_GLSL = `
precision highp float;
uniform float uTime;
uniform vec3 uSun;
uniform vec3 uMoon;
uniform float uDay;
uniform float uDusk;
uniform float uFlow;
const vec3 MIST = vec3(0.978, 0.935, 0.945);
const vec3 LIGHT = vec3(1.0, 0.965, 0.975);
const float FOCAL = 1.25;
#define WATER ${WATER_LEVEL.toFixed(3)}

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = m * p;
        a *= 0.5;
    }
    return v;
}

vec3 spectrum(float x) {
    return 0.5 + 0.5 * cos(6.2831 * (x + vec3(0.0, 0.33, 0.67)));
}

// Lucifer, in Steiner's picture, is the light-bearer: warmth, radiance and beauty that lift everything upward.
vec3 sunColour() {
    return mix(vec3(1.0, 0.6, 0.42), vec3(1.0, 0.93, 0.84), smoothstep(0.0, 0.32, uSun.y));
}

float sunVisible() {
    return smoothstep(-0.06, 0.1, uSun.y);
}

float moonVisible() {
    return smoothstep(-0.04, 0.12, uMoon.y) * (1.0 - uDay * 0.65);
}

vec3 moonColour() {
    return vec3(0.76, 0.78, 1.0);
}

vec3 sky(vec3 rd, float t) {
    vec3 horizon = mix(vec3(0.52, 0.39, 0.56), vec3(1.0, 0.91, 0.86), uDay);
    vec3 middle = mix(vec3(0.33, 0.27, 0.47), vec3(0.98, 0.85, 0.88), uDay);
    vec3 zenith = mix(vec3(0.16, 0.14, 0.3), vec3(0.88, 0.82, 0.93), uDay);
    vec3 col = mix(horizon, middle, smoothstep(-0.05, 0.25, rd.y));
    col = mix(col, zenith, smoothstep(0.25, 0.95, rd.y));

    // at dusk and dawn the whole horizon burns rose and gold, strongest beneath the sun
    vec3 flatRd = normalize(vec3(rd.x, 0.0, rd.z) + 1e-4);
    vec3 flatSun = normalize(vec3(uSun.x, 0.0, uSun.z) + 1e-4);
    float sunward = max(dot(flatRd, flatSun), 0.0);
    col = mix(col, vec3(1.0, 0.62, 0.5), uDusk * exp(-max(rd.y, 0.0) * 4.0) * (0.3 + 0.5 * pow(sunward, 2.0)));
    col += vec3(1.0, 0.45, 0.3) * uDusk * exp(-max(rd.y, 0.0) * 9.0) * pow(sunward, 4.0) * 0.35;

    // stars, trembling, in the dreaming night
    if (uDay < 0.95 && rd.y > 0.0) {
        vec3 grid = rd * 260.0;
        vec3 cell = floor(grid);
        vec3 inside = fract(grid) - 0.5;
        float star = step(0.993, hash(cell.xy + cell.z * 7.13)) * (1.0 - smoothstep(0.0, 0.42, length(inside)));
        float twinkle = 0.55 + 0.45 * sin(uTime * 2.2 + hash(cell.zy) * 40.0);
        col += vec3(1.0, 0.94, 1.0) * star * twinkle * (1.0 - uDay) * smoothstep(0.02, 0.25, rd.y) * 0.9;
    }

    // ribbons of living light drift high in the watery air
    vec2 su = rd.xz / (max(rd.y, 0.0) + 0.25);
    float flow = fbm(su * 0.35 + vec2(t * 0.6, -t * 0.2));
    float ribbon = smoothstep(0.55, 0.78, fbm(vec2(su.x * 0.3 - t * 0.7, su.y * 0.9 + flow * 1.6))) * smoothstep(0.05, 0.35, rd.y);
    col += mix(vec3(0.62, 0.5, 0.88), vec3(1.0, 0.78, 0.82), uDay) * ribbon * 0.1 + vec3(1.0, 0.86, 0.66) * ribbon * flow * 0.06 * uDay;

    // the sun as light-bearer: a radiant heart, slow wheeling rays and an iridescent aura
    float sa = acos(clamp(dot(rd, uSun), -1.0, 1.0));
    float sv = sunVisible();
    vec3 sx = normalize(cross(uSun, vec3(0.0, 1.0, 0.0)) + 1e-4);
    vec3 sy = cross(sx, uSun);
    float around = atan(dot(rd, sy), dot(rd, sx));
    float rays = pow(0.5 + 0.5 * cos(around * 12.0 + t * 1.5), 5.0) * (0.6 + 0.4 * sin(around * 5.0 - t));
    col += sunColour() * (exp(-sa * 3.6) * 0.32 + exp(-sa * 14.0) * 0.4 + rays * exp(-sa * 3.0) * 0.14) * sv;
    col += (spectrum(sa * 5.0 + t * 0.5) * 0.08 + vec3(1.0, 0.85, 0.7) * 0.05) * exp(-pow((sa - 0.15) * 26.0, 2.0)) * sv;
    col = mix(col, vec3(1.0, 0.97, 0.9), (1.0 - smoothstep(0.036, 0.046, sa)) * sv);

    // the moon as a pearl that breathes, ringed with the coloured halos every light wore in Atlantis
    float ma = acos(clamp(dot(rd, uMoon), -1.0, 1.0));
    float mv = moonVisible();
    vec3 halo = spectrum(ma * 5.6 + t * 0.6);
    float breath = 0.85 + 0.15 * sin(uTime * 0.35);
    col += (vec3(0.86, 0.84, 1.0) * exp(-ma * 4.5) * 0.22 * breath + vec3(0.95, 0.92, 1.0) * exp(-ma * 12.0) * 0.28 + LIGHT * exp(-ma * 34.0) * 0.25) * mv;
    col += (spectrum(ma * 3.0 - t * 0.3) * 0.06 + LIGHT * 0.025) * exp(-pow((ma - 0.4) * 20.0, 2.0)) * mv;
    col += ((halo * 0.1 + LIGHT * 0.05) * exp(-pow((ma - 0.13) * 30.0, 2.0)) + (halo * 0.05 + LIGHT * 0.03) * exp(-pow((ma - 0.22) * 42.0, 2.0))) * mv;
    vec3 pearl = mix(vec3(1.0, 0.99, 1.0), spectrum(rd.x * 9.0 + rd.y * 7.0 + t) * 0.15 + 0.85, 0.12);
    pearl -= vec3(0.05, 0.06, 0.02) * smoothstep(0.5, 0.75, noise((rd.xz - uMoon.xz) * 120.0));
    col = mix(col, pearl, (1.0 - smoothstep(0.04, 0.05, ma)) * mv);
    return col;
}

vec3 fogColor(vec3 rd) {
    vec3 col = mix(vec3(0.42, 0.35, 0.55), MIST, uDay);
    col += sunColour() * pow(max(dot(rd, uSun), 0.0), 7.0) * 0.32 * sunVisible();
    col = mix(col, vec3(1.0, 0.66, 0.56), uDusk * 0.45 * exp(-abs(rd.y) * 4.0));
    col += vec3(0.86, 0.84, 1.0) * (pow(max(dot(rd, uMoon), 0.0), 10.0) * 0.28 + pow(max(dot(rd, uMoon), 0.0), 60.0) * 0.25) * moonVisible();
    return col;
}

vec3 waterBody() {
    return mix(vec3(0.2, 0.16, 0.32), vec3(0.8, 0.63, 0.7), uDay) + vec3(0.2, 0.06, 0.03) * uDusk;
}

vec3 lightOn(vec3 n, vec3 base, float occlusion, float sunShade) {
    vec3 ambient = mix(vec3(0.3, 0.27, 0.45), vec3(0.86, 0.8, 0.88), uDay) * mix(vec3(1.0), vec3(1.12, 0.86, 0.8), uDusk);
    vec3 col = base * ambient * (0.5 + 0.5 * n.y) * occlusion;
    // light wraps softly around the forms, never harshly
    float sunWrap = clamp((dot(n, uSun) + 0.25) / 1.25, 0.0, 1.0);
    float moonWrap = clamp((dot(n, uMoon) + 0.2) / 1.2, 0.0, 1.0);
    col += base * sunColour() * sunWrap * 0.8 * sunVisible() * sunShade;
    col += base * moonColour() * moonWrap * 0.55 * moonVisible() * mix(1.0, sunShade, 0.6);
    return col;
}

vec3 landColour(vec3 pos, vec3 n) {
    float steep = 1.0 - n.y;
    // the rock pattern is projected from three sides and blended by the surface angle (triplanar),
    // so every face, however steep, gets undistorted rock with no seams between facets
    vec3 w = pow(abs(n), vec3(4.0));
    w /= (w.x + w.y + w.z);
    // on the faces: vertical streaks, as water and frost carve rock into couloirs and ribs
    float streakX = fbm(vec2(pos.z * 2.6, pos.y * 0.35));
    float streakZ = fbm(vec2(pos.x * 2.6, pos.y * 0.35));
    float streaks = streakX * w.x + streakZ * w.z + fbm(pos.xz * 0.9) * w.y;

    // Exposed Caucasus rock carries cool slate, limestone and mineral-stained strata.
    float stoneForm = fbm(pos.xz * 0.24);
    float stain = fbm(pos.xz * 0.78 + 7.0);
    vec3 rock = mix(vec3(0.43, 0.44, 0.46), vec3(0.31, 0.34, 0.39), smoothstep(0.28, 0.72, stoneForm));
    rock = mix(rock, vec3(0.5, 0.4, 0.44), smoothstep(0.58, 0.82, stain) * 0.3);

    // Broken horizontal layers and fractured faces are projected in the same triplanar blend as the relief.
    float strataX = noise(vec2(pos.z * 4.2 + fbm(vec2(pos.z * 0.8, pos.y * 0.28)) * 1.6, pos.y * 0.72));
    float strataZ = noise(vec2(pos.x * 4.2 + fbm(vec2(pos.x * 0.8, pos.y * 0.28)) * 1.6, pos.y * 0.72));
    float strata = strataX * w.x + strataZ * w.z + noise(pos.xz * 3.4) * w.y;
    float fractureX = noise(vec2(pos.z * 8.0 + pos.y * 0.48, pos.y * 5.2));
    float fractureZ = noise(vec2(pos.x * 8.0 + pos.y * 0.48, pos.y * 5.2));
    float fracture = fractureX * w.x + fractureZ * w.z + noise(pos.xz * 7.0) * w.y;
    float layerSeam = 1.0 - smoothstep(0.018, 0.065, abs(strata - 0.5));
    float hairline = 1.0 - smoothstep(0.01, 0.04, abs(fracture - 0.5));
    float facets = fbm(pos.xz * 1.8 + vec2(pos.y * 0.7));
    float grainX = noise(pos.zy * 18.0) * 0.65 + noise(pos.zy * 43.0) * 0.35;
    float grainY = noise(pos.xz * 18.0) * 0.65 + noise(pos.xz * 43.0) * 0.35;
    float grainZ = noise(pos.xy * 18.0) * 0.65 + noise(pos.xy * 43.0) * 0.35;
    float grain = grainX * w.x + grainY * w.y + grainZ * w.z;
    float faceDetail = smoothstep(0.15, 0.5, steep);
    rock *= mix(0.62, 1.18, smoothstep(0.3, 0.7, facets));
    rock *= 0.64 + grain * 0.55;
    float fractureMask = clamp(layerSeam * 0.62 + hairline * 0.48, 0.0, 0.86) * faceDetail;
    rock = mix(rock, rock * vec3(0.42, 0.46, 0.52), fractureMask);
    rock *= mix(1.0, 0.52 + 0.75 * smoothstep(0.32, 0.68, streaks), faceDetail);
    rock *= 0.9 + 0.16 * (grain * 2.0 - 1.0);
    // loose scree fans out at the foot of the faces
    float scree = smoothstep(0.3, 0.5, steep) * (1.0 - smoothstep(0.5, 0.7, steep)) * smoothstep(0.45, 0.75, fbm(pos.xz * 2.0));
    rock = mix(rock, vec3(0.7, 0.66, 0.68) * (0.85 + 0.3 * noise(pos.xz * 30.0)), scree * 0.55);
    rock = mix(rock, rock * vec3(1.05, 0.93, 0.98), 1.0 - smoothstep(-0.5, 1.5, pos.y));

    // Georgian alpine meadows on the gentle ground, softened by the rose of the mist
    float meadowTone = fbm(pos.xz * 0.5);
    float grassPatch = noise(pos.xz * 6.0);
    float grassGrain = noise(pos.xz * vec2(32.0, 12.0));
    vec3 meadow = mix(vec3(0.49, 0.58, 0.4), vec3(0.72, 0.69, 0.52), meadowTone);
    meadow *= 0.78 + grassPatch * 0.26 + noise(pos.xz * 40.0) * 0.08 + grassGrain * 0.07;
    meadow = mix(meadow, vec3(0.79, 0.64, 0.7), 0.18);
    float grassy = smoothstep(0.72, 0.9, n.y) * (1.0 - smoothstep(1.0, 4.4, pos.y + noise(pos.xz * 0.8) * 1.2));
    vec3 base = mix(rock, meadow, grassy);

    // dark forests of beech and fir on the lower slopes, below a wandering treeline, in clumps not sheets
    float treeline = 3.0 + noise(pos.xz * 0.2) * 1.4;
    float clumps = smoothstep(0.32, 0.6, fbm(pos.xz * 0.9) + noise(pos.xz * 4.0) * 0.3);
    float forested = (1.0 - smoothstep(treeline - 0.9, treeline, pos.y)) * smoothstep(0.45, 0.7, n.y) * (1.0 - 0.6 * smoothstep(0.93, 0.98, n.y)) * smoothstep(WATER + 0.12, WATER + 0.5, pos.y) * clumps;
    vec3 forest = mix(vec3(0.26, 0.34, 0.3), vec3(0.37, 0.39, 0.33), noise(pos.xz * 2.5));
    forest *= 0.6 + 0.55 * noise(pos.xz * 36.0);
    forest = mix(forest, vec3(0.5, 0.38, 0.45), 0.2);
    base = mix(base, forest, forested * 0.92);

    // a soft pebble shore where land meets the lake
    base = mix(base, vec3(0.8, 0.74, 0.72), (1.0 - smoothstep(WATER + 0.02, WATER + 0.25, pos.y)) * 0.7);

    // snow holds on gentle ground and fills the couloirs; steep faces stay bare and streaked
    float snowLine = 5.2 + fbm(pos.xz * 0.25) * 2.4 - smoothstep(0.55, 0.95, n.y) * 0.9;
    float snow = smoothstep(snowLine, snowLine + 0.5, pos.y) * smoothstep(0.36, 0.6, n.y);
    float couloir = smoothstep(snowLine - 0.6, snowLine + 1.2, pos.y) * (1.0 - smoothstep(0.3, 0.5, streaks)) * faceDetail;
    snow = max(snow, couloir * 0.9);
    vec3 snowColour = vec3(1.0, 0.95, 0.97) * (0.94 + 0.06 * noise(pos.xz * 12.0));
    snowColour = mix(snowColour, vec3(0.82, 0.82, 0.95), smoothstep(0.3, 0.8, steep) * 0.35);
    base = mix(base, snowColour, snow);
    // alpenglow: the snow catches fire as the sun sets
    base = mix(base, vec3(1.0, 0.62, 0.55), snow * uDusk * 0.6);
    base += vec3(1.0, 0.72, 0.84) * snow * clamp(dot(n, uSun), 0.0, 1.0) * 0.12;
    return base;
}

vec3 withFog(vec3 col, vec3 rd, float travelled, float originHeight, vec3 pos, float t) {
    float k = abs(rd.y) < 0.001 ? 0.001 : rd.y;
    float drift = 0.65 + 0.7 * fbm(pos.xz * 0.08 + vec2(t * 2.0, t));
    float valley = clamp(0.06 * exp(-originHeight * 0.3) * (1.0 - exp(-travelled * k * 0.3)) / k * drift, 0.0, 1.0);
    float haze = 1.0 - exp(-travelled * mix(0.017, 0.011, uDay));
    return mix(col, fogColor(rd), 1.0 - (1.0 - valley) * (1.0 - haze));
}
`;


// the land and the buildings share one program; in the mirror pass everything is drawn reflected in the lake
const LAND_VERTEX = `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec3 aExtra;
uniform mat4 uViewProj;
uniform vec3 uCam;
uniform float uTime;
uniform float uFlow;
uniform float uMirror;
uniform float uAspect;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vExtra;
varying vec3 vView;
void main() {
    vec3 p = aPos;
    // in the fluid moments the land itself remembers it was once liquid
    p.y += uFlow * 0.55 * sin(p.x * 0.35 + uTime * 1.3) * sin(p.z * 0.3 - uTime * 1.1);
    vPos = p;
    vNormal = aNormal;
    vExtra = aExtra;
    vec3 drawn = p;
    if (uMirror > 0.5) {
        drawn.y = 2.0 * ${WATER_LEVEL.toFixed(3)} - p.y;
    }
    vView = drawn - uCam;
    vec4 clip = uViewProj * vec4(drawn, 1.0);
    // and the air ripples, like looking up through water
    vec2 sp = clip.xy / clip.w * vec2(uAspect, 1.0) * 0.5;
    vec2 shift = uFlow * 0.0275 * vec2(sin(sp.y * 9.0 + uTime * 2.1), sin(sp.x * 7.0 - uTime * 1.7));
    clip.xy += shift * 2.0 / vec2(uAspect, 1.0) * clip.w;
    gl_Position = clip;
}`;

const LAND_FRAGMENT = `${COMMON_GLSL}
uniform vec3 uCam;
uniform float uMirror;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vExtra;
varying vec3 vView;
void main() {
    if (uMirror > 0.5 && vPos.y < WATER - 0.02) {
        discard;
    }
    float t = uTime * 0.018;
    float travelled = length(vView);
    vec3 rd = vView / travelled;
    if (uMirror > 0.5) {
        rd.y = -rd.y;
    }
    vec3 n = normalize(vNormal);
    float kind = vExtra.x;
    vec3 base;
    if (kind < 0.5) {
        // fine relief that the mesh itself is too coarse to carry: rock texture projected from three sides
        // and blended by the surface angle (triplanar), so cliffs stay crisp with no stretching or seams
        vec3 w = pow(abs(n), vec3(4.0));
        w /= (w.x + w.y + w.z);
        float e = 0.05;
        vec3 q = vPos * vec3(2.4, 3.4, 2.4);
        float hX = fbm(q.zy);
        float hY = fbm(q.xz);
        float hZ = fbm(q.xy);
        // each projection only knows the two axes it lies in
        vec3 gX = vec3(0.0, fbm(q.zy + vec2(0.0, e)) - hX, fbm(q.zy + vec2(e, 0.0)) - hX);
        vec3 gY = vec3(fbm(q.xz + vec2(e, 0.0)) - hY, 0.0, fbm(q.xz + vec2(0.0, e)) - hY);
        vec3 gZ = vec3(fbm(q.xy + vec2(e, 0.0)) - hZ, fbm(q.xy + vec2(0.0, e)) - hZ, 0.0);
        vec3 grad = (gX * w.x + gY * w.y + gZ * w.z) / e;
        grad -= n * dot(grad, n);
        n = normalize(n - grad * 0.09 * smoothstep(0.05, 0.35, 1.0 - n.y) * exp(-travelled * 0.035));
        base = landColour(vPos, n);
    } else {
        // pale stone walls under darker slate and tile roofs
        vec3 stone = mix(vec3(0.82, 0.74, 0.68), vec3(0.74, 0.66, 0.64), noise(vPos.xz * 60.0 + vPos.y * 40.0));
        base = kind > 1.5 ? vec3(0.5, 0.44, 0.5) : stone;
    }
    vec3 col = lightOn(n, base, vExtra.y, vExtra.z);
    // snow glitters and wet rock gleams where the light catches it
    vec3 bounce = reflect(rd, n);
    float snowy = smoothstep(0.9, 0.97, base.r) * smoothstep(0.86, 0.94, base.g);
    col += sunColour() * pow(max(dot(bounce, uSun), 0.0), 24.0) * (0.12 + snowy * 0.5) * sunVisible();
    col += moonColour() * pow(max(dot(bounce, uMoon), 0.0), 30.0) * (0.1 + snowy * 0.4) * moonVisible();
    if (kind > 0.5 && kind < 1.5) {
        // at night the windows of the villages and churches glow with warm lamplight
        vec2 cell = vec2((vPos.x + vPos.z) * 42.0, vPos.y * 42.0);
        float window = step(0.62, fract(cell.x)) * step(0.5, fract(cell.y)) * step(0.55, hash(floor(cell))) * (1.0 - abs(n.y));
        col += vec3(1.0, 0.7, 0.4) * window * (1.0 - uDay) * 1.3;
    }
    // the edges of every form glow, as if each carried its own light
    float rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0) * (1.0 - smoothstep(0.78, 0.95, n.y));
    col += mix(mix(vec3(0.66, 0.62, 1.0), sunColour(), uDay), spectrum(vPos.x * 0.05 + t * 0.4), 0.3) * rim * 0.16;
    // beneath the lake's surface the land sinks into the colour of the water
    if (vPos.y < WATER) {
        col = mix(col, waterBody(), clamp((WATER - vPos.y) * 1.8, 0.0, 0.92));
    }
    col = withFog(col, rd, travelled, uMirror > 0.5 ? WATER : uCam.y, vPos, t);
    gl_FragColor = vec4(col, 1.0);
}`;

const SCREEN_VERTEX = `
attribute vec2 aPosition;
void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const SKY_FRAGMENT = `${COMMON_GLSL}
uniform vec2 uRes;
uniform vec3 uForward;
uniform vec3 uRight;
uniform vec3 uUp;
uniform float uMirror;
void main() {
    vec2 sp = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float t = uTime * 0.018;
    vec3 rd = normalize(uForward * FOCAL + uRight * sp.x + uUp * sp.y);
    rd = normalize(rd + uFlow * 0.022 * (uRight * sin(sp.y * 9.0 + uTime * 2.1) + uUp * sin(sp.x * 7.0 - uTime * 1.7)));
    if (uMirror > 0.5) {
        rd.y = -rd.y;
    }
    vec3 col = sky(rd, t);
    col = mix(col, fogColor(rd), (1.0 - smoothstep(-0.04, 0.08, rd.y)) * 0.7);
    gl_FragColor = vec4(col, 1.0);
}`;

const WATER_VERTEX = `
attribute vec3 aPos;
uniform mat4 uViewProj;
uniform float uTime;
uniform float uFlow;
uniform float uAspect;
varying vec3 vPos;
void main() {
    vPos = aPos;
    vec4 clip = uViewProj * vec4(aPos, 1.0);
    vec2 sp = clip.xy / clip.w * vec2(uAspect, 1.0) * 0.5;
    vec2 shift = uFlow * 0.0275 * vec2(sin(sp.y * 9.0 + uTime * 2.1), sin(sp.x * 7.0 - uTime * 1.7));
    clip.xy += shift * 2.0 / vec2(uAspect, 1.0) * clip.w;
    gl_Position = clip;
}`;

const WATER_FRAGMENT = `${COMMON_GLSL}
uniform sampler2D uReflection;
uniform vec2 uRes;
uniform vec3 uCam;
uniform vec4 uRipple0;
uniform vec4 uRipple1;
uniform vec4 uRipple2;
uniform vec4 uRipple3;
varying vec3 vPos;
float walkingWave(vec4 wave, vec2 pos) {
    float age = wave.z;
    float distanceFromStep = length(pos - wave.xy);
    float radius = age * 2.15;
    float envelope = exp(-abs(distanceFromStep - radius) * 2.6);
    float fade = max(0.0, 1.0 - age / 1.7);
    return sin((distanceFromStep - radius) * 14.0) * envelope * fade * wave.w;
}
void main() {
    // The lake reflects the sky and landscape, while each footstep sends out a fading ring.
    float t = uTime * 0.018;
    vec3 view = vPos - uCam;
    float dist = length(view);
    vec3 rd = view / dist;
    vec2 ripple = vec2(fbm(vPos.xz * 2.2 + vec2(t * 3.0, 0.0)), fbm(vPos.xz * 2.2 - vec2(0.0, t * 2.6) + 4.0)) - 0.5;
    float footWave = walkingWave(uRipple0, vPos.xz) + walkingWave(uRipple1, vPos.xz) +
        walkingWave(uRipple2, vPos.xz) + walkingWave(uRipple3, vPos.xz);
    float footX = walkingWave(uRipple0, vPos.xz + vec2(0.06, 0.0)) +
        walkingWave(uRipple1, vPos.xz + vec2(0.06, 0.0)) +
        walkingWave(uRipple2, vPos.xz + vec2(0.06, 0.0)) +
        walkingWave(uRipple3, vPos.xz + vec2(0.06, 0.0)) - footWave;
    float footZ = walkingWave(uRipple0, vPos.xz + vec2(0.0, 0.06)) +
        walkingWave(uRipple1, vPos.xz + vec2(0.0, 0.06)) +
        walkingWave(uRipple2, vPos.xz + vec2(0.0, 0.06)) +
        walkingWave(uRipple3, vPos.xz + vec2(0.0, 0.06)) - footWave;
    float strength = 0.14 + uFlow * 0.4;
    vec3 wn = normalize(vec3(ripple.x * strength + footX * 0.9, 1.0, ripple.y * strength + footZ * 0.9));
    vec2 uv = gl_FragCoord.xy / uRes + ripple * (0.035 + uFlow * 0.06) / (1.0 + dist * 0.06);
    uv += vec2(footX, footZ) * 0.025 / (1.0 + dist * 0.08);
    vec3 reflection = texture2D(uReflection, clamp(uv, 0.002, 0.998)).rgb;
    float fresnel = 0.1 + 0.9 * pow(1.0 - max(dot(-rd, wn), 0.0), 5.0);
    vec3 col = mix(waterBody(), reflection, clamp(fresnel * 0.85 + 0.12, 0.0, 1.0));
    col += vec3(0.52, 0.39, 0.46) * abs(footWave) * 0.12;
    vec3 rr = reflect(rd, wn);
    col += sunColour() * pow(max(dot(rr, uSun), 0.0), 220.0) * 2.4 * sunVisible();
    col += vec3(0.9, 0.9, 1.0) * pow(max(dot(rr, uMoon), 0.0), 260.0) * 1.8 * moonVisible();
    col = mix(col, fogColor(rd), 1.0 - exp(-dist * mix(0.02, 0.0135, uDay)));
    gl_FragColor = vec4(col, 0.88);
}`;

// last, laid over everything: light shafts, a veil of mist that parts around the pointer and soft edges
const AIR_FRAGMENT = `${COMMON_GLSL}
uniform vec2 uRes;
uniform vec3 uForward;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uVeil;
uniform float uYaw;
uniform float uPitch;
void main() {
    vec2 sp = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float t = uTime * 0.018;
    vec3 veilColour = mix(vec3(0.5, 0.43, 0.62), MIST, uDay) + vec3(0.12, 0.04, 0.02) * uDusk;
    vec3 light = vec3(0.0);
    bool daytime = uSun.y > -0.02;
    vec3 key = daytime ? uSun : uMoon;
    float keyStrength = daytime ? sunVisible() * 0.1 : moonVisible() * 0.13;
    float depth = dot(key, uForward);
    if (depth > 0.0) {
        vec2 keyScreen = vec2(dot(key, uRight), dot(key, uUp)) / depth * FOCAL;
        vec2 toKey = sp - keyScreen;
        float shafts = smoothstep(0.42, 0.82, fbm(vec2(atan(toKey.y, toKey.x) * 3.2, t * 0.5)));
        light = (daytime ? sunColour() : vec3(0.85, 0.85, 1.0)) * shafts * exp(-length(toKey) * 2.2) * keyStrength * smoothstep(0.05, 0.18, length(toKey));
    }
    vec2 w = vec2(fbm(sp * 1.1 + vec2(t * 1.4, -t * 0.3)), fbm(sp * 1.1 + vec2(4.3, 1.7) - t));
    float veil = fbm(sp * 1.6 + w * 1.8 + vec2(t, 0.0) + vec2(uYaw * 0.6, uPitch * 0.6));
    vec2 dp = sp - (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    float clearing = exp(-dot(dp, dp) * 7.0) * uMouseStrength;
    float drift = smoothstep(0.48, 0.9, veil) * 0.22 * (1.0 - clearing * 0.85);
    float edge = smoothstep(0.55, 1.0, length(sp)) * 0.3;
    float a = 1.0 - (1.0 - drift) * (1.0 - uVeil) * (1.0 - edge);
    vec3 grain = vec3(hash(gl_FragCoord.xy + uTime)) * 3.0 / 255.0;
    gl_FragColor = vec4(veilColour * a + light * (1.0 - a) + grain, a);
}`;

// in the fluid moments colours shimmer, as through a film of water
const TINT_FRAGMENT = `${COMMON_GLSL}
uniform vec2 uRes;
void main() {
    vec2 sp = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    vec3 factor = mix(vec3(1.0), 0.82 + 0.36 * spectrum(sp.x * 0.7 + sp.y * 0.5 + uTime * 0.25), uFlow * 0.4);
    gl_FragColor = vec4(factor, 1.0);
}`;


function moveOrb() {
    if (!orb) {
        return;
    }
    orbX += (orbTargetX - orbX) * 0.12;
    orbY += (orbTargetY - orbY) * 0.12;
    orb.style.transform = `translate3d(${orbX}px, ${orbY}px, 0)`;
}

function animateRipple(now) {
    if (rippleTarget && rippleNoise) {
        const phase = (now / 1000) * 0.6;
        rippleNoise.setAttribute(
            "baseFrequency",
            `${(0.006 + Math.sin(phase) * 0.0025).toFixed(5)} ${(0.01 + Math.cos(phase * 0.8) * 0.003).toFixed(5)}`
        );
    }
}

function compileProgram(vertex, fragment) {
    const program = gl.createProgram();
    [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]].forEach(([type, source]) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.warn(gl.getShaderInfoLog(shader));
        }
        gl.attachShader(program, shader);
    });
    gl.bindAttribLocation(program, 0, "aPos");
    gl.bindAttribLocation(program, 0, "aPosition");
    gl.bindAttribLocation(program, 1, "aNormal");
    gl.bindAttribLocation(program, 2, "aExtra");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn(gl.getProgramInfoLog(program));
        return null;
    }
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i += 1) {
        const info = gl.getActiveUniform(program, i);
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program, uniforms };
}

function setUniforms(target, values) {
    gl.useProgram(target.program);
    Object.entries(values).forEach(([name, value]) => {
        const location = target.uniforms[name];
        if (!location) {
            return;
        }
        if (typeof value === "number") {
            gl.uniform1f(location, value);
        } else if (value.length === 4) {
            gl.uniform4fv(location, value);
        } else if (value.length === 2) {
            gl.uniform2fv(location, value);
        } else if (value.length === 3) {
            gl.uniform3fv(location, value);
        } else if (value.length === 16) {
            gl.uniformMatrix4fv(location, false, value);
        }
    });
}

function viewProjection(basis, aspect) {
    const { forward: f, right: r, up: u } = basis;
    const c = [camera.x, camera.y, camera.z];
    const sx = (2 * FOCAL) / aspect;
    const sy = 2 * FOCAL;
    const a = (FAR_PLANE + NEAR_PLANE) / (FAR_PLANE - NEAR_PLANE);
    const b = (-2 * FAR_PLANE * NEAR_PLANE) / (FAR_PLANE - NEAR_PLANE);
    const rows = [
        [sx * r[0], sx * r[1], sx * r[2], -sx * dot(r, c)],
        [sy * u[0], sy * u[1], sy * u[2], -sy * dot(u, c)],
        [a * f[0], a * f[1], a * f[2], -a * dot(f, c) + b],
        [f[0], f[1], f[2], -dot(f, c)]
    ];
    const matrix = new Float32Array(16);
    rows.forEach((row, i) => row.forEach((value, j) => {
        matrix[j * 4 + i] = value;
    }));
    return matrix;
}

/* the land: a grid that is fine near the viewer and widens towards the horizon, rebuilt as the viewer travels */

const gridOffsets = new Float32Array(MESH_SIZE);
for (let i = 0; i < MESH_SIZE; i += 1) {
    const u = (i / (MESH_SIZE - 1)) * 2 - 1;
    const a = Math.abs(u);
    gridOffsets[i] = Math.sign(u) * MESH_REACH * (MESH_NEAR * a + (1 - MESH_NEAR) * a * a);
}

const STRIDE = 9;
const landData = new Float32Array(MESH_SIZE * MESH_SIZE * STRIDE);
// long shadows of the ridges, measured along the light for every point of the land
const landShade = new Float32Array(MESH_SIZE * MESH_SIZE).fill(1);
let shadeJob = null;
let landJob = null;
let landCentre = null;

function startLandJob(cx, cz) {
    landJob = { cx, cz, heights: new Float32Array(MESH_SIZE * MESH_SIZE), row: 0 };
}

// heights are measured a few rows at a time, so the page never stutters while the land is rebuilt
function runLandJob(budget) {
    if (!landJob) {
        return false;
    }
    const until = performance.now() + budget;
    const { cx, cz, heights } = landJob;
    while (landJob.row < MESH_SIZE && performance.now() < until) {
        const z = cz + gridOffsets[landJob.row];
        const start = landJob.row * MESH_SIZE;
        for (let i = 0; i < MESH_SIZE; i += 1) {
            heights[start + i] = world.height(cx + gridOffsets[i], z);
        }
        landJob.row += 1;
    }
    if (landJob.row < MESH_SIZE) {
        return false;
    }
    finishLandJob();
    return true;
}

function finishLandJob() {
    const { cx, cz, heights } = landJob;
    const n = MESH_SIZE;
    // a fresh piece of land starts in full light; its shadows are measured once it is in place
    landShade.fill(1);
    shadeJob = null;
    const at = (i, j) => heights[Math.min(n - 1, Math.max(0, j)) * n + Math.min(n - 1, Math.max(0, i))];
    for (let j = 0; j < n; j += 1) {
        for (let i = 0; i < n; i += 1) {
            const h = heights[j * n + i];
            const i0 = Math.max(i - 1, 0);
            const i1 = Math.min(i + 1, n - 1);
            const j0 = Math.max(j - 1, 0);
            const j1 = Math.min(j + 1, n - 1);
            const dx = (at(i1, j) - at(i0, j)) / (gridOffsets[i1] - gridOffsets[i0]);
            const dz = (at(i, j1) - at(i, j0)) / (gridOffsets[j1] - gridOffsets[j0]);
            const length = Math.hypot(dx, 1, dz);
            // creases and hollows hold a little shadow
            const around = (at(i - 4, j) + at(i + 4, j) + at(i, j - 4) + at(i, j + 4)) / 4;
            const occlusion = Math.min(1, Math.max(0.4, 0.68 + (h - around) * 0.3));
            const o = (j * n + i) * STRIDE;
            landData[o] = cx + gridOffsets[i];
            landData[o + 1] = h;
            landData[o + 2] = cz + gridOffsets[j];
            landData[o + 3] = -dx / length;
            landData[o + 4] = 1 / length;
            landData[o + 5] = -dz / length;
            landData[o + 6] = 0;
            landData[o + 7] = occlusion;
            landData[o + 8] = landShade[j * n + i];
        }
    }
    landJob.ready = true;
}

/* long shadows: for every point of the land, walk towards the light and see whether a ridge stands in the way */

function startShadeJob(light) {
    if (!landCentre) {
        return;
    }
    shadeJob = { light: [...light], row: 0, values: new Float32Array(MESH_SIZE * MESH_SIZE) };
}

function runShadeJob(budget) {
    if (!shadeJob) {
        return false;
    }
    const until = performance.now() + budget;
    const n = MESH_SIZE;
    const [lx, ly, lz] = shadeJob.light;
    const flat = Math.hypot(lx, lz) || 1;
    const rise = ly / flat;
    const dx = lx / flat;
    const dz = lz / flat;
    // heights come from the land grid already in memory, found through the grid's own spacing
    const reach = MESH_REACH;
    const toIndex = (offset) => {
        const u = Math.min(1, Math.abs(offset) / reach);
        const a = MESH_NEAR;
        const t = (-a + Math.sqrt(a * a + 4 * (1 - a) * u)) / (2 * (1 - a));
        return ((Math.sign(offset) * t) + 1) * 0.5 * (n - 1);
    };
    const cx = landCentre.x;
    const cz = landCentre.z;
    const heightAt = (x, z) => {
        const fi = toIndex(x - cx);
        const fj = toIndex(z - cz);
        const i = Math.min(n - 2, Math.max(0, Math.floor(fi)));
        const j = Math.min(n - 2, Math.max(0, Math.floor(fj)));
        const u = Math.min(1, Math.max(0, fi - i));
        const v = Math.min(1, Math.max(0, fj - j));
        const a = landData[(j * n + i) * STRIDE + 1];
        const b = landData[(j * n + i + 1) * STRIDE + 1];
        const c = landData[((j + 1) * n + i) * STRIDE + 1];
        const d = landData[((j + 1) * n + i + 1) * STRIDE + 1];
        return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
    };
    while (shadeJob.row < n && performance.now() < until) {
        const j = shadeJob.row;
        for (let i = 0; i < n; i += 1) {
            const o = (j * n + i) * STRIDE;
            const x = landData[o];
            const h = landData[o + 1];
            const z = landData[o + 2];
            if (rise > 2.5) {
                shadeJob.values[j * n + i] = 1;
                continue;
            }
            // soft-edged: the closer a ridge comes to the line of light, the deeper the shade
            let lit = 1;
            let travel = 0.35 + Math.hypot(x - cx, z - cz) * 0.004;
            for (let s = 0; s < 20 && lit > 0.02; s += 1) {
                const line = h + 0.05 + travel * rise;
                if (line > 24) {
                    break;
                }
                const ground = heightAt(x + dx * travel, z + dz * travel);
                lit = Math.min(lit, Math.max(0, 1 - (ground - line) / (0.25 + travel * 0.08)));
                travel *= 1.32;
            }
            shadeJob.values[j * n + i] = Math.max(0, Math.min(1, lit));
        }
        shadeJob.row += 1;
    }
    if (shadeJob.row < n) {
        return false;
    }
    landShade.set(shadeJob.values);
    for (let k = 0; k < n * n; k += 1) {
        landData[k * STRIDE + 8] = landShade[k];
    }
    shadeJob = null;
    return true;
}

/* the villages and churches, built from simple solids */

function buildStructures() {
    const out = [];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const face = (points, kind, centre) => {
        let normal = cross3(sub(points[1], points[0]), sub(points[2], points[0]));
        const length = Math.hypot(...normal) || 1;
        normal = normal.map((v) => v / length);
        const middle = points.reduce((sum, p) => [sum[0] + p[0] / points.length, sum[1] + p[1] / points.length, sum[2] + p[2] / points.length], [0, 0, 0]);
        if (dot(normal, sub(middle, centre)) < 0) {
            normal = normal.map((v) => -v);
        }
        const triangles = points.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2];
        triangles.forEach((index) => out.push(...points[index], ...normal, kind, 0.95, 1));
    };
    const box = (place, c, h, kind) => {
        const corner = (sx, sy, sz) => place([c[0] + sx * h[0], c[1] + sy * h[1], c[2] + sz * h[2]]);
        const middle = place(c);
        [
            [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
            [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]],
            [[1, -1, -1], [1, -1, 1], [1, 1, 1], [1, 1, -1]],
            [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]],
            [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]
        ].forEach((quad) => face(quad.map(([x, y, z]) => corner(x, y, z)), kind, middle));
    };
    // a gabled roof running along x (or along z when turned)
    const gable = (place, c, length, width, height, alongZ) => {
        const p = (x, y, z) => place(alongZ ? [c[0] + z, c[1] + y, c[2] + x] : [c[0] + x, c[1] + y, c[2] + z]);
        const middle = p(0, height * 0.3, 0);
        face([p(-length, 0, width), p(length, 0, width), p(length, height, 0), p(-length, height, 0)], 2, middle);
        face([p(-length, 0, -width), p(length, 0, -width), p(length, height, 0), p(-length, height, 0)], 2, middle);
        face([p(length, 0, width), p(length, 0, -width), p(length, height, 0)], 1, middle);
        face([p(-length, 0, width), p(-length, 0, -width), p(-length, height, 0)], 1, middle);
    };
    const pyramid = (place, c, width, height) => {
        const p = (x, y, z) => place([c[0] + x, c[1] + y, c[2] + z]);
        const middle = p(0, height * 0.3, 0);
        const top = p(0, height, 0);
        [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]].forEach(([x0, z0, x1, z1]) => {
            face([p(x0 * width, 0, z0 * width), p(x1 * width, 0, z1 * width), top], 2, middle);
        });
    };
    const round = (place, radius, y0, y1, apex, kind) => {
        const segments = 12;
        const middle = place([0, (y0 + y1) / 2, 0]);
        for (let s = 0; s < segments; s += 1) {
            const a0 = (s / segments) * Math.PI * 2;
            const a1 = ((s + 1) / segments) * Math.PI * 2;
            const ring = (a, y, r) => place([Math.cos(a) * r, y, Math.sin(a) * r]);
            if (apex) {
                face([ring(a0, y0, radius), ring(a1, y0, radius), place([0, y1, 0])], kind, middle);
            } else {
                face([ring(a0, y0, radius), ring(a1, y0, radius), ring(a1, y1, radius), ring(a0, y1, radius)], kind, middle);
            }
        }
    };
    const turn = (angle) => (l) => [Math.cos(angle) * l[0] + Math.sin(angle) * l[2], l[1], -Math.sin(angle) * l[0] + Math.cos(angle) * l[2]];

    // Ushguli-like villages: Svan towers rising among low stone houses with gabled slate roofs,
    // each building set down on the ground where it actually stands and the houses turned along a lane
    const groundUnder = (x, z) => Math.max(world.height(x, z), WATER_LEVEL);
    const random = (seed) => {
        const s = Math.sin(seed * 127.1) * 43758.5453;
        return s - Math.floor(s);
    };
    world.villages.forEach(([vx, , vz, seed]) => {
        const lane = seed * 2.3;
        const towers = 3 + Math.floor(random(seed) * 3);
        for (let k = 0; k < towers; k += 1) {
            const a = k * 2.4 + seed;
            const radius = 0.08 + k * 0.12;
            const ox = vx + Math.cos(a) * radius;
            const oz = vz + Math.sin(a) * radius;
            const oy = groundUnder(ox, oz);
            const height = 0.3 + random(seed + k * 3.7) * 0.2;
            const place = (l) => [ox + l[0], oy + l[1], oz + l[2]];
            box(place, [0, height * 0.5 - 0.3, 0], [0.03, height * 0.5 + 0.3, 0.03], 1);
            pyramid(place, [0, height, 0], 0.033, 0.045);
        }
        const houses = 9 + Math.floor(random(seed + 9.1) * 7);
        for (let k = 0; k < houses; k += 1) {
            const along = (random(seed + k * 1.31) - 0.5) * 1.6;
            const across = (random(seed + k * 2.77) - 0.5) * 0.9;
            const ox = vx + Math.cos(lane) * along - Math.sin(lane) * across;
            const oz = vz + Math.sin(lane) * along + Math.cos(lane) * across;
            if (world.height(ox, oz) < WATER_LEVEL + 0.05) {
                continue;
            }
            const oy = groundUnder(ox, oz);
            const rotate = turn(-lane + (random(seed + k) > 0.5 ? Math.PI / 2 : 0) + (random(seed + k * 5.3) - 0.5) * 0.3);
            const scale = 0.8 + random(seed + k * 7.9) * 0.45;
            const place = (l) => {
                const r = rotate(l);
                return [ox + r[0] * scale, oy + r[1] * scale, oz + r[2] * scale];
            };
            box(place, [0, -0.065, 0], [0.06, 0.135, 0.045], 1);
            gable(place, [0, 0.07, 0], 0.066, 0.05, 0.045, false);
        }
    });

    // Georgian cross-dome churches: a cross-shaped body under gabled roofs, a tall drum and a conical dome
    world.churches.forEach(([cx, cy, cz, angle]) => {
        const rotate = turn(angle);
        const place = (l) => {
            const r = rotate(l);
            return [cx + r[0] / 1.6, cy + r[1] / 1.6, cz + r[2] / 1.6];
        };
        box(place, [0, 0.04, 0], [0.24, 0.18, 0.085], 1);
        box(place, [0, 0.04, 0], [0.085, 0.18, 0.2], 1);
        gable(place, [0, 0.22, 0], 0.24, 0.095, 0.075, false);
        gable(place, [0, 0.22, 0], 0.2, 0.095, 0.075, true);
        round(place, 0.065, 0.22, 0.48, false, 1);
        round(place, 0.078, 0.48, 0.66, true, 2);
        box(place, [0.42, 0.06, 0.14], [0.035, 0.2, 0.035], 1);
        pyramid((l) => place([l[0] + 0.42, l[1], l[2] + 0.14]), [0, 0.26, 0], 0.04, 0.05);
    });
    return new Float32Array(out);
}


function startWorld() {
    const land = compileProgram(LAND_VERTEX, LAND_FRAGMENT);
    const skyProgram = compileProgram(SCREEN_VERTEX, SKY_FRAGMENT);
    const waterProgram = compileProgram(WATER_VERTEX, WATER_FRAGMENT);
    const air = compileProgram(SCREEN_VERTEX, AIR_FRAGMENT);
    const tint = compileProgram(SCREEN_VERTEX, TINT_FRAGMENT);
    if (!land || !skyProgram || !waterProgram || !air || !tint) {
        return false;
    }

    // buffers: the land grid, its triangle indices, the buildings, the lake and a screen-covering triangle
    const landBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, landBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, landData.byteLength, gl.DYNAMIC_DRAW);
    const indices = new Uint16Array((MESH_SIZE - 1) * (MESH_SIZE - 1) * 6);
    let k = 0;
    for (let j = 0; j < MESH_SIZE - 1; j += 1) {
        for (let i = 0; i < MESH_SIZE - 1; i += 1) {
            const a = j * MESH_SIZE + i;
            const b = a + 1;
            const c = a + MESH_SIZE;
            const d = c + 1;
            indices.set([a, c, b, b, c, d], k);
            k += 6;
        }
    }
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const structureData = buildStructures();
    const structureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, structureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, structureData, gl.STATIC_DRAW);
    const structureCount = structureData.length / STRIDE;

    const waterBuffer = gl.createBuffer();
    const screenBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const uploadLand = () => {
        gl.bindBuffer(gl.ARRAY_BUFFER, landBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, landData);
        landCentre = { x: landJob.cx, z: landJob.cz };
        const w = WATER_LEVEL;
        const r = MESH_REACH;
        const x = landCentre.x;
        const z = landCentre.z;
        gl.bindBuffer(gl.ARRAY_BUFFER, waterBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x - r, w, z - r, x + r, w, z - r, x + r, w, z + r, x - r, w, z - r, x + r, w, z + r, x - r, w, z + r]), gl.DYNAMIC_DRAW);
        landJob = null;
    };

    // the lake's reflection is drawn first into its own picture, at half the size
    const reflection = { texture: gl.createTexture(), depth: gl.createRenderbuffer(), frame: gl.createFramebuffer(), width: 0, height: 0 };
    const sizeReflection = () => {
        reflection.width = Math.max(2, Math.round(canvas.width / 3));
        reflection.height = Math.max(2, Math.round(canvas.height / 3));
        gl.bindTexture(gl.TEXTURE_2D, reflection.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, reflection.width, reflection.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, reflection.frame);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, reflection.texture, 0);
        gl.bindRenderbuffer(gl.RENDERBUFFER, reflection.depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, reflection.width, reflection.height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, reflection.depth);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, null);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, reflection.width, reflection.height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, reflection.depth);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const bindMesh = (buffer, withNormals) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(0);
        if (withNormals) {
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, STRIDE * 4, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, STRIDE * 4, 12);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 3, gl.FLOAT, false, STRIDE * 4, 24);
        } else {
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
            gl.disableVertexAttribArray(1);
            gl.disableVertexAttribArray(2);
        }
    };
    const drawScreen = (target, values) => {
        setUniforms(target, values);
        gl.bindBuffer(gl.ARRAY_BUFFER, screenBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
        gl.disableVertexAttribArray(1);
        gl.disableVertexAttribArray(2);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const drawLand = (values) => {
        setUniforms(land, values);
        bindMesh(landBuffer, true);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        if (structureCount) {
            bindMesh(structureBuffer, true);
            gl.drawArrays(gl.TRIANGLES, 0, structureCount);
        }
    };

    // Keep the landscape crisp while leaving room for the performance probe to adapt on slower devices.
    const qualityFloor = compact ? 0.72 : 0.82;
    let quality = Math.max(qualityFloor, Math.min(window.devicePixelRatio || 1, 1.5) * (compact ? 0.8 : 1));
    const veil = Number(document.body.dataset.veil || 0);
    const startTime = performance.now();
    let last = startTime;
    let scroll = 0;
    let pending = false;
    let stopped = false;

    // The live world must prove it runs smoothly before it is shown. Each trial frame is timed until the
    // graphics card has truly finished it; if it is too slow even when drawn small, the still remains.
    const probe = { samples: [], tries: 0, done: false };
    const lastShade = { light: null, dirty: true };
    const slow = { since: 0, cost: 0, sampled: 0 };
    const pixel = new Uint8Array(4);
    let qualityReductions = 0;

    function showWorld() {
        probe.done = true;
        canvas.hidden = false;
        canvas.style.transition = "opacity 1.5s ease";
        canvas.style.opacity = "1";
    }

    function judge(cost) {
        probe.samples.push(cost);
        if (cost > 220 && quality > qualityFloor) {
            quality = Math.max(qualityFloor, quality * 0.7);
            resize();
        }
        if (probe.samples.length < 6) {
            return;
        }
        const sorted = [...probe.samples.slice(1)].sort((a, b) => a - b);
        const typical = sorted[Math.floor(sorted.length / 2)];
        probe.samples = [];
        probe.tries += 1;
        if (typical < 30 || probe.tries >= 3) {
            showWorld();
        } else {
            quality = Math.max(qualityFloor, quality * Math.max(0.5, Math.sqrt(26 / typical)));
            resize();
        }
    }

    function resize() {
        canvas.width = Math.max(2, Math.round(window.innerWidth * quality));
        canvas.height = Math.max(2, Math.round(window.innerHeight * quality));
        sizeReflection();
    }

    function frame(now) {
        pending = false;
        if (document.hidden || stopped) {
            return;
        }
        // until the first land is ready there is nothing to draw
        if (!landCentre) {
            requestDraw();
            return;
        }
        // once shown, the world keeps watching itself; if its own frames grow too heavy for long, it steps aside.
        // (A background or minimised window slows every page's clock, so the work itself is measured, not the gaps.)
        if (probe.done && slow.cost > 90 && !isMoving() && !landJob && !shadeJob) {
            slow.since = slow.since || now;
            if (now - slow.since > 4000 && quality > qualityFloor && qualityReductions < 4) {
                quality = Math.max(qualityFloor, quality * 0.75);
                qualityReductions += 1;
                slow.since = now;
                resize();
            }
        } else if (probe.done) {
            slow.since = 0;
        }
        const dt = Math.min(0.15, (now - last) / 1000);
        last = now;
        const seconds = reducedMotion ? 30 : (now - startTime) / 1000 + 30;
        const range = document.documentElement.scrollHeight - window.innerHeight;
        scroll += ((range > 0 ? window.scrollY / range : 0) - scroll) * 0.05;
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
        pointer.strength += (pointer.active - pointer.strength) * 0.04;
        updateLiquid(now, seconds);
        updateCamera(dt, seconds, Math.min(1, Math.max(0, scroll)));
        updateWalkRipples(now);

        // the land follows the traveller, rebuilt quietly in the background
        if (!landJob && Math.hypot(camera.x - landCentre.x, camera.z - landCentre.z) > 8) {
            startLandJob(Math.round((camera.x + camera.vx * 2) / 2) * 2, Math.round((camera.z + camera.vz * 2) / 2) * 2);
        }
        if (landJob && runLandJob(5)) {
            uploadLand();
            lastShade.dirty = true;
        }

        const light = skyState();
        // shadows follow whichever light is in the sky, re-measured as it moves
        const key = light.sun[1] > -0.02 ? light.sun : light.moon;
        if (!landJob && !shadeJob && key[1] > 0.01 && (!lastShade.light || lastShade.dirty || Math.hypot(key[0] - lastShade.light[0], key[1] - lastShade.light[1], key[2] - lastShade.light[2]) > 0.035)) {
            startShadeJob(key);
            lastShade.light = [...key];
            lastShade.dirty = false;
        }
        if (shadeJob && runShadeJob(4)) {
            gl.bindBuffer(gl.ARRAY_BUFFER, landBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, landData);
        }
        placeBorjgali(light, now - startTime);
        moveOrb();

        const basis = cameraBasis();
        const aspect = canvas.width / canvas.height;
        const shared = {
            uTime: seconds,
            uSun: light.sun,
            uMoon: light.moon,
            uDay: light.day,
            uDusk: light.dusk,
            uFlow: liquid.value,
            uCam: [camera.x, camera.y, camera.z],
            uRipple0: rippleUniform(walkRipples[0], now),
            uRipple1: rippleUniform(walkRipples[1], now),
            uRipple2: rippleUniform(walkRipples[2], now),
            uRipple3: rippleUniform(walkRipples[3], now),
            uViewProj: viewProjection(basis, aspect),
            uAspect: aspect,
            uForward: basis.forward,
            uRight: basis.right,
            uUp: basis.up,
            uMouse: [pointer.x, pointer.y],
            uMouseStrength: pointer.strength,
            uVeil: veil,
            uYaw: camera.yaw,
            uPitch: camera.pitch
        };
        const drawStart = performance.now();

        // the mirror world, seen in the lake
        gl.bindFramebuffer(gl.FRAMEBUFFER, reflection.frame);
        gl.viewport(0, 0, reflection.width, reflection.height);
        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        drawScreen(skyProgram, { ...shared, uRes: [reflection.width, reflection.height], uMirror: 1 });
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        drawLand({ ...shared, uMirror: 1 });

        // the world itself
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.disable(gl.DEPTH_TEST);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        drawScreen(skyProgram, { ...shared, uRes: [canvas.width, canvas.height], uMirror: 0 });
        gl.enable(gl.DEPTH_TEST);
        drawLand({ ...shared, uMirror: 0 });

        // the lake, with its reflection
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        setUniforms(waterProgram, { ...shared, uRes: [canvas.width, canvas.height] });
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, reflection.texture);
        gl.uniform1i(waterProgram.uniforms.uReflection, 0);
        bindMesh(waterBuffer, false);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.depthMask(true);
        gl.disable(gl.DEPTH_TEST);

        // the air: shafts of light, the drifting veil and soft edges
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        drawScreen(air, { ...shared, uRes: [canvas.width, canvas.height] });
        if (liquid.value > 0.01) {
            gl.blendFunc(gl.DST_COLOR, gl.ZERO);
            drawScreen(tint, { ...shared, uRes: [canvas.width, canvas.height] });
        }
        gl.disable(gl.BLEND);

        if (!probe.done) {
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            judge(performance.now() - drawStart);
        } else if (now - slow.sampled > 2000 && !isMoving() && !landJob && !shadeJob) {
            // every two seconds, one frame is timed to its true end on the graphics card
            slow.sampled = now;
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            slow.cost = slow.cost * 0.5 + (performance.now() - drawStart) * 0.5;
        }
        animateRipple(now);

        if (!reducedMotion || isMoving() || !probe.done || landJob) {
            requestDraw();
        }
    }

    requestDraw = () => {
        if (!pending && !stopped) {
            pending = true;
            requestAnimationFrame(frame);
        }
    };

    resize();
    window.addEventListener("resize", () => {
        if (!stopped) {
            resize();
            requestDraw();
        }
    });
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            last = performance.now();
            requestDraw();
        }
    });
    if (reducedMotion) {
        window.addEventListener("scroll", requestDraw, { passive: true });
    }

    startLandJob(Math.round(camera.x / 2) * 2, Math.round(camera.z / 2) * 2);
    // the first land is built in quick slices of its own, so it never waits on how often the page repaints
    const buildFirst = () => {
        if (stopped || landCentre) {
            return;
        }
        if (runLandJob(28)) {
            uploadLand();
            requestDraw();
            return;
        }
        window.setTimeout(buildFirst, 0);
    };
    buildFirst();
    requestDraw();
    return true;
}

function useFallback() {
    document.documentElement.classList.add("no-webgl");
    if (canvas) {
        canvas.hidden = true;
    }
    if (borjgali) {
        borjgali.style.left = "72%";
        borjgali.style.top = "22%";
    }

    if (!reducedMotion && (orb || rippleNoise)) {
        const fallbackFrame = (now) => {
            pointer.x += (pointer.tx - pointer.x) * 0.05;
            pointer.y += (pointer.ty - pointer.y) * 0.05;
            moveOrb();
            animateRipple(now);
            requestAnimationFrame(fallbackFrame);
        };
        requestAnimationFrame(fallbackFrame);
    }
}

if (!explorable || !gl) {
    useFallback();
} else {
    canvas.style.opacity = "0";
    // if the graphics card gives up, the live world quietly fades back to the still
    canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        canvas.style.opacity = "0";
        canvas.hidden = true;
    });
    window.setTimeout(() => {
        let started = false;
        try {
            started = startWorld();
        } catch (error) {
            console.warn(error);
        }
        if (!started) {
            useFallback();
        }
    }, 300);
}
