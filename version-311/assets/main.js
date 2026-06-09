document.addEventListener("DOMContentLoaded", function () {
  var menuButton = document.querySelector("[data-mobile-toggle]");
  var mobileMenu = document.querySelector("[data-mobile-menu]");

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", function () {
      mobileMenu.classList.toggle("is-open");
    });
  }

  var carousel = document.querySelector("[data-hero-carousel]");

  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
    var previous = carousel.querySelector("[data-hero-prev]");
    var next = carousel.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function showSlide(index) {
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

    function startTimer() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 6500);
    }

    if (previous) {
      previous.addEventListener("click", function () {
        showSlide(current - 1);
        startTimer();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        showSlide(current + 1);
        startTimer();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        showSlide(Number(dot.getAttribute("data-hero-dot")));
        startTimer();
      });
    });

    showSlide(0);
    startTimer();
  }

  var localSearch = document.querySelector("[data-local-search]");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter-type]"));
  var resultCount = document.querySelector("[data-result-count]");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));
  var activeFilter = { type: "all", value: "all" };

  function cardMatchesFilter(card) {
    if (activeFilter.type === "all") {
      return true;
    }

    var value = String(activeFilter.value || "").toLowerCase();

    if (activeFilter.type === "genre") {
      return String(card.getAttribute("data-genre") || "").toLowerCase().indexOf(value) !== -1;
    }

    if (activeFilter.type === "region") {
      return String(card.getAttribute("data-region") || "").toLowerCase().indexOf(value) !== -1;
    }

    if (activeFilter.type === "type") {
      return String(card.getAttribute("data-type") || "").toLowerCase().indexOf(value) !== -1;
    }

    return true;
  }

  function applyLocalFilters() {
    var query = localSearch ? localSearch.value.trim().toLowerCase() : "";
    var visible = 0;

    cards.forEach(function (card) {
      var haystack = String(card.getAttribute("data-search") || "").toLowerCase();
      var match = (!query || haystack.indexOf(query) !== -1) && cardMatchesFilter(card);
      card.hidden = !match;

      if (match) {
        visible += 1;
      }
    });

    if (resultCount) {
      resultCount.textContent = visible ? "显示 " + visible + " 部" : "暂无匹配影片";
    }
  }

  if (localSearch && cards.length) {
    localSearch.addEventListener("input", applyLocalFilters);
    applyLocalFilters();
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      filterButtons.forEach(function (item) {
        item.classList.remove("chip-active");
      });

      button.classList.add("chip-active");
      activeFilter = {
        type: button.getAttribute("data-filter-type"),
        value: button.getAttribute("data-filter-value")
      };

      applyLocalFilters();
    });
  });

  var searchInput = document.querySelector("[data-search-page-input]");
  var searchResults = document.querySelector("[data-search-results]");
  var searchStatus = document.querySelector("[data-search-status]");

  if (searchInput && searchResults && Array.isArray(window.SITE_MOVIES)) {
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q") || "";
    searchInput.value = initialQuery;

    function renderSearchResults(query) {
      var normalizedQuery = query.trim().toLowerCase();
      var results = window.SITE_MOVIES.filter(function (movie) {
        return !normalizedQuery || movie.searchText.toLowerCase().indexOf(normalizedQuery) !== -1;
      }).slice(0, 240);

      searchResults.innerHTML = results.map(function (movie) {
        return [
          '<article class="movie-card">',
          '  <a href="' + movie.url + '" class="movie-link">',
          '    <div class="poster-wrap">',
          '      <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + ' 封面" loading="lazy">',
          '      <span class="poster-year">' + escapeHtml(movie.year) + '</span>',
          '      <span class="poster-play">播放</span>',
          '    </div>',
          '    <div class="movie-info">',
          '      <h3>' + escapeHtml(movie.title) + '</h3>',
          '      <p>' + escapeHtml(movie.oneLine) + '</p>',
          '      <div class="movie-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>',
          '      <div class="tag-row"><span>' + escapeHtml(movie.genre) + '</span></div>',
          '    </div>',
          '  </a>',
          '</article>'
        ].join("");
      }).join("");

      if (searchStatus) {
        if (normalizedQuery) {
          searchStatus.textContent = "“" + query + "” 找到 " + results.length + " 条结果";
        } else {
          searchStatus.textContent = "输入关键词可搜索片库，当前展示前 " + results.length + " 条内容";
        }
      }
    }

    searchInput.addEventListener("input", function () {
      renderSearchResults(searchInput.value);
    });

    renderSearchResults(initialQuery);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }
});
