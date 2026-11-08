const spreadImage = document.querySelector(".zin-book-spread");
const pageCount = document.querySelector(".zin-book-page-count");
const previousButton = document.querySelector("[data-book-previous]");
const nextButton = document.querySelector("[data-book-next]");
const totalPages = 48;
const pageViews = [{ src: "cover.webp", firstPage: 1, lastPage: 1, type: "cover" }];

for (let firstPage = 2; firstPage <= totalPages; firstPage += 2) {
    const lastPage = Math.min(firstPage + 1, totalPages);
    const type = firstPage === lastPage ? "final-page" : "spread";
    const src = type === "spread"
        ? `spread-${String(pageViews.length).padStart(2, "0")}.webp`
        : "final-page.webp";
    pageViews.push({ src, firstPage, lastPage, type });
}

let currentView = 0;

if (new URLSearchParams(window.location.search).has("embedded")) {
    document.body.classList.add("is-embedded");
}

function showPageView(index) {
    currentView = Math.max(0, Math.min(index, pageViews.length - 1));
    const view = pageViews[currentView];
    const description = view.type === "cover"
        ? `Cover · Page ${view.firstPage} of ${totalPages}`
        : view.type === "final-page"
            ? `Final page · Page ${view.firstPage} of ${totalPages}`
            : `Pages ${view.firstPage}–${view.lastPage} of ${totalPages}`;

    spreadImage.src = `assets/optimized/docs/zin-book-spreads/${view.src}`;
    spreadImage.alt = `${description} of the ZIN project book`;
    pageCount.textContent = description;
    previousButton.disabled = currentView === 0;
    nextButton.disabled = currentView === pageViews.length - 1;
}

previousButton.addEventListener("click", () => showPageView(currentView - 1));
nextButton.addEventListener("click", () => showPageView(currentView + 1));

document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
    }
    if (event.key === "ArrowLeft") {
        showPageView(currentView - 1);
    } else if (event.key === "ArrowRight") {
        showPageView(currentView + 1);
    }
});
