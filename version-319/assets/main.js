(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
            return;
        }
        document.addEventListener("DOMContentLoaded", fn);
    }

    function setupMenu() {
        var button = document.querySelector(".menu-toggle");
        var nav = document.querySelector(".site-nav");
        if (!button || !nav) {
            return;
        }
        button.addEventListener("click", function () {
            var open = nav.classList.toggle("open");
            button.setAttribute("aria-expanded", open ? "true" : "false");
        });
    }

    function setupHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var next = hero.querySelector("[data-hero-next]");
        var prev = hero.querySelector("[data-hero-prev]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("active", slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("active", dotIndex === index);
            });
        }

        function start() {
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5000);
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            start();
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                restart();
            });
        });

        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                restart();
            });
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                restart();
            });
        }

        start();
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function setupCategoryFilter() {
        var toolbar = document.querySelector("[data-filter-toolbar]");
        var grid = document.querySelector("[data-filter-grid]");
        if (!toolbar || !grid) {
            return;
        }
        var input = toolbar.querySelector("[data-card-search]");
        var buttons = Array.prototype.slice.call(toolbar.querySelectorAll("[data-filter-type]"));
        var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
        var empty = document.querySelector("[data-empty-state]");
        var activeType = "all";

        function apply() {
            var keyword = normalize(input ? input.value : "");
            var visible = 0;
            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute("data-title"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-type"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-genre")
                ].join(" "));
                var typeValue = normalize(card.getAttribute("data-type"));
                var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                var matchType = activeType === "all" || typeValue.indexOf(normalize(activeType)) !== -1;
                var show = matchKeyword && matchType;
                card.style.display = show ? "" : "none";
                if (show) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle("visible", visible === 0);
            }
        }

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                buttons.forEach(function (item) {
                    item.classList.remove("active");
                });
                button.classList.add("active");
                activeType = button.getAttribute("data-filter-type") || "all";
                apply();
            });
        });

        if (input) {
            input.addEventListener("input", apply);
        }
    }

    function cardTemplate(item) {
        var tagHtml = (item.tags || []).slice(0, 3).map(function (tag) {
            return "<span>" + escapeHtml(tag) + "</span>";
        }).join("");
        return [
            "<article class=\"movie-card compact-card\">",
            "<a href=\"" + escapeHtml(item.url) + "\" aria-label=\"观看 " + escapeHtml(item.title) + "\">",
            "<div class=\"poster-frame\"><img src=\"" + escapeHtml(item.image) + "\" alt=\"" + escapeHtml(item.title) + "\" loading=\"lazy\"><span class=\"card-badge\">" + escapeHtml(item.type) + "</span><span class=\"card-play\">▶</span></div>",
            "<div class=\"card-body\"><div class=\"card-meta\"><span>" + escapeHtml(item.year) + "</span><span>" + escapeHtml(item.region) + "</span></div><h2>" + escapeHtml(item.title) + "</h2><p>" + escapeHtml(item.oneLine) + "</p><div class=\"tag-row\">" + tagHtml + "</div></div>",
            "</a>",
            "</article>"
        ].join("");
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function setupSearchPage() {
        var page = document.querySelector("[data-search-page]");
        if (!page || !window.movieSearchIndex) {
            return;
        }
        var input = page.querySelector("[data-site-search]");
        var typeFilter = page.querySelector("[data-type-filter]");
        var yearFilter = page.querySelector("[data-year-filter]");
        var results = page.querySelector("[data-search-results]");
        var empty = page.querySelector("[data-search-empty]");
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get("q") || "";
        if (input) {
            input.value = initialQuery;
        }

        function render() {
            var q = normalize(input ? input.value : "");
            var type = typeFilter ? typeFilter.value : "all";
            var year = yearFilter ? yearFilter.value : "all";
            var items = window.movieSearchIndex.filter(function (item) {
                var text = normalize([item.title, item.region, item.type, item.year, item.genre, item.oneLine, (item.tags || []).join(" ")].join(" "));
                var matchQuery = !q || text.indexOf(q) !== -1;
                var matchType = type === "all" || normalize(item.type).indexOf(normalize(type)) !== -1;
                var matchYear = year === "all" || String(item.year) === String(year);
                return matchQuery && matchType && matchYear;
            }).slice(0, 120);
            if (results) {
                results.innerHTML = items.map(cardTemplate).join("");
            }
            if (empty) {
                empty.classList.toggle("visible", items.length === 0);
            }
        }

        [input, typeFilter, yearFilter].forEach(function (element) {
            if (element) {
                element.addEventListener("input", render);
                element.addEventListener("change", render);
            }
        });

        if (initialQuery) {
            render();
        }
    }

    ready(function () {
        setupMenu();
        setupHero();
        setupCategoryFilter();
        setupSearchPage();
    });
})();

function setupMoviePlayer(url) {
    var video = document.getElementById("movieVideo");
    var overlay = document.getElementById("playerOverlay");
    if (!video || !url) {
        return;
    }

    function hideOverlay() {
        if (overlay) {
            overlay.classList.add("hidden");
        }
    }

    function playVideo() {
        hideOverlay();
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
            promise.catch(function () {});
        }
    }

    if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (!data || !data.fatal) {
                return;
            }
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
            } else {
                hls.destroy();
            }
        });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
    } else {
        video.src = url;
    }

    if (overlay) {
        overlay.addEventListener("click", playVideo);
    }
    video.addEventListener("click", function () {
        if (video.paused) {
            playVideo();
        }
    });
    video.addEventListener("play", hideOverlay);
}
