/* ═══════════════════════════════════════════════════════════════════
   ONECONVERT — ADOBE SCAN MOBILE INTERACTIVE JAVASCRIPT APPLICATION
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- STATE MANAGEMENT ---
  const state = {
    pages: [], // Array of captured page objects
    currentPageIndex: 0,
    currentFilter: 'magic',
    activeMode: 'document',
    docTitle: 'Scan 26 Jul 2026',
    isAutoShutter: true,
    autoTimer: null
  };

  // --- DOM ELEMENTS ---
  const screens = {
    camera: document.getElementById('screen-camera'),
    review: document.getElementById('screen-review'),
    library: document.getElementById('screen-library')
  };

  const guidanceText = document.getElementById('guidance-text');
  const shutterBtn = document.getElementById('btn-shutter');
  const pageCountBadge = document.getElementById('page-count-badge');
  const reviewPageCard = document.getElementById('review-page-card');
  const inputDocTitle = document.getElementById('input-doc-title');
  const thumbnailList = document.getElementById('thumbnail-list');
  const currentPageNum = document.getElementById('current-page-num');
  const totalPagesNum = document.getElementById('total-pages-num');

  // --- NAVIGATION ---
  function showScreen(screenName) {
    Object.keys(screens).forEach(key => {
      screens[key].classList.remove('active');
    });
    screens[screenName].classList.add('active');
  }

  // --- CAMERA SCANNER LOGIC ---
  function capturePage() {
    // Shutter animation
    const shutterInner = shutterBtn.querySelector('.shutter-inner');
    shutterInner.style.transform = 'scale(0.85)';
    shutterInner.style.backgroundColor = 'var(--brand-cyan)';

    setTimeout(() => {
      shutterInner.style.transform = 'scale(1)';
      shutterInner.style.backgroundColor = 'var(--brand-primary)';
    }, 150);

    // Create page record
    const newPage = {
      id: Date.now(),
      filter: state.currentFilter,
      rotation: 0
    };

    state.pages.push(newPage);
    updateStackBadge();

    // Visual Feedback
    guidanceText.textContent = "Page Captured!";
    setTimeout(() => {
      guidanceText.textContent = "Hold steady... Capturing";
    }, 1200);
  }

  function updateStackBadge() {
    pageCountBadge.textContent = state.pages.length;
    
    // Stack animation
    const stack1 = document.getElementById('stack-card-1');
    const stack2 = document.getElementById('stack-card-2');
    const stack3 = document.getElementById('stack-card-3');

    if (state.pages.length > 0) {
      stack1.style.background = '#FFFFFF';
    }
    if (state.pages.length > 1) {
      stack2.style.opacity = '0.8';
    }
    if (state.pages.length > 2) {
      stack3.style.opacity = '0.5';
    }
  }

  // Shutter button click
  shutterBtn.addEventListener('click', capturePage);

  // Review Stack click (Go to Review Screen)
  document.getElementById('btn-review-stack').addEventListener('click', () => {
    if (state.pages.length === 0) {
      // If 0 pages, automatically capture 1 for demo
      capturePage();
    }
    openReviewScreen();
  });

  // FAB Scan button on Library screen
  document.getElementById('fab-start-scan').addEventListener('click', () => {
    showScreen('camera');
  });

  document.getElementById('btn-close-camera').addEventListener('click', () => {
    showScreen('library');
  });

  // --- REVIEW SCREEN LOGIC ---
  function openReviewScreen() {
    renderThumbnails();
    updateReviewStage();
    showScreen('review');
  }

  function renderThumbnails() {
    thumbnailList.innerHTML = '';
    state.pages.forEach((page, index) => {
      const thumb = document.createElement('div');
      thumb.className = `thumb-item ${index === state.currentPageIndex ? 'active' : ''}`;
      thumb.dataset.index = index;
      thumb.innerHTML = `
        <div style="font-size:10px; font-weight:700; color:#0066FF; padding:4px;">p.${index + 1}</div>
      `;

      thumb.addEventListener('click', () => {
        state.currentPageIndex = index;
        renderThumbnails();
        updateReviewStage();
      });

      thumbnailList.appendChild(thumb);
    });

    totalPagesNum.textContent = state.pages.length;
  }

  function updateReviewStage() {
    currentPageNum.textContent = state.currentPageIndex + 1;
    const currentPage = state.pages[state.currentPageIndex];

    if (currentPage) {
      // Apply filter class
      reviewPageCard.className = `review-page-card filter-${currentPage.filter || 'magic'}`;
      reviewPageCard.style.transform = `rotate(${currentPage.rotation || 0}deg)`;
    }
  }

  document.getElementById('btn-add-more-pages').addEventListener('click', () => {
    showScreen('camera');
  });

  document.getElementById('btn-back-camera').addEventListener('click', () => {
    showScreen('camera');
  });

  // --- REVIEW TOOLBAR ACTIONS ---
  // Color Filter Drawer
  const filterDrawer = document.getElementById('drawer-filter');
  document.getElementById('tool-filter').addEventListener('click', () => {
    filterDrawer.classList.add('open');
  });

  document.getElementById('btn-close-filter-drawer').addEventListener('click', () => {
    filterDrawer.classList.remove('open');
  });

  // Filter selection
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      filterChips.forEach(c => c.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');

      const filterType = target.dataset.filter;
      state.currentFilter = filterType;

      const applyAll = document.getElementById('toggle-apply-all').checked;

      if (applyAll) {
        state.pages.forEach(p => p.filter = filterType);
      } else if (state.pages[state.currentPageIndex]) {
        state.pages[state.currentPageIndex].filter = filterType;
      }

      updateReviewStage();
    });
  });

  // Rotate Page
  document.getElementById('tool-rotate').addEventListener('click', () => {
    if (state.pages[state.currentPageIndex]) {
      const currentRot = state.pages[state.currentPageIndex].rotation || 0;
      state.pages[state.currentPageIndex].rotation = (currentRot + 90) % 360;
      updateReviewStage();
    }
  });

  // Delete Page
  document.getElementById('tool-delete').addEventListener('click', () => {
    if (state.pages.length > 0) {
      state.pages.splice(state.currentPageIndex, 1);
      if (state.currentPageIndex >= state.pages.length && state.currentPageIndex > 0) {
        state.currentPageIndex--;
      }
      updateStackBadge();
      if (state.pages.length === 0) {
        showScreen('camera');
      } else {
        renderThumbnails();
        updateReviewStage();
      }
    }
  });

  // Manual Crop Toggle
  const cropOverlay = document.getElementById('manual-crop-overlay');
  let isCropActive = false;
  document.getElementById('tool-crop').addEventListener('click', () => {
    isCropActive = !isCropActive;
    if (isCropActive) {
      cropOverlay.classList.remove('hidden');
      document.getElementById('tool-crop').classList.add('active');
    } else {
      cropOverlay.classList.add('hidden');
      document.getElementById('tool-crop').classList.remove('active');
    }
  });

  // --- PDF EXPORT MODAL ---
  const modalExport = document.getElementById('modal-export');
  const loadingState = document.getElementById('export-loading-state');
  const successState = document.getElementById('export-success-state');

  document.getElementById('btn-save-pdf').addEventListener('click', () => {
    modalExport.classList.remove('hidden');
    loadingState.classList.remove('hidden');
    successState.classList.add('hidden');

    // Simulate PDF Assembly
    setTimeout(() => {
      loadingState.classList.add('hidden');
      successState.classList.remove('hidden');
      document.getElementById('export-file-meta').textContent = 
        `${inputDocTitle.value.replace(/ /g, '_')}.pdf (${state.pages.length} pages • 1.8 MB)`;
    }, 1500);
  });

  document.getElementById('btn-close-export-modal').addEventListener('click', () => {
    modalExport.classList.add('hidden');
    state.pages = [];
    updateStackBadge();
    showScreen('library');
  });

  // Share buttons feedback
  const shareBtns = document.querySelectorAll('.share-btn');
  shareBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      alert(`Sharing ${inputDocTitle.value}.pdf via ${btn.querySelector('span').textContent}!`);
    });
  });

  // Mode Carousel Item Click
  const modeItems = document.querySelectorAll('.mode-item');
  modeItems.forEach(item => {
    item.addEventListener('click', (e) => {
      modeItems.forEach(m => m.classList.remove('active'));
      e.target.classList.add('active');
      state.activeMode = e.target.dataset.mode;
    });
  });

  // Auto/Manual shutter mode toggle
  const shutterModeBtn = document.getElementById('btn-shutter-mode');
  shutterModeBtn.addEventListener('click', () => {
    state.isAutoShutter = !state.isAutoShutter;
    shutterModeBtn.textContent = state.isAutoShutter ? 'AUTO' : 'MANUAL';
    shutterModeBtn.classList.toggle('active', state.isAutoShutter);
  });

});
