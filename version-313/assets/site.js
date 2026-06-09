const MovieSite = (() => {
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function initMobileMenu() {
    const toggle = qs('[data-menu-toggle]');
    const panel = qs('[data-mobile-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', () => {
      panel.classList.toggle('is-open');
    });
  }

  function initHero() {
    const carousel = qs('[data-hero-carousel]');
    if (!carousel) {
      return;
    }
    const slides = qsa('.hero-slide', carousel);
    const dots = qsa('[data-hero-dot]', carousel);
    if (!slides.length) {
      return;
    }
    let index = 0;
    let timer = null;
    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle('hero-slide-active', i === index);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
    };
    const play = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => show(index + 1), 5200);
    };
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        show(i);
        play();
      });
    });
    show(0);
    play();
  }

  function initFilters() {
    qsa('[data-filter-input]').forEach((input) => {
      const gridId = input.getAttribute('data-filter-input');
      const grid = document.getElementById(gridId);
      const typeSelect = qs(`[data-type-filter="${gridId}"]`);
      if (!grid) {
        return;
      }
      const cards = qsa('.movie-card', grid);
      const apply = () => {
        const keyword = input.value.trim().toLowerCase();
        const type = typeSelect ? typeSelect.value.trim() : '';
        cards.forEach((card) => {
          const text = [
            card.dataset.title,
            card.dataset.region,
            card.dataset.genre,
            card.dataset.year,
            card.dataset.type
          ].join(' ').toLowerCase();
          const typeOk = !type || card.dataset.type === type;
          const keywordOk = !keyword || text.includes(keyword);
          card.style.display = typeOk && keywordOk ? '' : 'none';
        });
      };
      input.addEventListener('input', apply);
      if (typeSelect) {
        typeSelect.addEventListener('change', apply);
      }
    });
  }

  function initPlayer(source) {
    const video = qs('#movie-player');
    const overlay = qs('#player-overlay');
    if (!video || !overlay || !source) {
      return;
    }
    let attached = false;
    let hls = null;
    const attach = () => {
      if (attached) {
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      }
      attached = true;
    };
    const start = () => {
      attach();
      overlay.classList.add('is-hidden');
      video.controls = true;
      const result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          overlay.classList.remove('is-hidden');
        });
      }
    };
    overlay.addEventListener('click', start);
    video.addEventListener('click', () => {
      if (!attached || video.paused) {
        start();
      } else {
        video.pause();
      }
    });
    window.addEventListener('beforeunload', () => {
      if (hls) {
        hls.destroy();
      }
    });
  }

  function makeCard(item) {
    const tags = (item.tags || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
    return `
<article class="movie-card" data-title="${escapeHtml(item.title)}" data-region="${escapeHtml(item.region)}" data-genre="${escapeHtml(item.genre)}" data-year="${escapeHtml(item.year)}" data-type="${escapeHtml(item.type)}">
  <a class="card-cover" href="./${escapeHtml(item.file)}" aria-label="${escapeHtml(item.title)} 在线观看">
    <img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.title)}" loading="lazy">
    <span class="card-play">▶</span>
  </a>
  <div class="card-body">
    <h3><a href="./${escapeHtml(item.file)}">${escapeHtml(item.title)}</a></h3>
    <p class="card-line">${escapeHtml(item.oneLine)}</p>
    <div class="card-meta">
      <span>${escapeHtml(item.year)}</span>
      <span>${escapeHtml(item.region)}</span>
      <span>${escapeHtml(item.type)}</span>
    </div>
    <div class="tag-row">${tags}</div>
  </div>
</article>`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function initSearchPage() {
    const input = qs('#search-page-input');
    const typeSelect = qs('#search-type-filter');
    const results = qs('#search-results');
    if (!input || !results || !Array.isArray(window.SEARCH_INDEX)) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('q') || '';
    input.value = initial;
    const render = () => {
      const keyword = input.value.trim().toLowerCase();
      const type = typeSelect ? typeSelect.value : '';
      const matches = window.SEARCH_INDEX.filter((item) => {
        const haystack = [
          item.title,
          item.region,
          item.genre,
          item.type,
          item.year,
          item.oneLine,
          (item.tags || []).join(' ')
        ].join(' ').toLowerCase();
        const keywordOk = !keyword || haystack.includes(keyword);
        const typeOk = !type || item.type === type;
        return keywordOk && typeOk;
      }).slice(0, 120);
      results.innerHTML = matches.length ? matches.map(makeCard).join('') : '<div class="empty-results">没有找到匹配的影片，请尝试其他关键词。</div>';
    };
    input.addEventListener('input', render);
    if (typeSelect) {
      typeSelect.addEventListener('change', render);
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initHero();
    initFilters();
  });

  return {
    initPlayer,
    initSearchPage
  };
})();
