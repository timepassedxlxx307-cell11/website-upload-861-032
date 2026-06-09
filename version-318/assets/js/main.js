(function () {
    'use strict';

    var HLS_CDN = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    var hlsLoadingPromise = null;

    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function loadHlsScript() {
        if (window.Hls) {
            return Promise.resolve(window.Hls);
        }

        if (hlsLoadingPromise) {
            return hlsLoadingPromise;
        }

        hlsLoadingPromise = new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = HLS_CDN;
            script.async = true;
            script.onload = function () {
                resolve(window.Hls);
            };
            script.onerror = function () {
                reject(new Error('hls.js 加载失败'));
            };
            document.head.appendChild(script);
        });

        return hlsLoadingPromise;
    }

    function initMobileMenu() {
        var toggle = document.querySelector('[data-mobile-menu-toggle]');
        var menu = document.querySelector('[data-mobile-menu]');

        if (!toggle || !menu) {
            return;
        }

        toggle.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function initHeroSlider() {
        var slider = document.querySelector('[data-hero-slider]');

        if (!slider) {
            return;
        }

        var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
        var prev = slider.querySelector('[data-hero-prev]');
        var next = slider.querySelector('[data-hero-next]');
        var current = 0;
        var timer = null;

        if (slides.length < 2) {
            return;
        }

        function show(index) {
            current = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        function nextSlide() {
            show(current + 1);
        }

        function restart() {
            window.clearInterval(timer);
            timer = window.setInterval(nextSlide, 6000);
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                restart();
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                show(index);
                restart();
            });
        });

        restart();
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function initFilters() {
        var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
        var activeCategory = 'all';
        var query = '';

        if (!scopes.length || !cards.length) {
            return;
        }

        function applyFilter() {
            cards.forEach(function (card) {
                var cardText = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-category'),
                    card.getAttribute('data-tags'),
                    card.getAttribute('data-year')
                ].join(' '));
                var category = card.getAttribute('data-category');
                var matchQuery = !query || cardText.indexOf(query) !== -1;
                var matchCategory = activeCategory === 'all' || category === activeCategory;

                card.classList.toggle('is-hidden', !(matchQuery && matchCategory));
            });
        }

        scopes.forEach(function (scope) {
            var input = scope.querySelector('[data-search-input]');
            var buttons = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-category]'));
            var availableCategories = cards.reduce(function (set, card) {
                set[card.getAttribute('data-category')] = true;
                return set;
            }, {});

            buttons.forEach(function (button) {
                var value = button.getAttribute('data-filter-category') || 'all';

                if (value !== 'all' && !availableCategories[value]) {
                    button.hidden = true;
                }
            });

            if (input) {
                input.addEventListener('input', function () {
                    query = normalize(input.value);
                    applyFilter();
                });
            }

            buttons.forEach(function (button) {
                button.addEventListener('click', function () {
                    activeCategory = button.getAttribute('data-filter-category') || 'all';
                    buttons.forEach(function (item) {
                        item.classList.toggle('active', item === button);
                    });
                    applyFilter();
                });
            });
        });
    }

    function initImages() {
        var images = Array.prototype.slice.call(document.querySelectorAll('.poster-wrap img, .hero-image, .detail-backdrop'));

        images.forEach(function (image) {
            image.addEventListener('error', function () {
                var wrap = image.closest('.poster-wrap');
                image.style.opacity = '0';

                if (wrap) {
                    wrap.classList.add('image-missing');
                }
            });
        });
    }

    function setMessage(shell, text) {
        var message = shell.querySelector('[data-player-message]');

        if (message) {
            message.textContent = text || '';
        }
    }

    function playNative(video, source, shell) {
        video.src = source;
        return video.play().catch(function () {
            setMessage(shell, '浏览器阻止了自动播放，请再次点击播放器。');
        });
    }

    function playWithHls(video, source, shell) {
        return loadHlsScript().then(function (Hls) {
            if (!Hls || !Hls.isSupported()) {
                setMessage(shell, '当前浏览器暂不支持该 HLS 播放源。');
                return;
            }

            if (video._hlsInstance) {
                video._hlsInstance.destroy();
            }

            var hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });

            video._hlsInstance = hls;
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                video.play().catch(function () {
                    setMessage(shell, '播放已准备好，请再次点击播放器。');
                });
            });
            hls.on(Hls.Events.ERROR, function (event, data) {
                if (data && data.fatal) {
                    setMessage(shell, '播放源连接异常，请刷新后重试。');
                }
            });
        }).catch(function () {
            setMessage(shell, '播放器组件加载失败，请检查网络后重试。');
        });
    }

    function initPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

        players.forEach(function (shell) {
            var video = shell.querySelector('video[data-src]');
            var button = shell.querySelector('[data-play-button]');

            if (!video || !button) {
                return;
            }

            button.addEventListener('click', function () {
                var source = video.getAttribute('data-src');

                if (!source) {
                    setMessage(shell, '当前影片没有可用播放源。');
                    return;
                }

                shell.classList.add('is-playing');
                setMessage(shell, '正在初始化播放源…');

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    playNative(video, source, shell).then(function () {
                        setMessage(shell, '');
                    });
                } else {
                    playWithHls(video, source, shell).then(function () {
                        setMessage(shell, '');
                    });
                }
            });
        });
    }

    ready(function () {
        initMobileMenu();
        initHeroSlider();
        initFilters();
        initImages();
        initPlayers();
    });
})();
