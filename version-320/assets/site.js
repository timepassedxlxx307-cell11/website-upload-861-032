function ready(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

function setMobileMenu() {
  const button = document.querySelector(".mobile-toggle");
  const panel = document.querySelector(".mobile-panel");
  if (!button || !panel) {
    return;
  }

  button.addEventListener("click", function () {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
  });
}

function setHeroSlider() {
  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const dots = Array.from(document.querySelectorAll(".hero-dot"));
  if (!slides.length) {
    return;
  }

  let current = 0;
  let timer = null;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("active", slideIndex === current);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("active", dotIndex === current);
    });
  }

  function start() {
    timer = window.setInterval(function () {
      show(current + 1);
    }, 5200);
  }

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      window.clearInterval(timer);
      show(Number(dot.dataset.slide || 0));
      start();
    });
  });

  show(0);
  start();
}

function setLocalFilters() {
  const inputs = Array.from(document.querySelectorAll(".filter-input"));
  inputs.forEach(function (input) {
    const target = document.querySelector(input.dataset.filterTarget);
    if (!target) {
      return;
    }

    const cards = Array.from(target.querySelectorAll(".movie-card-link"));
    input.addEventListener("input", function () {
      const query = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        const haystack = (card.dataset.filter || "").toLowerCase();
        card.hidden = query.length > 0 && !haystack.includes(query);
      });
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("q") || "";
}

function createSearchCard(item) {
  const badges = [item.region, item.type, item.year]
    .filter(Boolean)
    .map(function (piece) {
      return '<span class="badge">' + escapeHtml(piece) + '</span>';
    })
    .join("");

  return '<a class="movie-card-link" href="' + escapeHtml(item.url) + '">' +
    '<article class="movie-card">' +
      '<div class="poster-wrap">' +
        '<img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
        '<span class="poster-year">' + escapeHtml(item.year) + '</span>' +
      '</div>' +
      '<div class="movie-card-body">' +
        '<div class="badge-row">' + badges + '</div>' +
        '<h3>' + escapeHtml(item.title) + '</h3>' +
        '<p>' + escapeHtml(item.oneLine) + '</p>' +
      '</div>' +
    '</article>' +
  '</a>';
}

function setSearchPage() {
  const results = document.getElementById("search-results");
  const input = document.getElementById("search-input");
  if (!results || !input || !Array.isArray(window.SEARCH_INDEX)) {
    return;
  }

  const query = readQuery();
  input.value = query;

  function render(value) {
    const keyword = value.trim().toLowerCase();
    const list = keyword
      ? window.SEARCH_INDEX.filter(function (item) {
          return item.matchText.includes(keyword);
        })
      : window.SEARCH_INDEX.slice(0, 80);

    results.innerHTML = list.map(createSearchCard).join("");
  }

  render(query);
}

function initMoviePlayer(videoId, overlayId, url) {
  const video = document.getElementById(videoId);
  const overlay = document.getElementById(overlayId);
  if (!video || !overlay || !url) {
    return;
  }

  let attached = false;

  function attach() {
    if (attached) {
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({ enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      video.hlsInstance = hls;
    } else {
      video.src = url;
    }

    attached = true;
  }

  function play() {
    attach();
    overlay.classList.add("is-hidden");
    video.controls = true;
    const promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {});
    }
  }

  overlay.addEventListener("click", play);
  video.addEventListener("click", function () {
    if (video.paused) {
      play();
    }
  });
}

ready(function () {
  setMobileMenu();
  setHeroSlider();
  setLocalFilters();
  setSearchPage();
});
