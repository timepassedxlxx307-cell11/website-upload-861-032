
(function() {
  var toggle = document.querySelector('[data-mobile-toggle]');
  var panel = document.querySelector('[data-mobile-panel]');
  if (toggle && panel) {
    toggle.addEventListener('click', function() {
      panel.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;
    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function(slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }
    dots.forEach(function(dot, i) {
      dot.addEventListener('click', function() {
        show(i);
      });
    });
    window.setInterval(function() {
      show(current + 1);
    }, 5200);
  }

  var input = document.querySelector('[data-filter-input]');
  var list = document.querySelector('[data-card-list]');
  var empty = document.querySelector('[data-empty-state]');
  if (input && list) {
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    if (initial) {
      input.value = initial;
    }
    function filter() {
      var q = input.value.trim().toLowerCase();
      var cards = Array.prototype.slice.call(list.querySelectorAll('[data-card]'));
      var visible = 0;
      cards.forEach(function(card) {
        var text = ((card.getAttribute('data-title') || '') + ' ' + (card.getAttribute('data-meta') || '') + ' ' + card.textContent).toLowerCase();
        var hit = !q || text.indexOf(q) !== -1;
        card.style.display = hit ? '' : 'none';
        if (hit) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }
    input.addEventListener('input', filter);
    filter();
  }
}());
