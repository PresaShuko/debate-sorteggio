<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Round1 from './components/Round1.vue'
import Round2 from './components/Round2.vue'
import Round3 from './components/Round3.vue'
const deferredPrompt = ref(null)
const showInstallButton = ref(false)

const currentTab = ref(0)
const allPlayers = ref([])
const r1Matches  = ref([])
const r2Matches  = ref([])
const r3Matches  = ref({ v: [], p: [], m: [] })

const STORAGE_KEY = 'torneo_refactored'

const saveData = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentTab: currentTab.value,
    allPlayers: allPlayers.value,
    r1Matches:  r1Matches.value,
    r2Matches:  r2Matches.value,
    r3Matches:  r3Matches.value
  }))
}

const loadData = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const d = JSON.parse(saved)
    allPlayers.value = d.allPlayers || []
    r1Matches.value  = d.r1Matches  || []
    r2Matches.value  = d.r2Matches  || []
    r3Matches.value  = d.r3Matches  || { v: [], p: [], m: [] }
    currentTab.value = d.currentTab || 0
  }
}

watch([currentTab, allPlayers, r1Matches, r2Matches, r3Matches], saveData, { deep: true })
onMounted(loadData)

const resetAll = () => {
  if (!confirm('Cancellare tutto il torneo e ricominciare?')) return
  allPlayers.value = []
  r1Matches.value  = []
  r2Matches.value  = []
  r3Matches.value  = { v: [], p: [], m: [] }
  currentTab.value = 0
  localStorage.removeItem(STORAGE_KEY)
}

// 🔥 Progresso calcolato dai match, NON da allPlayers.length
// Così se R2 ha più/meno giocatori di R1, i badge non si influenzano
const countFromMatches = (matches, field) => {
  let completed = 0, total = 0
  matches.forEach(m => {
    total += m.p2 ? 2 : 1
    if (m.p1[field] !== 'neutral') completed++
    if (m.p2 && m.p2[field] !== 'neutral') completed++
  })
  return { completed, total }
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    showInstallButton.value = true
  })
})

const installPWA = async () => {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    showInstallButton.value = false
  }
  deferredPrompt.value = null
}

const r1Progress = computed(() => countFromMatches(r1Matches.value, 'r1'))
const r2Progress = computed(() => countFromMatches(r2Matches.value, 'r2'))
</script>

<template>
  <div class="app-wrapper">
    <div class="bg-grid"></div>

    <header class="main-header">
      <div class="header-brand">
        <span class="brand-icon">⚔️</span>
        <div>
          <h1>TORNEO</h1>
          <span class="brand-sub">Tournament Manager</span>
        </div>
      </div>

      <button v-if="showInstallButton" class="btn-install" @click="installPWA">
      📲 Installa App
      </button>

      <div class="header-actions">
        <div v-if="allPlayers.length > 0" class="player-badge">
          <span class="badge-icon">👥</span>
          <span>{{ allPlayers.length }} giocatori</span>
        </div>
        <button class="btn-reset" @click="resetAll" v-if="allPlayers.length > 0">
          <span>↩</span> Reset
        </button>
      </div>
    </header>

    <nav class="sticky-nav">
      <div class="nav-container">
        <button :class="{ active: currentTab === 0 }" @click="currentTab = 0">
          <span class="nav-icon">1</span>
          <span class="nav-label">Round 1</span>
          <span v-if="r1Matches.length > 0" class="nav-badge"
                :class="{ done: r1Progress.completed === r1Progress.total }">
            {{ r1Progress.completed }}/{{ r1Progress.total }}
          </span>
        </button>
        <button :class="{ active: currentTab === 1 }" @click="currentTab = 1"
                :disabled="r1Matches.length === 0">
          <span class="nav-icon">2</span>
          <span class="nav-label">Round 2</span>
          <span v-if="r2Matches.length > 0" class="nav-badge"
                :class="{ done: r2Progress.completed === r2Progress.total }">
            {{ r2Progress.completed }}/{{ r2Progress.total }}
          </span>
        </button>
        <button :class="{ active: currentTab === 2 }" @click="currentTab = 2"
                :disabled="r2Matches.length === 0">
          <span class="nav-icon">3</span>
          <span class="nav-label">Round 3</span>
        </button>
      </div>
    </nav>

    <main class="main-content">
      <Round1
        v-if="currentTab === 0"
        :all-players="allPlayers"
        :r1-matches="r1Matches"
        @update-players="(p) => allPlayers = p"
        @update-matches="(m) => r1Matches = m"
      />
      <Round2
        v-if="currentTab === 1"
        :all-players="allPlayers"
        :r2-matches="r2Matches"
        @update-players="(p) => allPlayers = p"
        @update-matches="(m) => r2Matches = m"
      />
      <Round3
        v-if="currentTab === 2"
        :all-players="allPlayers"
        :r3-matches="r3Matches"
        @update-players="(p) => allPlayers = p"
        @update-matches="(m) => r3Matches = m"
      />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');

/* ── RESET & BASE ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0d0f14;
  --bg2: #13161e;
  --bg3: #1a1e28;
  --surface: #1e2330;
  --surface2: #252c3d;
  --border: rgba(255,255,255,0.07);
  --border-active: rgba(255,255,255,0.15);

  --accent: #00e5ff;
  --accent-dim: rgba(0, 229, 255, 0.12);
  --accent-glow: rgba(0, 229, 255, 0.3);

  --gold: #ffd166;
  --gold-dim: rgba(255, 209, 102, 0.12);
  --silver: #a8b2d8;
  --bronze: #e07b39;
  --stone: #5c6480;

  --win: #06d6a0;
  --win-dim: rgba(6, 214, 160, 0.12);
  --lose: #ef4444;
  --lose-dim: rgba(239, 68, 68, 0.1);

  --text: #e8eaf0;
  --text-muted: #7480a0;
  --text-dim: #4a5270;

  --radius: 10px;
  --radius-lg: 16px;
  --shadow: 0 4px 24px rgba(0,0,0,0.4);
  --shadow-accent: 0 0 20px var(--accent-glow);
}

/* ── PREVIENE SCROLL ORIZZONTALE ── */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
  font-family: 'DM Sans', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* ── BACKGROUND GRID ── */
.bg-grid {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: 0;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 80%);
}

.app-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── HEADER ── */
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  background: rgba(13, 15, 20, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon { font-size: 1.6rem; }

.header-brand h1 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8rem;
  letter-spacing: 3px;
  color: var(--accent);
  line-height: 1;
  text-shadow: 0 0 20px var(--accent-glow);
}

.brand-sub {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-top: 2px;
}

.header-actions { display: flex; align-items: center; gap: 10px; }

.player-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--accent-dim);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent);
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius);
  color: var(--lose);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-reset:hover { background: rgba(239, 68, 68, 0.2); border-color: var(--lose); }

/* ── NAV ── */
.sticky-nav {
  position: sticky;
  top: 61px;
  z-index: 90;
  background: rgba(13, 15, 20, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
}

.nav-container {
  display: flex;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}
.nav-container::-webkit-scrollbar { display: none; }

.sticky-nav button {
  flex: 1;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-dim);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
}

.nav-icon {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1rem;
  letter-spacing: 1px;
}

.sticky-nav button.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  background: var(--accent-dim);
}

.sticky-nav button:disabled { opacity: 0.3; cursor: not-allowed; }
.sticky-nav button:not(:disabled):hover:not(.active) { color: var(--text); background: rgba(255,255,255,0.04); }

.nav-badge {
  display: inline-block;
  padding: 1px 7px;
  background: var(--surface2);
  border-radius: 999px;
  font-size: 0.65rem;
  color: var(--text-muted);
  font-weight: 700;
}
.nav-badge.done { background: var(--win-dim); color: var(--win); }

/* ── MAIN CONTENT ── */
.main-content {
  flex: 1;
  padding: 24px 20px;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
}

/* ── BUTTONS ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: var(--radius);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: box-shadow 0.2s;
  white-space: nowrap;
  text-transform: uppercase;
}
.btn-primary:hover { box-shadow: var(--shadow-accent); }
.btn-primary.small { padding: 8px 16px; font-size: 0.8rem; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--surface);
  border: 1px solid var(--border-active);
  border-radius: var(--radius);
  color: var(--text-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-secondary:hover { color: var(--text); border-color: rgba(255,255,255,0.25); }
.btn-secondary.active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-dim);
}

/* ── INPUT SECTION ── */
.input-scene {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
  max-width: 900px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .input-scene { grid-template-columns: 1fr 1fr; align-items: start; }
}

.input-scene.grid-2x2 {
  max-width: 1200px;
  grid-template-columns: 1fr 1fr;
}

.input-scene .btn-primary-full {
  grid-column: 1 / -1;
  justify-self: center;
}

.input-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: var(--shadow);
}

.input-card-header h2 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8rem;
  letter-spacing: 2px;
  color: var(--text);
}
.input-card-header p {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.textarea-wrapper { position: relative; }

.input-card textarea,
.group-input {
  width: 100%;
  height: 180px;
  padding: 14px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: 'DM Mono', 'DM Sans', monospace;
  font-size: 0.9rem;
  line-height: 1.7;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}
.input-card textarea:focus,
.group-input:focus { border-color: var(--accent); }
.input-card textarea::placeholder,
.group-input::placeholder { color: var(--text-dim); }

.input-card textarea.tall { height: 220px; }

.line-count {
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--bg2);
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--accent-dim);
}
.textarea-wrapper .line-count { position: absolute; }
.line-count-static {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--bg2);
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--accent-dim);
  text-align: right;
  align-self: flex-end;
}

.intro-art {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
}

.bracket-visual {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bv-col { display: flex; flex-direction: column; gap: 6px; }
.bv-match {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 8px;
}
.bv-match.champion { border-color: var(--gold); background: var(--gold-dim); }
.bv-p {
  width: 60px;
  height: 8px;
  background: var(--surface2);
  border-radius: 4px;
}
.bv-p.gold { background: var(--gold); }
.bv-p.champ { background: none; font-size: 1.4rem; height: auto; width: auto; text-align: center; }

.bv-arrow { font-size: 1.2rem; color: var(--text-dim); }

.intro-hint {
  font-size: 0.75rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-dim);
  font-weight: 600;
}

/* ── ROUND HEADER ── */
.round-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.round-title-group {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.round-number {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 3.5rem;
  line-height: 1;
  color: var(--text-dim);
  letter-spacing: 2px;
}

.round-title-group h2 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8rem;
  letter-spacing: 2px;
  color: var(--text);
}

.round-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.progress-pill {
  position: relative;
  height: 28px;
  min-width: 90px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.progress-bar {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: var(--win-dim);
  transition: width 0.4s ease;
}
.progress-pill span {
  position: relative;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--win);
  padding: 0 12px;
}

/* ── MATCH CARDS ── */
.matches-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, 1fr);
  grid-column-gap: 50px;
  grid-row-gap: 20px;
}

.match-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
  position: relative;
}
.match-card.resolved { border-color: var(--border-active); }
.match-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.3); }

.match-index {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--text-dim);
  letter-spacing: 0.5px;
}

.match-body {
  display: flex;
  flex-direction: row;
  min-height: 52px;
  height: auto;
}

.player-slot {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
  min-width: 0;
}
.player-slot:hover { background: rgba(255,255,255,0.04); }

.player-slot.winner { background: var(--win-dim); }
.player-slot.loser  { background: var(--lose-dim); }
.player-slot.bye {
  background: var(--bg2);
  cursor: default;
  opacity: 0.5;
  justify-content: center;
  align-items: center;
}

/* ── NOME GIOCATORE: wrap invece di troncare ── */
.player-name {
  font-size: 0.88rem;
  font-weight: 500;
  white-space: normal;
  word-break: break-word;
  overflow: visible;
  line-height: 1.3;
  flex: 1;
}
.player-slot.winner .player-name { color: var(--win); font-weight: 700; }
.player-slot.loser  .player-name { color: var(--text-dim); }

.slot-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 700;
  flex-shrink: 0;
  background: var(--win);
  color: #000;
  margin-top: 1px;
}
.slot-badge.lose { background: var(--lose); color: #fff; }

.vs-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  flex-shrink: 0;
  background: var(--bg2);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--text-dim);
  text-transform: uppercase;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
}

.bye-text { color: var(--accent); }

/* ── GROUP PANELS ── */
.group-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--border);
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  letter-spacing: 2px;
  color: var(--text-muted);
}
.group-icon { font-size: 1.1rem; }

.winners-panel { border-top: 2px solid var(--win); }
.losers-panel  { border-top: 2px solid var(--lose); }
.tier-gold     { border-top: 2px solid var(--gold); }
.tier-silver   { border-top: 2px solid var(--silver); }
.tier-bronze   { border-top: 2px solid var(--bronze); }
.tier-stone    { border-top: 2px solid var(--stone); }

.winners-panel .group-label { color: var(--win); }
.losers-panel  .group-label { color: var(--lose); }
.tier-gold     .group-label { color: var(--gold); }
.tier-silver   .group-label { color: var(--silver); }
.tier-bronze   .group-label { color: var(--bronze); }
.tier-stone    .group-label { color: var(--stone); }

/* ── LAYOUTS ── */
.two-columns {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

.grid-2x2 {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 600px) {
  .two-columns { grid-template-columns: 1fr 1fr; }
  .grid-2x2   { grid-template-columns: 1fr 1fr; }
}

/* ── EDIT PANEL ── */
.edit-panel {
  background: var(--bg2);
  border: 1px solid var(--border-active);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 24px;
  animation: fadeUp 0.2s ease;
}

.edit-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.edit-panel-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  letter-spacing: 2px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-panel-body {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}

@media (min-width: 600px) {
  .edit-panel-body { grid-template-columns: 1fr 1fr; }
}

.edit-panel-body.grid-2x2-inner {
  grid-template-columns: 1fr 1fr;
}

.edit-panel-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-panel-field label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-panel-field textarea {
  width: 100%;
  height: 140px;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: 'DM Mono', 'DM Sans', monospace;
  font-size: 0.85rem;
  line-height: 1.7;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}
.edit-panel-field textarea:focus { border-color: var(--accent); }

.edit-panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  grid-column: 1 / -1;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border-active);
  border-radius: var(--radius);
  color: var(--text-dim);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.25); }

/* ── ANIMATIONS ── */
.tab-pane {
  animation: fadeUp 0.25s ease;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--surface2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-active); }

/* ── PWA INSTALL BUTTON ── */
.btn-install {
  background: linear-gradient(135deg, #00e5ff 0%, #2979ff 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 229, 255, 0.4);
  animation: pulse 2s infinite;
  margin-right: 10px;
}

@keyframes pulse {
  0%   { box-shadow: 0 0 0 0   rgba(0, 229, 255, 0.7); }
  70%  { box-shadow: 0 0 0 10px rgba(0, 229, 255, 0);   }
  100% { box-shadow: 0 0 0 0   rgba(0, 229, 255, 0);    }
}

/* ══════════════════════════════════════════════
   RESPONSIVE — TABLET (≤ 900px)
   ══════════════════════════════════════════════ */
@media (max-width: 900px) {

  /* Una sola colonna di match */
  .matches-grid {
    grid-template-columns: 1fr;
    grid-column-gap: 0;
    grid-row-gap: 12px;
  }

  /* Round 3: una colonna */
  .grid-r3 {
    grid-template-columns: 1fr;
  }

  /* Edit panel interno a 2 colonne → 1 */
  .edit-panel-body.grid-2x2-inner {
    grid-template-columns: 1fr;
  }
}

/* ══════════════════════════════════════════════
   RESPONSIVE — MOBILE (≤ 600px)
   ══════════════════════════════════════════════ */
@media (max-width: 600px) {

  /* Nascondi player badge nell'header per risparmiare spazio */
  .player-badge { display: none; }

  .main-header { padding: 12px 16px; }
  .header-brand h1 { font-size: 1.5rem; }
  .brand-sub { display: none; }
  .main-content { padding: 16px 12px; }
  .round-number { font-size: 2.5rem; }

  /* Round header su due righe */
  .round-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .round-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .progress-pill { min-width: 70px; }

  /* Input cards */
  .input-card { padding: 18px 16px; }
  .edit-panel-field textarea { height: 100px; }

  /* Nav */
  .sticky-nav button {
    font-size: 0.68rem;
    padding: 10px 8px;
    letter-spacing: 0;
  }

  /* Match slot */
  .player-slot { padding: 8px 10px; }
  .player-name { font-size: 0.82rem; }

  .vs-badge {
    width: 30px;
    font-size: 0.55rem;
  }

  .round-actions .btn-secondary {
    padding: 7px 10px;
    font-size: 0.75rem;
  }

  .group-panel { padding: 12px; }
}
</style>