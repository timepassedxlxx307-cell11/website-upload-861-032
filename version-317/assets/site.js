(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-menu]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var active = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === active);
      });
    }

    function play() {
      stop();
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(active - 1);
        play();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(active + 1);
        play();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        play();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", play);
    show(0);
    play();
  }

  function initSearchForms() {
    Array.prototype.slice.call(document.querySelectorAll("[data-search-form]")).forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        var value = input ? input.value.trim() : "";
        if (!value) {
          event.preventDefault();
          window.location.href = "./search.html";
        }
      });
    });
  }

  function normalize(value) {
    return (value || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
  }

  function initFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll("[data-filter-scope]"));
    if (!scopes.length) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    var pageInput = document.getElementById("search-page-input");
    var localInput = document.querySelector("[data-local-filter]");
    var clearButton = document.querySelector("[data-filter-clear]");

    if (pageInput) {
      pageInput.value = query;
    }
    if (localInput) {
      localInput.value = query;
    }

    function apply() {
      var term = normalize(localInput ? localInput.value : query);
      var anyVisible = false;
      scopes.forEach(function (scope) {
        Array.prototype.slice.call(scope.querySelectorAll("[data-card]")).forEach(function (card) {
          var haystack = normalize([
            card.getAttribute("data-title"),
            card.getAttribute("data-tags"),
            card.getAttribute("data-year"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type")
          ].join(" "));
          var visible = !term || haystack.indexOf(term) !== -1;
          card.style.display = visible ? "" : "none";
          anyVisible = anyVisible || visible;
        });
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-empty-state]")).forEach(function (empty) {
        empty.classList.toggle("show", !anyVisible);
      });
    }

    if (localInput) {
      localInput.addEventListener("input", apply);
    }
    if (clearButton) {
      clearButton.addEventListener("click", function () {
        if (localInput) {
          localInput.value = "";
        }
        if (pageInput) {
          pageInput.value = "";
        }
        apply();
      });
    }
    apply();
  }

  function initPlayers() {
    Array.prototype.slice.call(document.querySelectorAll("[data-player]")).forEach(function (box) {
      var video = box.querySelector("video");
      var button = box.querySelector("[data-play-button]");
      var stream = box.getAttribute("data-stream");
      var loaded = false;
      var hls = null;

      function start() {
        if (!video || !stream) {
          return;
        }
        box.classList.add("is-playing");
        if (!loaded) {
          loaded = true;
          if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hls.loadSource(stream);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
            hls.on(window.Hls.Events.ERROR, function (event, data) {
              if (!data || !data.fatal || !hls) {
                return;
              }
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else {
                hls.destroy();
                hls = null;
              }
            });
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = stream;
            video.addEventListener("loadedmetadata", function () {
              video.play().catch(function () {});
            }, { once: true });
          } else {
            video.src = stream;
            video.play().catch(function () {});
          }
        } else {
          video.play().catch(function () {});
        }
      }

      if (button) {
        button.addEventListener("click", start);
      }
      if (video) {
        video.addEventListener("click", function () {
          if (!loaded) {
            start();
          }
        });
        video.addEventListener("play", function () {
          box.classList.add("is-playing");
        });
        video.addEventListener("pause", function () {
          if (loaded) {
            box.classList.remove("is-playing");
          }
        });
      }
      window.addEventListener("beforeunload", function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initSearchForms();
    initFilters();
    initPlayers();
  });
})();
