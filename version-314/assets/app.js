(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    ready(function () {
        var toggle = document.querySelector(".mobile-toggle");
        var mobileNav = document.querySelector(".mobile-nav");
        if (toggle && mobileNav) {
            toggle.addEventListener("click", function () {
                mobileNav.classList.toggle("is-open");
            });
        }

        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
        var prev = document.querySelector(".hero-prev");
        var next = document.querySelector(".hero-next");
        var current = 0;
        var timer = null;

        function setHero(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        function startHero() {
            if (timer) {
                window.clearInterval(timer);
            }
            if (slides.length > 1) {
                timer = window.setInterval(function () {
                    setHero(current + 1);
                }, 5600);
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                setHero(Number(dot.getAttribute("data-hero-dot")) || 0);
                startHero();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                setHero(current - 1);
                startHero();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                setHero(current + 1);
                startHero();
            });
        }

        startHero();

        var input = document.querySelector(".filter-input");
        var selects = Array.prototype.slice.call(document.querySelectorAll(".filter-select"));
        var reset = document.querySelector(".filter-reset");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));

        function normalize(value) {
            return String(value || "").toLowerCase().trim();
        }

        function applyFilters() {
            var query = normalize(input ? input.value : "");
            var activeSelects = selects.map(function (select) {
                return {
                    field: select.getAttribute("data-filter-field"),
                    value: normalize(select.value)
                };
            });

            cards.forEach(function (card) {
                var keywords = normalize(card.getAttribute("data-keywords") || card.textContent);
                var matchesQuery = !query || keywords.indexOf(query) !== -1;
                var matchesSelects = activeSelects.every(function (item) {
                    if (!item.value) {
                        return true;
                    }
                    return normalize(card.getAttribute("data-" + item.field)).indexOf(item.value) !== -1;
                });
                card.classList.toggle("is-filtered-out", !(matchesQuery && matchesSelects));
            });
        }

        if (input) {
            input.addEventListener("input", applyFilters);
        }

        selects.forEach(function (select) {
            select.addEventListener("change", applyFilters);
        });

        if (reset) {
            reset.addEventListener("click", function () {
                if (input) {
                    input.value = "";
                }
                selects.forEach(function (select) {
                    select.value = "";
                });
                applyFilters();
            });
        }
    });
})();

function initMoviePlayer(sourceUrl) {
    var video = document.querySelector(".movie-player");
    var button = document.querySelector(".player-start");
    var shell = document.querySelector(".player-shell");
    var loaded = false;
    var hlsInstance = null;

    if (!video || !sourceUrl) {
        return;
    }

    function bindSource() {
        if (loaded) {
            return;
        }
        loaded = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = sourceUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsInstance.loadSource(sourceUrl);
            hlsInstance.attachMedia(video);
        } else {
            video.src = sourceUrl;
        }
    }

    function beginPlayback() {
        bindSource();
        if (button) {
            button.classList.add("is-hidden");
        }
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
            promise.catch(function () {});
        }
    }

    if (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            beginPlayback();
        });
    }

    if (shell) {
        shell.addEventListener("click", function (event) {
            if (event.target === video && !loaded) {
                beginPlayback();
            }
        });
    }

    video.addEventListener("play", function () {
        if (button) {
            button.classList.add("is-hidden");
        }
    });

    video.addEventListener("ended", function () {
        if (button) {
            button.classList.remove("is-hidden");
        }
    });

    window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
