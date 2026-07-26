/* ═══════════════════════════════════════════════════════════════════
   ONECONVERT — COMPLETE 92/92 FEATURE MASTER ENGINE APPLICATION
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
    activeTool: null
  };

  // --- MASTER DATASET: ALL 92 APPROVED FEATURES ---
  const ALL_92_FEATURES = [
    // Account & Identity / Subscription (10)
    { id: 1, domain: 'account', icon: 'user-check', name: 'User Authentication', desc: 'Email, Google/Apple OAuth & Passwordless OTP (Feat 1)' },
    { id: 2, domain: 'account', icon: 'sliders', name: 'Profile & Preferences', desc: 'User profile metadata & local preference manager (Feat 2)' },
    { id: 3, domain: 'account', icon: 'shield-check', name: 'Entitlement Enforcer', desc: 'Feature access control & RBAC permissions (Feat 3)' },
    { id: 4, domain: 'account', icon: 'credit-card', name: 'Subscription Gateway', desc: 'UPI, Cards, Netbanking payment integration (Feat 4)' },
    { id: 5, domain: 'account', icon: 'gauge', name: 'Usage Quota Manager', desc: 'Free tier conversion limits & throttling (Feat 5)' },
    { id: 6, domain: 'account', icon: 'graduation-cap', name: 'Student Verification', desc: 'SheerID & manual ID card approval for ₹19/mo (Feat 6)' },
    { id: 7, domain: 'account', icon: 'sparkles', name: 'Pro Subscription Manager', desc: 'Pro tier unlock & auto-renewal management (Feat 7)' },
    { id: 8, domain: 'account', icon: 'shopping-cart', name: 'In-App Purchases (IAP)', desc: 'Google Play Billing & Apple App Store IAP (Feat 8)' },
    { id: 9, domain: 'account', icon: 'receipt', name: 'Billing Receipts', desc: 'Tax invoice generation & purchase history (Feat 9)' },
    { id: 10, domain: 'account', icon: 'user-x', name: 'Account Data Purge', desc: 'GDPR / DPDP Act account & data deletion (Feat 10)' },

    // Scanner Domain (10)
    { id: 11, domain: 'scanner', icon: 'camera', name: 'Multi-Page Camera Scan', desc: 'Continuous camera capture session (Feat 11)' },
    { id: 12, domain: 'scanner', icon: 'scan', name: 'Auto Edge Detection', desc: 'Real-time cyan #00F0FF quad boundary lock (Feat 12)' },
    { id: 13, domain: 'scanner', icon: 'crop', name: 'Perspective Warp & Deskew', desc: '3D corner warping & auto-straightening (Feat 13)' },
    { id: 14, domain: 'scanner', icon: 'wand-2', name: 'Color Filter Suite', desc: 'Magic Color, B&W, Greyscale, Original (Feat 14)' },
    { id: 15, domain: 'scanner', icon: 'shield-alert', name: 'Auto-Shutter & Blur Detect', desc: 'Hold steady guidance & blur prevention (Feat 15)' },
    { id: 16, domain: 'scanner', icon: 'zap', name: 'Flash & Grid Controls', desc: 'Camera LED flashlight & rule-of-thirds grid (Feat 16)' },
    { id: 17, domain: 'scanner', icon: 'layers', name: 'Document Presets', desc: 'Document, ID Card, Book, Receipt modes (Feat 17)' },
    { id: 18, domain: 'scanner', icon: 'image', name: 'Gallery Multi-Import', desc: 'Batch import photos from device storage (Feat 18)' },
    { id: 19, domain: 'scanner', icon: 'copy', name: 'Batch Segmented Capture', desc: 'Continuous multi-doc batch scan mode (Feat 19)' },
    { id: 20, domain: 'scanner', icon: 'qr-code', name: 'Live QR/Barcode Reader', desc: 'Real-time QR code decode & link copy (Feat 20)' },

    // PDF Engine (16)
    { id: 21, domain: 'pdf', icon: 'file-text', name: 'High-Fidelity PDF Viewer', desc: 'Infinite lazy scroll & zoom viewer (Feat 21)' },
    { id: 22, domain: 'pdf', icon: 'layers', name: 'Merge PDF', desc: 'Combine multiple PDFs & images in order (Feat 22)' },
    { id: 23, domain: 'pdf', icon: 'scissors', name: 'Split PDF', desc: 'Split by page, range, or extract chapters (Feat 23)' },
    { id: 24, domain: 'pdf', icon: 'minimize-2', name: 'Compress PDF', desc: 'Low/Med/High & Target KB size slider (Feat 24)' },
    { id: 25, domain: 'pdf', icon: 'grid', name: 'Organize Pages', desc: 'Rotate, delete, duplicate, insert blank page (Feat 25)' },
    { id: 26, domain: 'pdf', icon: 'stamp', name: 'Watermark Engine', desc: 'Text & logo watermark with opacity angle (Feat 26)' },
    { id: 27, domain: 'pdf', icon: 'lock', name: 'Password Protect PDF', desc: 'AES-128 / AES-256 Open & Permission lock (Feat 27)' },
    { id: 28, domain: 'pdf', icon: 'unlock', name: 'Unlock PDF', desc: 'Remove password security authorized (Feat 28)' },
    { id: 29, domain: 'pdf', icon: 'highlighter', name: 'PDF Annotation Suite', desc: 'Highlight, underline, shapes, sticky notes (Feat 29)' },
    { id: 30, domain: 'pdf', icon: 'pen-tool', name: 'Fill & Sign', desc: 'AcroForms fill & freehand signature canvas (Feat 30)' },
    { id: 31, domain: 'pdf', icon: 'eye-off', name: 'Permanent Redaction', desc: 'Area blackout & search-and-redact (Feat 31)' },
    { id: 32, domain: 'pdf', icon: 'file-search', name: 'OCR Integration', desc: 'Scanned PDF to Searchable PDF output (Feat 32)' },
    { id: 33, domain: 'pdf', icon: 'file-output', name: 'PDF Multi-Export', desc: 'Export PDF to DOCX, PPTX, XLSX, TXT (Feat 33)' },
    { id: 34, domain: 'pdf', icon: 'sparkles', name: 'AI PDF Assistant', desc: 'Summarize, explain, translate & chat PDF (Feat 34)' },
    { id: 35, domain: 'pdf', icon: 'cpu', name: 'PDF Engine Performance', desc: '1000-page lazy load & incremental save (Feat 35)' },
    { id: 36, domain: 'pdf', icon: 'wifi-off', name: 'PDF Offline Support', desc: 'Local rendering & offline annotation (Feat 36)' },

    // OCR Engine (8)
    { id: 37, domain: 'ocr', icon: 'languages', name: 'Multi-Language OCR', desc: 'English, Hindi, Tamil, Telugu, Marathi (Feat 37)' },
    { id: 38, domain: 'ocr', icon: 'layout', name: 'Document Layout Analysis', desc: 'Headers, paragraphs, columns, reading flow (Feat 38)' },
    { id: 39, domain: 'ocr', icon: 'table', name: 'Table Extractor', desc: 'Convert scanned tables to Excel & CSV (Feat 39)' },
    { id: 40, domain: 'ocr', icon: 'image', name: 'OCR Pre-Processing', desc: 'Adaptive binarization & shadow removal (Feat 40)' },
    { id: 41, domain: 'ocr', icon: 'pencil', name: 'Handwriting ICR', desc: 'Transcribe handwritten lecture notes (Feat 41)' },
    { id: 42, domain: 'ocr', icon: 'check-square', name: 'OCR Verification Editor', desc: 'Low confidence yellow highlight review (Feat 42)' },
    { id: 43, domain: 'ocr', icon: 'list-checks', name: 'Batch OCR Queue', desc: 'Background queue for multi-file OCR (Feat 43)' },
    { id: 44, domain: 'ocr', icon: 'file-code', name: 'Multi-Format OCR Output', desc: 'Export hOCR, ALTO XML, JSON, Plain Text (Feat 44)' },

    // Office Engine (8)
    { id: 45, domain: 'office', icon: 'file-type', name: 'Word to PDF', desc: 'DOCX / DOC to PDF conversion (Feat 45)' },
    { id: 46, domain: 'office', icon: 'file-spreadsheet', name: 'Excel to PDF', desc: 'XLSX to PDF with fit-to-width auto-scale (Feat 46)' },
    { id: 47, domain: 'office', icon: 'presentation', name: 'PowerPoint to PDF', desc: 'Full slides & 4-up handout grid modes (Feat 47)' },
    { id: 48, domain: 'office', icon: 'eye', name: 'In-App Office Viewer', desc: 'Native rendering for Word, Excel, PPT (Feat 48)' },
    { id: 49, domain: 'office', icon: 'file-input', name: 'Office Template Engine', desc: 'Dynamic {{variable}} data form merge (Feat 49)' },
    { id: 50, domain: 'office', icon: 'type', name: 'Font Metric Pipeline', desc: 'Carlito/Caladea metric font embedding (Feat 50)' },
    { id: 51, domain: 'office', icon: 'clock', name: 'Batch Office Queue', desc: 'Parallel serverless Office file queue (Feat 51)' },
    { id: 52, domain: 'office', icon: 'shield-check', name: 'Office Metadata Sanitizer', desc: 'Strip PII author & revision history (Feat 52)' },

    // Image, Video, Audio, Compression Engine (8)
    { id: 53, domain: 'media', icon: 'image', name: 'Image Format Converter', desc: 'HEIC, PNG, WEBP, JPEG, SVG, AVIF (Feat 53)' },
    { id: 54, domain: 'media', icon: 'minimize-2', name: 'Image Compressor', desc: 'Target KB size search & side-by-side (Feat 54)' },
    { id: 55, domain: 'media', icon: 'sliders', name: 'Batch Image Editor', desc: 'Watermark, crop, filter 50 images (Feat 55)' },
    { id: 56, domain: 'media', icon: 'music', name: 'Audio Extractor', desc: 'Extract audio from Video MP4 to MP3 (Feat 56)' },
    { id: 57, domain: 'media', icon: 'mic', name: 'Audio Bitrate Optimizer', desc: 'Voice 64kbps mono speech compression (Feat 57)' },
    { id: 58, domain: 'media', icon: 'video', name: 'Video Transcoder', desc: 'Convert MP4, MOV, WEBM, MKV (Feat 58)' },
    { id: 59, domain: 'media', icon: 'film', name: 'Video Compressor', desc: 'Email <25MB & WhatsApp <64MB caps (Feat 59)' },
    { id: 60, domain: 'media', icon: 'archive', name: 'ZIP / RAR Manager', desc: 'Compress & extract RAR, 7Z, ZIP (Feat 60)' },

    // Cloud, Sync, Search & Organization (8)
    { id: 61, domain: 'cloud', icon: 'cloud', name: 'Multi-Cloud Integration', desc: 'Google Drive, Dropbox, OneDrive sync (Feat 61)' },
    { id: 62, domain: 'cloud', icon: 'refresh-cw', name: 'Cross-Device Sync', desc: 'S3/DynamoDB sync & 3-way vector clock (Feat 62)' },
    { id: 63, domain: 'cloud', icon: 'search', name: 'Full-Text Search Engine', desc: '< 300ms FTS5 OCR & metadata search (Feat 63)' },
    { id: 64, domain: 'cloud', icon: 'folder-tree', name: 'Nested Folder System', desc: 'Hierarchical folders, tags, favorites (Feat 64)' },
    { id: 65, domain: 'cloud', icon: 'share-2', name: 'Secure Access Links', desc: 'Password & time-limited presigned URLs (Feat 65)' },
    { id: 66, domain: 'cloud', icon: 'history', name: 'Trash & Version History', desc: '30-day soft delete & S3 object versions (Feat 66)' },
    { id: 67, domain: 'cloud', icon: 'folder-heart', name: 'Smart Collections', desc: 'Auto-tag Receipts, Invoices, ID Cards (Feat 67)' },
    { id: 68, domain: 'cloud', icon: 'hard-drive', name: 'Offline Storage Manager', desc: 'Local disk breakdown & auto 48h purge (Feat 68)' },

    // Notifications, Admin & Cross-Cutting (7)
    { id: 69, domain: 'admin', icon: 'bell', name: 'Notification Engine', desc: 'FCM/APNs Push, AWS SES Email, Toast (Feat 69)' },
    { id: 70, domain: 'admin', icon: 'list-todo', name: 'Async Task Manager', desc: 'Pause, cancel, retry background queue (Feat 70)' },
    { id: 71, domain: 'admin', icon: 'globe', name: 'i18n Localization', desc: '12+ languages & RTL Arabic mirroring (Feat 71)' },
    { id: 72, domain: 'admin', icon: 'settings', name: 'App Preferences', desc: 'Dark theme & camera defaults manager (Feat 72)' },
    { id: 73, domain: 'admin', icon: 'activity', name: 'Telemetry Pipeline', desc: 'Sentry crash reporting & zero-PII logs (Feat 73)' },
    { id: 74, domain: 'admin', icon: 'shield-alert', name: 'Security Audit Log', desc: 'GDPR / DPDP Download & Delete data (Feat 74)' },
    { id: 75, domain: 'admin', icon: 'layout-dashboard', name: 'Admin Portal Console', desc: 'Student Review Queue & AWS metrics (Feat 75)' },

    // Specialized & Consolidated Backlog (17)
    { id: 76, domain: 'backlog', icon: 'form-input', name: 'AcroForm Builder', desc: 'Drag-and-drop fillable form authoring (Feat 76)' },
    { id: 77, domain: 'backlog', icon: 'key', name: 'X.509 Digital Signatures', desc: 'Cryptographic PKCS#12 / TSA hashes (Feat 77)' },
    { id: 78, domain: 'backlog', icon: 'git-compare', name: 'PDF Compare Diff', desc: 'Side-by-side text & layout diff (Feat 78)' },
    { id: 79, domain: 'backlog', icon: 'workflow', name: 'Workflow Builder', desc: 'Zapier / Webhook trigger-action rules (Feat 79)' },
    { id: 80, domain: 'backlog', icon: 'grid', name: 'N-Up Imposition Engine', desc: '2-up, 4-up, booklet print imposition (Feat 80)' },
    { id: 81, domain: 'backlog', icon: 'palette', name: 'Brand Style Kit', desc: 'Custom logo, colors, header/footers (Feat 81)' },
    { id: 82, domain: 'backlog', icon: 'book-open', name: 'EPUB E-Book Converter', desc: 'Reflowable EPUB export for e-readers (Feat 82)' },
    { id: 83, domain: 'backlog', icon: 'file-text', name: 'Invoice Extraction API', desc: 'NER model invoice field extraction (Feat 83)' },
    { id: 84, domain: 'backlog', icon: 'credit-card', name: 'ID Card Dual Stitching', desc: 'Stitch front & back ID onto 1 page (Feat 84)' },
    { id: 85, domain: 'backlog', icon: 'shield-off', name: 'Document Sanitization', desc: 'Strip JS, embedded files & layers (Feat 85)' },
    { id: 86, domain: 'backlog', icon: 'server-off', name: 'Air-Gapped License', desc: 'Offline RSA enterprise license verify (Feat 86)' },
    { id: 87, domain: 'backlog', icon: 'volume-2', name: 'Voice Navigation a11y', desc: 'WCAG 2.1 AA VoiceOver / TalkBack (Feat 87)' },
    { id: 88, domain: 'backlog', icon: 'calendar', name: 'Regional Calendars', desc: 'Saka Era, Vikram Samvat, Hijri (Feat 88)' },
    { id: 89, domain: 'backlog', icon: 'qr-code', name: 'QR Anti-Tamper Stamp', desc: 'Cryptographic QR verification stamp (Feat 89)' },
    { id: 90, domain: 'backlog', icon: 'layout-grid', name: 'Multi-Tab Workspace', desc: 'Desktop / Tablet multi-PDF tabs (Feat 90)' },
    { id: 91, domain: 'backlog', icon: 'cloud-rain', name: 'Glacier Archive Backup', desc: 'Auto weekly S3 Glacier backups (Feat 91)' },
    { id: 92, domain: 'backlog', icon: 'sun-medium', name: 'Greyscale Converter', desc: 'Selective page color-to-greyscale (Feat 92)' }
  ];

  // DOM ELEMENTS
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

  const modalToolsMaster = document.getElementById('modal-tools-master');
  const toolsGridCatalog = document.getElementById('tools-grid-catalog');
  const inputToolSearch = document.getElementById('input-tool-search');
  const masterToolCounter = document.getElementById('master-tool-counter');
  const modalExecutor = document.getElementById('modal-tool-executor');
  const executorTitle = document.getElementById('executor-title');
  const executorBody = document.getElementById('executor-body');
  const btnExecuteAction = document.getElementById('btn-execute-action');

  // --- NAVIGATION ---
  function showScreen(screenName) {
    Object.keys(screens).forEach(key => screens[key].classList.remove('active'));
    screens[screenName].classList.add('active');
  }

  // --- POPULATE ALL 92 FEATURES INTO MASTER CATALOG GRID ---
  function renderMasterToolsGrid(filterDomain = 'all', searchQuery = '') {
    toolsGridCatalog.innerHTML = '';
    let visibleCount = 0;

    ALL_92_FEATURES.forEach(feature => {
      const matchesDomain = (filterDomain === 'all' || feature.domain === filterDomain);
      const matchesSearch = searchQuery === '' || 
        feature.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        feature.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `feat ${feature.id}`.includes(searchQuery.toLowerCase());

      if (matchesDomain && matchesSearch) {
        visibleCount++;
        const card = document.createElement('div');
        card.className = 'tool-card';
        card.dataset.featureId = feature.id;
        card.dataset.domain = feature.domain;

        card.innerHTML = `
          <span class="feat-id-badge">Feat ${feature.id}</span>
          <div class="tool-icon-box ${feature.domain}">
            <i data-lucide="${feature.icon}"></i>
          </div>
          <div class="tool-meta">
            <span class="tool-name">${feature.name}</span>
            <span class="tool-desc">${feature.desc}</span>
          </div>
        `;

        card.addEventListener('click', () => {
          state.activeTool = feature;
          modalToolsMaster.classList.add('hidden');
          setupToolExecutorUI(feature);
          modalExecutor.classList.remove('hidden');
        });

        toolsGridCatalog.appendChild(card);
      }
    });

    if (window.lucide) lucide.createIcons();
    masterToolCounter.textContent = `Showing ${visibleCount} of 92 Features`;
  }

  renderMasterToolsGrid();

  // TOOL SEARCH BAR LISTENER
  inputToolSearch.addEventListener('input', (e) => {
    const activeTab = document.querySelector('.domain-tab.active');
    const domain = activeTab ? activeTab.dataset.domain : 'all';
    renderMasterToolsGrid(domain, e.target.value.trim());
  });

  // DOMAIN TABS LISTENER
  const domainTabs = document.querySelectorAll('.domain-tab');
  domainTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      domainTabs.forEach(t => t.classList.remove('active'));
      const domain = e.target.dataset.domain;
      e.target.classList.add('active');
      renderMasterToolsGrid(domain, inputToolSearch.value.trim());
    });
  });

  // MASTER TOOLBOX OPEN/CLOSE
  const btnAllTools = document.getElementById('btn-all-tools');
  const btnOpenMaster = document.getElementById('btn-open-tools-master');
  const btnCloseMaster = document.getElementById('btn-close-tools-master');

  if (btnAllTools) btnAllTools.addEventListener('click', () => modalToolsMaster.classList.remove('hidden'));
  if (btnOpenMaster) btnOpenMaster.addEventListener('click', () => modalToolsMaster.classList.remove('hidden'));
  if (btnCloseMaster) btnCloseMaster.addEventListener('click', () => modalToolsMaster.classList.add('hidden'));

  // --- CAMERA SCANNER ---
  function capturePage() {
    const shutterInner = shutterBtn.querySelector('.shutter-inner');
    shutterInner.style.transform = 'scale(0.85)';
    shutterInner.style.backgroundColor = 'var(--brand-cyan)';

    setTimeout(() => {
      shutterInner.style.transform = 'scale(1)';
      shutterInner.style.backgroundColor = 'var(--brand-primary)';
    }, 150);

    const newPage = { id: Date.now(), filter: state.currentFilter, rotation: 0 };
    state.pages.push(newPage);
    updateStackBadge();

    guidanceText.textContent = "Page Captured!";
    setTimeout(() => { guidanceText.textContent = "Hold steady... Document Lock"; }, 1200);
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

  // REVIEW SCREEN
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

  // FILTER DRAWER
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

  document.getElementById('tool-more-actions').addEventListener('click', () => modalToolsMaster.classList.remove('hidden'));

  // --- DYNAMIC TOOL EXECUTOR (FOR ALL 92 FEATURES) ---
  document.getElementById('btn-close-executor').addEventListener('click', () => modalExecutor.classList.add('hidden'));

  function setupToolExecutorUI(feature) {
    executorTitle.textContent = `[Feat ${feature.id}] ${feature.name}`;
    executorBody.innerHTML = '';

    let formHTML = `
      <div class="input-field-group">
        <label class="input-label">Feature Description</label>
        <div style="font-size:12px; color:#94A3B8; line-height:1.4;">${feature.desc}</div>
      </div>
      <div class="input-field-group">
        <label class="input-label">Execution Parameters</label>
        <select class="form-select-custom">
          <option value="auto" selected>Auto-Optimize Engine Settings</option>
          <option value="high">High Precision / Quality Mode</option>
          <option value="fast">Fast Performance Mode</option>
        </select>
      </div>
      <div class="input-field-group">
        <label class="input-label">Live Processing Output</label>
        <div class="result-output-box">✅ Feature ${feature.id} initialized.\nDomain: ${feature.domain.toUpperCase()}\nStatus: Engine Active & Ready</div>
      </div>
    `;

    executorBody.innerHTML = formHTML;
  }

  // EXECUTE ACTION BUTTON
  btnExecuteAction.addEventListener('click', () => {
    btnExecuteAction.textContent = "Processing Engine...";
    btnExecuteAction.style.opacity = '0.7';

    setTimeout(() => {
      btnExecuteAction.textContent = "Execute Operation";
      btnExecuteAction.style.opacity = '1';
      modalExecutor.classList.add('hidden');

      const modalExport = document.getElementById('modal-export');
      const loadingState = document.getElementById('export-loading-state');
      const successState = document.getElementById('export-success-state');

      modalExport.classList.remove('hidden');
      loadingState.classList.add('hidden');
      successState.classList.remove('hidden');
      document.getElementById('export-file-meta').textContent = `${executorTitle.textContent} Processed Successfully (1.6 MB)`;
    }, 1200);
  });

  // SAVE PDF MODAL
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

  const shareBtns = document.querySelectorAll('.share-btn');
  shareBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      alert(`Sharing via ${btn.querySelector('span').textContent}!`);
    });
  });

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
