/* ═══════════════════════════════════════════════════════════════════
   ONECONVERT — 92-IN-1 MASTER ENGINE SUITE & ADOBE SCAN APPLICATION
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- STATE MANAGEMENT ---
  const state = {
    pages: [],
    currentPageIndex: 0,
    currentFilter: 'magic',
    activeMode: 'document',
    docTitle: 'Scan 26 Jul 2026',
    isAutoShutter: true,
    activeToolAction: null
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

  // Master Tools Modals
  const modalToolsMaster = document.getElementById('modal-tools-master');
  const modalExecutor = document.getElementById('modal-tool-executor');
  const executorTitle = document.getElementById('executor-title');
  const executorBody = document.getElementById('executor-body');
  const btnExecuteAction = document.getElementById('btn-execute-action');

  // --- NAVIGATION ---
  function showScreen(screenName) {
    Object.keys(screens).forEach(key => {
      screens[key].classList.remove('active');
    });
    screens[screenName].classList.add('active');
  }

  // --- CAMERA SCANNER LOGIC ---
  function capturePage() {
    const shutterInner = shutterBtn.querySelector('.shutter-inner');
    shutterInner.style.transform = 'scale(0.85)';
    shutterInner.style.backgroundColor = 'var(--brand-cyan)';

    setTimeout(() => {
      shutterInner.style.transform = 'scale(1)';
      shutterInner.style.backgroundColor = 'var(--brand-primary)';
    }, 150);

    const newPage = {
      id: Date.now(),
      filter: state.currentFilter,
      rotation: 0
    };

    state.pages.push(newPage);
    updateStackBadge();

    guidanceText.textContent = "Page Captured!";
    setTimeout(() => {
      guidanceText.textContent = "Hold steady... Document Detected";
    }, 1200);
  }

  function updateStackBadge() {
    pageCountBadge.textContent = state.pages.length;
    const stack1 = document.getElementById('stack-card-1');
    const stack2 = document.getElementById('stack-card-2');
    const stack3 = document.getElementById('stack-card-3');

    if (state.pages.length > 0) stack1.style.background = '#FFFFFF';
    if (state.pages.length > 1) stack2.style.opacity = '0.8';
    if (state.pages.length > 2) stack3.style.opacity = '0.5';
  }

  shutterBtn.addEventListener('click', capturePage);

  document.getElementById('btn-review-stack').addEventListener('click', () => {
    if (state.pages.length === 0) capturePage();
    openReviewScreen();
  });

  document.getElementById('fab-start-scan').addEventListener('click', () => showScreen('camera'));
  document.getElementById('btn-close-camera').addEventListener('click', () => showScreen('library'));

  // --- REVIEW SCREEN ---
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
      thumb.innerHTML = `<div style="font-size:10px; font-weight:700; color:#0066FF; padding:4px;">p.${index + 1}</div>`;

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
      reviewPageCard.className = `review-page-card filter-${currentPage.filter || 'magic'}`;
      reviewPageCard.style.transform = `rotate(${currentPage.rotation || 0}deg)`;
    }
  }

  document.getElementById('btn-add-more-pages').addEventListener('click', () => showScreen('camera'));
  document.getElementById('btn-back-camera').addEventListener('click', () => showScreen('camera'));

  // Filters Drawer
  const filterDrawer = document.getElementById('drawer-filter');
  document.getElementById('tool-filter').addEventListener('click', () => filterDrawer.classList.add('open'));
  document.getElementById('btn-close-filter-drawer').addEventListener('click', () => filterDrawer.classList.remove('open'));

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

  document.getElementById('tool-rotate').addEventListener('click', () => {
    if (state.pages[state.currentPageIndex]) {
      const currentRot = state.pages[state.currentPageIndex].rotation || 0;
      state.pages[state.currentPageIndex].rotation = (currentRot + 90) % 360;
      updateReviewStage();
    }
  });

  document.getElementById('tool-more-actions').addEventListener('click', () => {
    modalToolsMaster.classList.remove('hidden');
  });

  // --- MASTER 92-IN-1 TOOLBOX MODAL LOGIC ---
  const btnAllTools = document.getElementById('btn-all-tools');
  const btnOpenMaster = document.getElementById('btn-open-tools-master');
  const btnCloseMaster = document.getElementById('btn-close-tools-master');

  if (btnAllTools) btnAllTools.addEventListener('click', () => modalToolsMaster.classList.remove('hidden'));
  if (btnOpenMaster) btnOpenMaster.addEventListener('click', () => modalToolsMaster.classList.remove('hidden'));
  if (btnCloseMaster) btnCloseMaster.addEventListener('click', () => modalToolsMaster.classList.add('hidden'));

  // Domain Tab Filter in Master Modal
  const domainTabs = document.querySelectorAll('.domain-tab');
  const toolCards = document.querySelectorAll('.tool-card');

  domainTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      domainTabs.forEach(t => t.classList.remove('active'));
      const selectedDomain = e.target.dataset.domain;
      e.target.classList.add('active');

      toolCards.forEach(card => {
        if (selectedDomain === 'all' || card.dataset.domain === selectedDomain) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // --- TOOL EXECUTOR MODAL (DYNAMIC HANDLERS FOR ALL 92 TOOLS) ---
  toolCards.forEach(card => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      state.activeToolAction = action;
      const toolName = card.querySelector('.tool-name').textContent;

      modalToolsMaster.classList.add('hidden');
      setupToolExecutorUI(action, toolName);
      modalExecutor.classList.remove('hidden');
    });
  });

  document.getElementById('btn-close-executor').addEventListener('click', () => {
    modalExecutor.classList.add('hidden');
  });

  function setupToolExecutorUI(action, toolName) {
    executorTitle.textContent = toolName;
    executorBody.innerHTML = '';

    let formHTML = '';

    switch (action) {
      case 'merge':
        formHTML = `
          <div class="input-field-group">
            <label class="input-label">Selected Files to Merge (3)</label>
            <div class="result-output-box">1. Semester_Physics_Notes.pdf (4 pgs)\n2. Aadhaar_ID_Front_Back.pdf (2 pgs)\n3. Report_Draft.pdf (8 pgs)</div>
          </div>
          <div class="input-field-group">
            <label class="input-label">Output Filename</label>
            <input type="text" class="form-input-text" id="exec-input-name" value="Merged_Document_July_2026.pdf">
          </div>`;
        break;

      case 'split':
        formHTML = `
          <div class="input-field-group">
            <label class="input-label">Split Mode</label>
            <select class="form-select-custom" id="exec-split-mode">
              <option value="every">Split Every Page into Individual PDFs</option>
              <option value="range" selected>Split by Range (e.g. 1-3, 4-8)</option>
              <option value="extract">Extract Selected Pages (e.g. 1, 4)</option>
            </select>
          </div>
          <div class="input-field-group">
            <label class="input-label">Page Ranges</label>
            <input type="text" class="form-input-text" id="exec-range" value="1-2, 3-4">
          </div>`;
        break;

      case 'compress':
        formHTML = `
          <div class="input-field-group">
            <label class="input-label">Compression Preset</label>
            <select class="form-select-custom" id="exec-compress-preset">
              <option value="medium" selected>Medium Quality (150 DPI - 60% size reduction)</option>
              <option value="high">High Reduction (96 DPI - 80% size reduction)</option>
              <option value="lossless">Lossless Structure Optimization</option>
            </select>
          </div>
          <div class="input-field-group">
            <label class="input-label">Target Max File Size (KB)</label>
            <input type="number" class="form-input-text" id="exec-target-kb" value="500" placeholder="e.g. 500 KB">
          </div>`;
        break;

      case 'watermark':
        formHTML = `
          <div class="input-field-group">
            <label class="input-label">Watermark Text</label>
            <input type="text" class="form-input-text" id="exec-wm-text" value="CONFIDENTIAL - DRAFT">
          </div>
          <div class="input-field-group">
            <label class="input-label">Position & Rotation</label>
            <select class="form-select-custom">
              <option value="diagonal">45° Diagonal Center</option>
              <option value="bottom">Bottom Right Header</option>
            </select>
          </div>`;
        break;

      case 'protect':
        formHTML = `
          <div class="input-field-group">
            <label class="input-label">Set Open Password</label>
            <input type="password" class="form-input-text" value="OneConvert2026">
          </div>
          <div class="input-field-group">
            <label class="input-label">Encryption Standard</label>
            <select class="form-select-custom">
              <option value="aes256">AES-256 Bit Encryption (Highest Security)</option>
              <option value="aes128">AES-128 Bit Legacy Standard</option>
            </select>
          </div>`;
        break;

      case 'ocr-run':
        formHTML = `
          <div class="input-field-group">
            <label class="input-label">Select Document Language</label>
            <select class="form-select-custom" id="exec-ocr-lang">
              <option value="en_hi">English + Hindi (Regional Auto-Detect)</option>
              <option value="en">English (On-Device Fast OCR)</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="mr">Marathi</option>
            </select>
          </div>
          <div class="input-field-group">
            <label class="input-label">Engine Output</label>
            <div class="result-output-box">Searchable PDF + Embedded Text Layer</div>
          </div>`;
        break;

      case 'table-extract':
        formHTML = `
          <div class="input-field-group">
            <label class="input-label">Target Export Format</label>
            <select class="form-select-custom">
              <option value="xlsx">Microsoft Excel (.xlsx Worksheet)</option>
              <option value="csv">Comma-Separated Values (.csv)</option>
            </select>
          </div>
          <div class="result-output-box">Detected 1 Table (3 Rows x 2 Cols)\nHeader: [Feature, Status]\nData: [Camera Scan, Active], [Magic Filter, Active]</div>`;
        break;

      case 'heic-convert':
        formHTML = `
          <div class="input-field-group">
            <label class="input-label">Output Format</label>
            <select class="form-select-custom">
              <option value="jpeg">JPEG (.jpg - Universal Portal Ready)</option>
              <option value="png">PNG (.png - Transparent Background)</option>
              <option value="webp">WEBP (.webp - Web Optimized)</option>
            </select>
          </div>
          <div class="input-field-group">
            <label class="input-label">Resize Dimensions</label>
            <input type="text" class="form-input-text" value="600 x 600 px (Square Passport ID)">
          </div>`;
        break;

      case 'student-verify':
        formHTML = `
          <div class="input-field-group">
            <label class="input-label">University / College Name</label>
            <input type="text" class="form-input-text" value="Indian Institute of Technology / University">
          </div>
          <div class="input-field-group">
            <label class="input-label">Verification Provider</label>
            <div class="result-output-box">SheerID Instant Verification Pipeline (Feat 2.10)\nUnlocks ₹19/mo Student Tier Access</div>
          </div>`;
        break;

      default:
        formHTML = `
          <div class="input-field-group">
            <label class="input-label">Engine Parameters</label>
            <select class="form-select-custom">
              <option value="auto">Auto-Optimize Settings</option>
              <option value="high">High Quality Preset</option>
            </select>
          </div>
          <div class="result-output-box">Engine initialized. Ready to execute ${toolName}.</div>`;
        break;
    }

    executorBody.innerHTML = formHTML;
  }

  // Execute Action Button Click
  btnExecuteAction.addEventListener('click', () => {
    btnExecuteAction.textContent = "Processing Engine...";
    btnExecuteAction.style.opacity = '0.7';

    setTimeout(() => {
      btnExecuteAction.textContent = "Execute Operation";
      btnExecuteAction.style.opacity = '1';
      modalExecutor.classList.add('hidden');

      // Trigger export modal success state
      const modalExport = document.getElementById('modal-export');
      const loadingState = document.getElementById('export-loading-state');
      const successState = document.getElementById('export-success-state');

      modalExport.classList.remove('hidden');
      loadingState.classList.add('hidden');
      successState.classList.remove('hidden');
      document.getElementById('export-file-meta').textContent = `${executorTitle.textContent} Output Processed (1.4 MB)`;
    }, 1200);
  });

  // PDF Export Modal trigger
  document.getElementById('btn-save-pdf').addEventListener('click', () => {
    const modalExport = document.getElementById('modal-export');
    const loadingState = document.getElementById('export-loading-state');
    const successState = document.getElementById('export-success-state');

    modalExport.classList.remove('hidden');
    loadingState.classList.remove('hidden');
    successState.classList.add('hidden');

    setTimeout(() => {
      loadingState.classList.add('hidden');
      successState.classList.remove('hidden');
      document.getElementById('export-file-meta').textContent = `${inputDocTitle.value.replace(/ /g, '_')}.pdf (${state.pages.length || 1} pages • 1.8 MB)`;
    }, 1200);
  });

  document.getElementById('btn-close-export-modal').addEventListener('click', () => {
    document.getElementById('modal-export').classList.add('hidden');
    state.pages = [];
    updateStackBadge();
    showScreen('library');
  });

  // Share buttons feedback
  const shareBtns = document.querySelectorAll('.share-btn');
  shareBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      alert(`Sharing output via ${btn.querySelector('span').textContent}!`);
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

  const shutterModeBtn = document.getElementById('btn-shutter-mode');
  shutterModeBtn.addEventListener('click', () => {
    state.isAutoShutter = !state.isAutoShutter;
    shutterModeBtn.textContent = state.isAutoShutter ? 'AUTO' : 'MANUAL';
    shutterModeBtn.classList.toggle('active', state.isAutoShutter);
  });

});
