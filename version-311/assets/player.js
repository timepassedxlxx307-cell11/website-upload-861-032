document.addEventListener("DOMContentLoaded", function () {
  var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));

  players.forEach(function (shell) {
    var video = shell.querySelector("video");
    var button = shell.querySelector(".play-button");
    var sourceUrl = video ? video.getAttribute("data-src") : "";
    var hlsInstance = null;
    var isReady = false;
    var pendingPlay = false;

    function tryPlay() {
      if (!video) {
        return;
      }

      shell.classList.add("is-playing");

      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          if (!video.paused) {
            return;
          }

          shell.classList.remove("is-playing");
        });
      }
    }

    function prepareVideo() {
      if (!video || !sourceUrl || isReady) {
        return;
      }

      isReady = true;

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hlsInstance.loadSource(sourceUrl);
        hlsInstance.attachMedia(video);

        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          if (pendingPlay) {
            tryPlay();
          }
        });

        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            hlsInstance.destroy();
            hlsInstance = null;
            video.src = sourceUrl;

            if (pendingPlay) {
              tryPlay();
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
      } else {
        video.src = sourceUrl;
      }
    }

    function playVideo() {
      pendingPlay = true;
      prepareVideo();

      if (!window.Hls || !window.Hls.isSupported()) {
        tryPlay();
      } else if (video && video.readyState > 1) {
        tryPlay();
      } else {
        shell.classList.add("is-playing");
      }
    }

    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        playVideo();
      });
    }

    shell.addEventListener("click", function (event) {
      if (event.target === button || button && button.contains(event.target)) {
        return;
      }

      if (!isReady) {
        playVideo();
      }
    });

    if (video) {
      video.addEventListener("play", function () {
        shell.classList.add("is-playing");
      });

      video.addEventListener("pause", function () {
        pendingPlay = false;

        if (!video.ended) {
          shell.classList.remove("is-playing");
        }
      });

      video.addEventListener("ended", function () {
        pendingPlay = false;
        shell.classList.remove("is-playing");
      });

      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    }
  });
});
