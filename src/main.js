import { RELICS_DATA, CATEGORIES } from './modelsData.js';
import { Reliquary3DViewer } from './viewer3d.js';
import { vintageAudio } from './audioEngine.js';

// Application State
let currentRelicIndex = 0;
let currentActiveRelic = RELICS_DATA[0];
let activeCategoryFilter = 'all';
let searchQuery = '';
let viewer = null;

// DOM Elements
const loaderEl = document.getElementById('viewport-loader');
const progressFillEl = document.getElementById('progress-bar-fill');
const loaderStatusEl = document.getElementById('loader-status');
const loaderTitleEl = document.getElementById('loader-title');

const hudRelicName = document.getElementById('hud-relic-name');
const hudRelicRarity = document.getElementById('hud-relic-rarity');
const hudRelicSize = document.getElementById('hud-relic-size');
const hudRelicTris = document.getElementById('hud-relic-tris');
const counterCurrent = document.getElementById('counter-current');
const counterTotal = document.getElementById('counter-total');

const navArrowPrev = document.getElementById('nav-arrow-prev');
const navArrowNext = document.getElementById('nav-arrow-next');

const btnDownloadGlb = document.getElementById('btn-download-glb');
const downloadFileInfo = document.getElementById('download-file-info');

const codexSubtitle = document.getElementById('codex-subtitle');
const codexDescription = document.getElementById('codex-description');
const specOrigin = document.getElementById('spec-origin');
const specEra = document.getElementById('spec-era');
const specWeight = document.getElementById('spec-weight');
const specMaterial = document.getElementById('spec-material');
const codexLore = document.getElementById('codex-lore');

const statValDurability = document.getElementById('stat-val-durability');
const statBarDurability = document.getElementById('stat-bar-durability');
const statValArcane = document.getElementById('stat-val-arcane');
const statBarArcane = document.getElementById('stat-bar-arcane');
const statValLethality = document.getElementById('stat-val-lethality');
const statBarLethality = document.getElementById('stat-bar-lethality');
const statValCraft = document.getElementById('stat-val-craft');
const statBarCraft = document.getElementById('stat-bar-craft');

const squareRelicsDeck = document.getElementById('square-relics-deck');
const deckScrollLeft = document.getElementById('deck-scroll-left');
const deckScrollRight = document.getElementById('deck-scroll-right');
const deckCountBadge = document.getElementById('deck-count-badge');

const relicsGrid = document.getElementById('relics-grid');
const filterPillsContainer = document.getElementById('filter-pills');
const searchInput = document.getElementById('catalog-search');

const btnSoundToggle = document.getElementById('btn-sound-toggle');
const soundLabel = document.getElementById('sound-label');

const btnToggleRotate = document.getElementById('btn-toggle-rotate');
const btnToggleWireframe = document.getElementById('btn-toggle-wireframe');
const btnResetView = document.getElementById('btn-reset-view');
const btnCaptureSnapshot = document.getElementById('btn-capture-snapshot');

const sliderPatina = document.getElementById('slider-patina');
const patinaValDisplay = document.getElementById('patina-val-display');
const sliderSpeed = document.getElementById('slider-speed');
const speedValDisplay = document.getElementById('speed-val-display');
const tintPalette = document.getElementById('tint-palette');

const loreModal = document.getElementById('lore-modal');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const modalCategory = document.getElementById('modal-category');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalLoreBody = document.getElementById('modal-lore-body');
const modalInspectBtn = document.getElementById('modal-inspect-btn');
const modalDownloadBtn = document.getElementById('modal-download-btn');
let modalSelectedRelic = null;

const guestbookForm = document.getElementById('guestbook-form');
const guestbookEntriesContainer = document.getElementById('guestbook-entries');

// Initialize Application
function initApp() {
  if (counterTotal) {
    counterTotal.textContent = String(RELICS_DATA.length).padStart(2, '0');
  }

  init3DViewer();
  renderSquareDeck();
  renderFilterPills();
  renderRelicsGrid();
  setupNavigationArrows();
  setupHUDControls();
  setupForgeControls();
  setupAudioToggle();
  setupGuestbook();
  setupModal();
}

// 3D Viewer Initialization
function init3DViewer() {
  viewer = new Reliquary3DViewer(
    'canvas-container',
    // onProgress
    (percent, loaded, total) => {
      progressFillEl.style.width = `${percent}%`;
      const loadedMB = (loaded / (1024 * 1024)).toFixed(1);
      const totalMB = (total / (1024 * 1024)).toFixed(1);
      loaderStatusEl.textContent = `Deciphering relic geometry... ${percent}% (${loadedMB}MB / ${totalMB}MB)`;
    },
    // onLoadComplete
    (modelData) => {
      loaderEl.classList.add('hidden');
      hudRelicTris.textContent = modelData.polycount ? modelData.polycount.toLocaleString() : '84,200';
    },
    // onError
    (error, modelData) => {
      loaderStatusEl.textContent = `Relic occult seal intact: ${error.message || 'Cannot display'}`;
    }
  );

  // Load initial default model
  selectRelic(currentActiveRelic, false);
}

// Select & Display Relic
function selectRelic(relic, scrollToTop = false) {
  currentActiveRelic = relic;
  currentRelicIndex = RELICS_DATA.findIndex(r => r.id === relic.id);
  if (currentRelicIndex === -1) currentRelicIndex = 0;

  // Show loading indicator
  loaderEl.classList.remove('hidden');
  loaderTitleEl.textContent = `Summoning ${relic.title}...`;
  progressFillEl.style.width = '10%';
  loaderStatusEl.textContent = 'Deciphering runic geometry...';

  // Update HUD
  hudRelicName.textContent = relic.title;
  hudRelicRarity.textContent = relic.rarity;
  hudRelicRarity.style.color = relic.rarityColor;
  hudRelicSize.textContent = relic.fileSize;
  hudRelicTris.textContent = relic.polycount ? relic.polycount.toLocaleString() : 'Measuring...';

  if (counterCurrent) {
    counterCurrent.textContent = String(currentRelicIndex + 1).padStart(2, '0');
  }

  // Update Download 3D Model Button
  if (btnDownloadGlb) {
    const fileUrl = new URL(relic.file, window.location.href).href;
    btnDownloadGlb.href = fileUrl;
    btnDownloadGlb.setAttribute('download', relic.file);
    if (downloadFileInfo) {
      downloadFileInfo.textContent = `Binary glTF (.GLB) • ${relic.fileSize}`;
    }
  }

  // Update Codex Ledger
  codexSubtitle.textContent = relic.subtitle;
  const firstLetter = relic.description.charAt(0);
  const remainingText = relic.description.slice(1);
  codexDescription.innerHTML = `<span class="illuminated-letter">${firstLetter}</span>${remainingText}`;

  specOrigin.textContent = relic.origin;
  specEra.textContent = relic.era;
  specWeight.textContent = relic.weight;
  specMaterial.textContent = relic.material;

  statValDurability.textContent = `${relic.stats.durability}%`;
  statBarDurability.style.width = `${relic.stats.durability}%`;

  statValArcane.textContent = `${relic.stats.arcanePotency}%`;
  statBarArcane.style.width = `${relic.stats.arcanePotency}%`;

  statValLethality.textContent = `${relic.stats.lethality}%`;
  statBarLethality.style.width = `${relic.stats.lethality}%`;

  statValCraft.textContent = `${relic.stats.craftsmanship}%`;
  statBarCraft.style.width = `${relic.stats.craftsmanship}%`;

  codexLore.textContent = relic.lore;

  // Load in 3D Viewer
  viewer.loadRelic(relic);

  // Update Active Highlights in Bottom Square Deck & Grid
  updateActiveCardHighlights();

  // Scroll to stage if requested
  if (scrollToTop) {
    document.getElementById('hero-stage').scrollIntoView({ behavior: 'smooth' });
    vintageAudio.playRelicInspectSound();
  }
}

// Navigate Previous / Next Relic (Game-like Selection)
function navigateRelic(direction) {
  currentRelicIndex = (currentRelicIndex + direction + RELICS_DATA.length) % RELICS_DATA.length;
  const nextRelic = RELICS_DATA[currentRelicIndex];
  selectRelic(nextRelic, false);
  vintageAudio.playBrassClick();
}

// Setup Navigation Arrows and Keyboard Listeners
function setupNavigationArrows() {
  if (navArrowPrev) {
    navArrowPrev.addEventListener('click', () => navigateRelic(-1));
  }
  if (navArrowNext) {
    navArrowNext.addEventListener('click', () => navigateRelic(1));
  }

  // Keyboard navigation: Left & Right arrow keys
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') {
      navigateRelic(-1);
    } else if (e.key === 'ArrowRight') {
      navigateRelic(1);
    }
  });

  // Carousel scroll buttons
  if (deckScrollLeft) {
    deckScrollLeft.addEventListener('click', () => {
      squareRelicsDeck.parentElement.scrollBy({ left: -280, behavior: 'smooth' });
      vintageAudio.playBrassClick();
    });
  }
  if (deckScrollRight) {
    deckScrollRight.addEventListener('click', () => {
      squareRelicsDeck.parentElement.scrollBy({ left: 280, behavior: 'smooth' });
      vintageAudio.playBrassClick();
    });
  }
}

// Render the Bottom Square Character Selection Deck
function renderSquareDeck() {
  if (!squareRelicsDeck) return;
  squareRelicsDeck.innerHTML = '';

  RELICS_DATA.forEach((relic, idx) => {
    const isCurrent = currentActiveRelic && currentActiveRelic.id === relic.id;
    const card = document.createElement('div');
    card.className = `square-relic-card ${isCurrent ? 'active' : ''}`;
    card.dataset.relicId = relic.id;
    card.dataset.index = idx;
    card.title = `Inspect ${relic.title} (${relic.fileSize})`;

    const thumbUrl = new URL(relic.thumbnail, window.location.href).href;

    card.innerHTML = `
      <div class="square-card-frame">
        <div class="square-card-img-box">
          <img src="${thumbUrl}" alt="${relic.title}" class="square-card-img" loading="lazy">
        </div>
        <div class="square-card-rarity-pip" style="background: ${relic.rarityColor};" title="${relic.rarity}"></div>
        <div class="square-card-meta">
          <div class="square-card-name">${relic.title}</div>
          <div class="square-card-size">
            <span>${relic.categoryLabel.split(' ')[0]}</span>
            <span>${relic.fileSize}</span>
          </div>
        </div>
        <div class="square-active-indicator">ACTIVE</div>
        <div class="sq-corner sq-tl"></div>
        <div class="sq-corner sq-tr"></div>
        <div class="sq-corner sq-bl"></div>
        <div class="sq-corner sq-br"></div>
      </div>
    `;

    card.addEventListener('click', () => {
      selectRelic(relic, false);
      vintageAudio.playRelicInspectSound();
    });

    squareRelicsDeck.appendChild(card);
  });
}

// Update Active Card Highlights & Center in Carousel
function updateActiveCardHighlights() {
  // Update square deck
  if (squareRelicsDeck) {
    const squareCards = squareRelicsDeck.querySelectorAll('.square-relic-card');
    squareCards.forEach(card => {
      if (card.dataset.relicId === currentActiveRelic.id) {
        card.classList.add('active');
        // Smoothly center the active thumbnail in the bottom carousel
        card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        card.classList.remove('active');
      }
    });
  }

  // Update Curio Cabinet grid
  document.querySelectorAll('.relic-card').forEach(card => {
    if (card.dataset.relicId === currentActiveRelic.id) {
      card.classList.add('current-active');
    } else {
      card.classList.remove('current-active');
    }
  });
}

// Render Category Filter Pills
function renderFilterPills() {
  filterPillsContainer.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const pill = document.createElement('button');
    pill.className = `pill-btn ${cat.id === activeCategoryFilter ? 'active' : ''}`;
    pill.innerHTML = `<span>${cat.icon} ${cat.label}</span> <span class="pill-badge">${cat.count}</span>`;
    pill.addEventListener('click', () => {
      activeCategoryFilter = cat.id;
      vintageAudio.playBrassClick();
      renderFilterPills();
      renderRelicsGrid();
    });
    filterPillsContainer.appendChild(pill);
  });
}

// Render Relics Grid Cards (Curio Cabinet) with Image Preview + Download Button
function renderRelicsGrid() {
  relicsGrid.innerHTML = '';

  const filtered = RELICS_DATA.filter(relic => {
    const matchesCategory = activeCategoryFilter === 'all' || relic.category === activeCategoryFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      relic.title.toLowerCase().includes(query) ||
      relic.subtitle.toLowerCase().includes(query) ||
      relic.origin.toLowerCase().includes(query) ||
      relic.material.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    relicsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-secondary);">
        <p style="font-family: var(--font-decorative); font-size: 1.4rem; color: var(--gold-highlight); margin-bottom: 8px;">No Relics Found</p>
        <p>No antiquities in our ledger match the search query "${searchQuery}".</p>
      </div>
    `;
    return;
  }

  filtered.forEach(relic => {
    const card = document.createElement('article');
    const isCurrent = currentActiveRelic && currentActiveRelic.id === relic.id;
    card.className = `relic-card ${isCurrent ? 'current-active' : ''}`;
    card.dataset.relicId = relic.id;

    const thumbUrl = new URL(relic.thumbnail, window.location.href).href;
    const fileUrl = new URL(relic.file, window.location.href).href;

    card.innerHTML = `
      <!-- Picture Preview Option -->
      <div class="card-thumb-wrapper">
        <img src="${thumbUrl}" alt="${relic.title}" class="card-thumb-img" loading="lazy">
      </div>

      <div class="card-top-meta">
        <span class="card-category">${relic.categoryLabel}</span>
        <span class="card-rarity" style="color: ${relic.rarityColor}; border-color: ${relic.rarityColor};">${relic.rarity}</span>
      </div>

      <h3 class="card-title">${relic.title}</h3>
      <p class="card-subtitle">${relic.subtitle}</p>

      <div class="card-specs-row">
        <span>⚖ ${relic.weight}</span>
        <span>📍 ${relic.origin}</span>
        <span>📦 ${relic.fileSize}</span>
      </div>

      <div class="card-footer">
        <button class="btn-inspect" title="Inspect in 3D Viewport">
          <span>Inspect 3D</span>
          <span>⚔️</span>
        </button>
        <a class="btn-card-download" href="${fileUrl}" download="${relic.file}" title="Download .GLB Model (${relic.fileSize})">
          <span>📥</span>
        </a>
        <button class="btn-lore-modal" title="Read Historical Lore">📜</button>
      </div>
    `;

    // Click on card or inspect button
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-lore-modal')) {
        e.stopPropagation();
        openLoreModal(relic);
      } else if (e.target.closest('.btn-card-download')) {
        e.stopPropagation();
        vintageAudio.playParchmentSound();
      } else {
        selectRelic(relic, true);
      }
    });

    relicsGrid.appendChild(card);
  });
}

// Setup Search
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderRelicsGrid();
});

// Setup HUD Controls
function setupHUDControls() {
  // Toggle Turntable
  btnToggleRotate.addEventListener('click', () => {
    viewer.isRotating = !viewer.isRotating;
    btnToggleRotate.classList.toggle('active', viewer.isRotating);
    vintageAudio.playBrassClick();
  });

  // Toggle Wireframe
  btnToggleWireframe.addEventListener('click', () => {
    viewer.isWireframe = !viewer.isWireframe;
    viewer.toggleWireframe(viewer.isWireframe);
    btnToggleWireframe.classList.toggle('active', viewer.isWireframe);
    vintageAudio.playBrassClick();
  });

  // Reset Camera View
  btnResetView.addEventListener('click', () => {
    viewer.resetView();
    vintageAudio.playBrassClick();
  });

  // Capture Snapshot
  btnCaptureSnapshot.addEventListener('click', () => {
    vintageAudio.playBrassClick();
    viewer.captureDaguerreotype();
  });

  // Lighting presets
  document.querySelectorAll('.light-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.light-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lightPreset = btn.dataset.light;
      viewer.applyLightingPreset(lightPreset);
      vintageAudio.playBrassClick();
    });
  });
}

// Setup Forge Controls
function setupForgeControls() {
  // Patina Slider
  sliderPatina.addEventListener('input', (e) => {
    const val = e.target.value;
    patinaValDisplay.textContent = `${Math.round(val * 100)}%`;
    viewer.setPatina(val);
  });

  // Speed Slider
  sliderSpeed.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    viewer.rotationSpeed = val;
    if (val === 0) {
      speedValDisplay.textContent = 'Paused';
    } else if (val < 0.008) {
      speedValDisplay.textContent = 'Slow Gentle';
    } else if (val < 0.02) {
      speedValDisplay.textContent = 'Standard';
    } else {
      speedValDisplay.textContent = 'Rapid Orbit';
    }
  });

  // Arcane Tint Swatches
  tintPalette.querySelectorAll('.tint-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      tintPalette.querySelectorAll('.tint-swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tint = btn.dataset.tint;
      viewer.setArcaneTint(tint);
      vintageAudio.playBrassClick();
    });
  });
}

// Setup Audio Toggle
function setupAudioToggle() {
  btnSoundToggle.addEventListener('click', () => {
    const isPlaying = vintageAudio.toggleSound();
    btnSoundToggle.classList.toggle('active', isPlaying);
    soundLabel.textContent = isPlaying ? 'Atmosphere: On' : 'Atmosphere: Off';
  });
}

// Lore Modal
function setupModal() {
  modalClose.addEventListener('click', () => {
    loreModal.classList.remove('open');
    vintageAudio.playBrassClick();
  });

  loreModal.addEventListener('click', (e) => {
    if (e.target === loreModal) {
      loreModal.classList.remove('open');
    }
  });

  modalInspectBtn.addEventListener('click', () => {
    if (modalSelectedRelic) {
      loreModal.classList.remove('open');
      selectRelic(modalSelectedRelic, true);
    }
  });
}

function openLoreModal(relic) {
  modalSelectedRelic = relic;
  modalTitle.textContent = relic.title;
  modalCategory.textContent = `${relic.categoryLabel} • ${relic.rarity}`;
  modalCategory.style.color = relic.rarityColor;
  modalSubtitle.textContent = relic.subtitle;

  modalLoreBody.innerHTML = `
    <p style="margin-bottom: 14px;"><strong>Historical Provenance:</strong> ${relic.lore}</p>
    <p style="margin-bottom: 14px;"><strong>Material & Craft:</strong> ${relic.material}. Recovered from <em>${relic.origin}</em>, dating back to <em>${relic.era}</em>.</p>
    <p><strong>Physical Weight:</strong> ${relic.weight} • <strong>Archival Size:</strong> ${relic.fileSize}</p>
  `;

  if (modalDownloadBtn) {
    const fileUrl = new URL(relic.file, window.location.href).href;
    modalDownloadBtn.href = fileUrl;
    modalDownloadBtn.setAttribute('download', relic.file);
  }

  loreModal.classList.add('open');
  vintageAudio.playParchmentSound();
}

// Setup Guestbook
const DEFAULT_GUESTBOOK = [
  {
    name: "Archchancellor Vaelin",
    guild: "High Council of Arcane Scholars",
    message: "The crystallization on the prismatic resonator matches the ancient texts from Mount Moriah.",
    date: "14 hours ago"
  },
  {
    name: "Lady Isolde of Thornwood",
    guild: "Free Mercenary Company",
    message: "That Dwarven War Hammer holds the weight and soul of a hundred siege assaults.",
    date: "2 days ago"
  },
  {
    name: "Brother Geoffrey",
    guild: "Order of the Silver Leaf",
    message: "The apothecary glassware preserved in this reliquary is true museum-grade alchemy.",
    date: "4 days ago"
  }
];

function setupGuestbook() {
  const saved = localStorage.getItem('eldoria_guestbook');
  const entries = saved ? JSON.parse(saved) : DEFAULT_GUESTBOOK;

  renderGuestbookEntries(entries);

  guestbookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('gb-name');
    const guildInput = document.getElementById('gb-guild');
    const msgInput = document.getElementById('gb-message');

    const newEntry = {
      name: nameInput.value.trim(),
      guild: guildInput.value.trim(),
      message: msgInput.value.trim(),
      date: "Just now"
    };

    entries.unshift(newEntry);
    localStorage.setItem('eldoria_guestbook', JSON.stringify(entries));

    renderGuestbookEntries(entries);
    vintageAudio.playParchmentSound();

    nameInput.value = '';
    guildInput.value = '';
    msgInput.value = '';

    const btn = guestbookForm.querySelector('.btn-sign');
    const origText = btn.innerHTML;
    btn.innerHTML = 'Stamped with Wax! 🔏';
    setTimeout(() => {
      btn.innerHTML = origText;
    }, 2000);
  });
}

function renderGuestbookEntries(entries) {
  guestbookEntriesContainer.innerHTML = '';
  entries.forEach(item => {
    const row = document.createElement('div');
    row.className = 'guestbook-entry';
    row.innerHTML = `
      <div>
        <div>
          <span class="entry-author">${escapeHtml(item.name)}</span>
          <span class="entry-guild">${escapeHtml(item.guild)}</span>
        </div>
        <div class="entry-message">"${escapeHtml(item.message)}"</div>
      </div>
      <div class="entry-date">${item.date}</div>
    `;
    guestbookEntriesContainer.appendChild(row);
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
}

// Start on DOM ready
window.addEventListener('DOMContentLoaded', initApp);
