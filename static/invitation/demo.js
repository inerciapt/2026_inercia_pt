class AudioPlayer {
  constructor(ctx, buffer, safetyMargin = 0.01) {
    this.ctx = ctx;
    this.buffer = buffer;
    this.safetyMargin = safetyMargin;

    this.source = null;
    this.startTime = 0;
    this.offset = 0;
    this.isPlaying = false;
    this.onEnded = null;
  }

  _createSource(offset, when) {
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.ctx.destination);
    source.onended = () => {
      if (this.isPlaying && this.getCurrentTime() >= this.buffer.duration) {
        this.offset = this.buffer.duration;
        this.isPlaying = false;
        if (this.onEnded) this.onEnded();
      }
    };
    source.start(when, offset);
    return source;
  }

  play() {
    if (this.isPlaying) return;

    const when = this.ctx.currentTime + this.safetyMargin;
    this.source = this._createSource(this.offset, when);
    this.startTime = when;
    this.isPlaying = true;
  }

  pause() {
    if (!this.isPlaying) return;

    this.source.stop();
    this.offset = this.getCurrentTime();
    this.isPlaying = false;
  }

  stop() {
    if (this.source) {
      this.source.stop();
    }
    this.offset = 0;
    this.isPlaying = false;
  }

  seek(seconds) {
    if (seconds < 0) seconds = 0;
    if (seconds > this.buffer.duration) seconds = this.buffer.duration;

    this.offset = seconds;
    if (this.isPlaying) {
      this.source.stop();
      this.isPlaying = false;
      this.play();
    }
  }

  getCurrentTime() {
    if (this.isPlaying) {
      return this.offset + (this.ctx.currentTime - this.startTime);
    }
    return this.offset;
  }
}

async function fetchWithProgress(url, onProgress) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  let receivedLength = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
    receivedLength += value.length;
    onProgress(receivedLength);
  }
  const chunksAll = new Uint8Array(receivedLength);
  let position = 0;
  for (let chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }
  return chunksAll.buffer;
}

let dataLoaded = 0;
let audioLoaded = 0;
const TOTAL_SIZE = 15180216 + 17818556; // audio + data size

const progressBar = document.createElement('div');
progressBar.className = 'progress-bar';
document.body.appendChild(progressBar);
const progressInner = document.createElement('span');
progressBar.appendChild(progressInner);
const progressText = document.createElement('div');
progressText.className = 'progress-text';
progressBar.appendChild(progressText);

function updateProgress() {
  const progress = Math.min((dataLoaded + audioLoaded) / TOTAL_SIZE, 1);
  progressText.innerText = `${(progress * 100).toFixed(0)}%`;
  progressInner.style.width = `${progress * 99}%`;
}

const mp3buffer = fetchWithProgress('tempo.mp3', (bytesLoaded) => {
  audioLoaded = bytesLoaded;
  updateProgress();
});

// Decode using a separate audio context so we can do it immediately instead of waiting
// for user interaction
const decodedAudio = mp3buffer.then(rawBuffer => {
  const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
  return tempCtx.decodeAudioData(rawBuffer).finally(() => tempCtx.close());
});

var Module = {
  setStatus: function (text) {
    const bytesLoadedStr = text.match(/\d+/);
    if (bytesLoadedStr) {
      const bytesLoaded = parseInt(bytesLoadedStr[0]);
      dataLoaded = bytesLoaded;
      updateProgress();
    }
  },
  onAbort() {
    progressInner.style.display = 'none';
    progressBar.style.borderColor = '#f00';
    progressText.innerHTML = "Loading failed.<br>If you're launching from a local HTML file, you'll need to either run a local web server or <a href='https://dev.to/dengel29/loading-local-files-in-firefox-and-chrome-m9f'>disable your browser's local file security settings</a>.";
  },
  // Emscripten ready callback
  onRuntimeInitialized() {
    const demoWrapper = document.getElementById('demo-wrapper');
    const canvas = document.getElementById('canvas');
    const subtitlesElem = document.getElementById('subtitles');

    // Make canvas not pixelated
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.floor(canvas.clientWidth * dpr);
      const displayHeight = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
    }
    window.addEventListener('resize', resize);

    // Ensure that the audio is loaded and decoded before showing the start button
    decodedAudio.then(() => {
      document.body.removeChild(progressBar);
      // How To Play Audio In Modern Browsers Who Hate Playing Audio
      const startButton = document.createElement('button');
      startButton.textContent = "▶︎ DEMO";
      document.body.appendChild(startButton); // Start playing audio and pass the audio context to C++ side

      const isPartyVersion = document.body.classList.contains('party-version');

      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'options';
      if (isPartyVersion) {
        optionsDiv.style.visibility = 'hidden';
      }
      document.body.appendChild(optionsDiv);

      const fullscreenOptionRow = document.createElement('div');
      optionsDiv.appendChild(fullscreenOptionRow);
      const fullscreenInput = document.createElement('input');
      fullscreenInput.type = 'checkbox';
      fullscreenInput.id = 'fullscreen';
      /* only add the fullscreen checkbox if the browser supports it */
      if (document.fullscreenEnabled) {
        fullscreenInput.checked = true;
        fullscreenOptionRow.appendChild(fullscreenInput);
        const fullscreenLabel = document.createElement('label');
        fullscreenLabel.textContent = 'Fullscreen';
        fullscreenLabel.htmlFor = 'fullscreen';
        fullscreenOptionRow.appendChild(fullscreenLabel);
      }

      const msaaOptionRow = document.createElement('div');
      optionsDiv.appendChild(msaaOptionRow);
      const msaaInput = document.createElement('input');
      msaaInput.type = 'checkbox';
      msaaInput.id = 'msaa';
      msaaInput.checked = true;
      msaaOptionRow.appendChild(msaaInput);
      const msaaLabel = document.createElement('label');
      msaaLabel.textContent = 'Anti-aliasing';
      msaaLabel.htmlFor = 'msaa';
      msaaOptionRow.appendChild(msaaLabel);

      let player = null;

      startButton.addEventListener('click', async () => {
        startButton.style.display = 'none';
        optionsDiv.style.display = 'none';

        if (player) {
          // Replay: seek to start and play again
          player.seek(0);
          player.play();
          return;
        }

        // First click: set up everything
        Module.msaaEnabled = isPartyVersion || msaaInput.checked;
        document.body.style.display = 'block';
        demoWrapper.style.display = 'block';

        if (fullscreenInput.checked || isPartyVersion) {
          demoWrapper.addEventListener("fullscreenchange", () => {
            if (document.fullscreenElement) {
              // hide cursor on entering fullscreen
              demoWrapper.style.cursor = 'none';
            } else {
              // show cursor on exiting fullscreen
              demoWrapper.style.cursor = 'default';
            }
          });
          window.location.hash = "webdemoexe_fullscreen";
          await demoWrapper.requestFullscreen();
        }

        // Init audio context, which is now legal
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Play audio
        const buf = await decodedAudio; // this await should be instant since we already waited for decoding before showing the button
        player = new AudioPlayer(ctx, buf);

        // Pass player to C++ side
        Module.audioPlayer = player;

        // Resize canvas
        resize();

        // Show replay button over canvas when audio ends
        player.onEnded = () => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          startButton.textContent = "▶︎ REPLAY";
          startButton.style.display = '';
          startButton.style.width = 'auto';
        };

        // Position button over the canvas for replay
        // Towards top of image, should not cover logo ideally
        startButton.style.position = 'absolute';
        startButton.style.zIndex = '10';
        startButton.style.left = '50%';
        startButton.style.top = '10%';
        startButton.style.transform = 'translate(-50%, -10%)';
        startButton.style.margin = '0';
        demoWrapper.appendChild(startButton);

        // Lets go
        player.play();
      });
    });
  }
};
