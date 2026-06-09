(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function setupMenu() {
    var button = document.querySelector('[data-menu-button]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  function setupSearch() {
    var input = document.querySelector('[data-search-input]');
    if (!input) {
      return;
    }
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var value = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
        card.classList.toggle('is-hidden', q && value.indexOf(q) === -1);
      });
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function setupTabs() {
    var root = document.querySelector('[data-tabs]');
    if (!root) {
      return;
    }
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-tab-button]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[data-tab-panel]'));
    function activate(name) {
      buttons.forEach(function (button) {
        button.classList.toggle('active', button.getAttribute('data-tab-button') === name);
      });
      panels.forEach(function (panel) {
        panel.classList.toggle('active', panel.getAttribute('data-tab-panel') === name);
      });
    }
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        activate(button.getAttribute('data-tab-button'));
      });
    });
    if (buttons[0]) {
      activate(buttons[0].getAttribute('data-tab-button'));
    }
  }

  window.CinemaPlayer = function (selector, url) {
    var video = document.querySelector(selector);
    if (!video || !url) {
      return;
    }
    var root = video.closest('[data-player-root]');
    var button = root ? root.querySelector('[data-play-button]') : null;
    var loaded = false;
    var hls = null;

    function attach() {
      if (loaded) {
        return;
      }
      loaded = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          maxBufferLength: 30,
          backBufferLength: 30
        });
        hls.loadSource(url);
        hls.attachMedia(video);
      } else {
        video.src = url;
      }
    }

    function start() {
      attach();
      video.controls = true;
      if (root) {
        root.classList.add('is-playing');
      }
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener('click', start);
    }
    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener('play', function () {
      if (root) {
        root.classList.add('is-playing');
      }
    });
    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  ready(function () {
    setupMenu();
    setupSearch();
    setupHero();
    setupTabs();
  });
})();
