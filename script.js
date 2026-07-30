const TOTAL_FRAMES = 300;
const images = [];
let loadedCount = 0;

const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');

const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const progressBar = document.getElementById('progress-bar');

let targetFrame = 0;
let currentFrame = 0;
const LERP_FACTOR = 0.12; // Controls scroll momentum / inertia smoothness

// Resize canvas to match screen resolution and device pixel ratio
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  render();
}

window.addEventListener('resize', resizeCanvas);

// Image frame filename generator
function getFrameUrl(index) {
  const frameNum = String(index + 1).padStart(3, '0');
  return `Images/ezgif-frame-${frameNum}.jpg`;
}

// Preload all 300 image frames
function preloadImages() {
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFrameUrl(i);

    img.onload = () => {
      loadedCount++;
      const progress = Math.round((loadedCount / TOTAL_FRAMES) * 100);
      if (loaderText) loaderText.innerText = `Loading ${progress}%`;
      if (progressBar) progressBar.style.width = `${progress}%`;

      if (loadedCount === TOTAL_FRAMES) {
        onAllImagesLoaded();
      }
    };

    img.onerror = () => {
      loadedCount++;
      if (loadedCount === TOTAL_FRAMES) {
        onAllImagesLoaded();
      }
    };

    images.push(img);
  }
}

function onAllImagesLoaded() {
  if (loader) loader.classList.add('hidden');
  resizeCanvas();
  updateTargetFrame();
  requestAnimationFrame(animLoop);
}

// Draw specified frame onto canvas with full-bleed cover scaling
function renderFrame(index) {
  const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(index)));
  const img = images[frameIndex];
  if (!img || !img.complete) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgWidth = img.width;
  const imgHeight = img.height;

  // Cover aspect ratio mode (fills viewport completely without black bars)
  const ratio = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
  const drawWidth = imgWidth * ratio;
  const drawHeight = imgHeight * ratio;

  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = (canvasHeight - drawHeight) / 2;

  ctx.drawImage(img, 0, 0, imgWidth, imgHeight, offsetX, offsetY, drawWidth, drawHeight);
}

// Map scroll position to target frame index (0 to 299)
// The animation sequence ends cleanly right at the footer
function updateTargetFrame() {
  const footer = document.querySelector('.site-footer');
  const canvasContainer = document.querySelector('.canvas-container');
  let maxScroll;

  if (footer) {
    // Animation completes cleanly right as we approach the footer
    maxScroll = footer.offsetTop - window.innerHeight;

    // Cut/fade out canvas animation when arriving at the footer
    if (canvasContainer) {
      if (window.scrollY >= maxScroll - 10) {
        canvasContainer.style.opacity = '0';
      } else {
        canvasContainer.style.opacity = '1';
      }
    }
  } else {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  }

  if (maxScroll <= 0) return;

  const scrollFraction = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
}

window.addEventListener('scroll', updateTargetFrame, { passive: true });

// Continuous RAF linear interpolation loop
function animLoop() {
  const diff = targetFrame - currentFrame;
  if (Math.abs(diff) > 0.001) {
    currentFrame += diff * LERP_FACTOR;
    renderFrame(currentFrame);
  } else if (currentFrame !== targetFrame) {
    currentFrame = targetFrame;
    renderFrame(currentFrame);
  }

  requestAnimationFrame(animLoop);
}

function render() {
  renderFrame(currentFrame);
}

preloadImages();
