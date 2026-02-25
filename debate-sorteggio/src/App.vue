<script setup>
import { ref, watch, onMounted } from 'vue'

const currentTab = ref(0)
const rawInput = ref('')

const allPlayers = ref([])
const r1Matches = ref([])
const r2Matches = ref({ winnersGroup: [], losersGroup: [] })
const r3Matches = ref({ vv: [], vp: [], pv: [], pp: [] })

const STORAGE_KEY = 'torneo_full_v2';

const saveData = () => {
  const data = {
    currentTab: currentTab.value,
    rawInput: rawInput.value,
    allPlayers: allPlayers.value,
    r1Matches: r1Matches.value,
    r2Matches: r2Matches.value,
    r3Matches: r3Matches.value
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const loadData = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    rawInput.value = parsed.rawInput || '';
    allPlayers.value = parsed.allPlayers || [];
    r1Matches.value = parsed.r1Matches || [];
    r2Matches.value = parsed.r2Matches || { winnersGroup: [], losersGroup: [] };
    r3Matches.value = parsed.r3Matches || { vv: [], vp: [], pv: [], pp: [] };
    currentTab.value = parsed.currentTab || 0;
  }
}

watch([currentTab, rawInput, allPlayers, r1Matches, r2Matches, r3Matches], saveData, { deep: true });
onMounted(loadData);

const shuffle = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const createPairings = (playerList, roundKey) => {
  playerList.forEach(p => p[roundKey] = 'neutral');
  const shuffled = shuffle(playerList);
  const pairings = [];
  while (shuffled.length > 0) {
    const p1 = shuffled.pop();
    const p2 = shuffled.length > 0 ? shuffled.pop() : null;
    if (!p2) p1[roundKey] = 'winner';
    pairings.push({ p1, p2, roundKey });
  }
  return pairings;
}

const toggleMatchResult = (match, playerRole) => {
  const player = match[playerRole];
  const opponent = playerRole === 'p1' ? match.p2 : match.p1;
  const roundKey = match.roundKey;
  if (!opponent) return;
  if (player[roundKey] !== 'winner') {
    player[roundKey] = 'winner';
    opponent[roundKey] = 'loser';
  } else {
    player[roundKey] = 'neutral';
    opponent[roundKey] = 'neutral';
  }
}

const resetAll = () => {
  if (!confirm("Cancellare tutto il torneo e ricominciare?")) return;
  allPlayers.value = [];
  r1Matches.value = [];
  r2Matches.value = { winnersGroup: [], losersGroup: [] };
  r3Matches.value = { vv: [], vp: [], pv: [], pp: [] };
  rawInput.value = '';
  currentTab.value = 0;
  localStorage.removeItem(STORAGE_KEY);
}

const startRound1 = (force = false) => {
  if (force && !confirm("Rigenerare Round 1? Perderai i risultati correnti.")) return;
  if (!rawInput.value.trim()) return alert("Inserisci i nomi!");
  const names = rawInput.value.split('\n').filter(n => n.trim() !== '');
  allPlayers.value = names.map((name, i) => ({
    id: i, name: name.trim(), r1: 'neutral', r2: 'neutral', r3: 'neutral'
  }));
  r1Matches.value = createPairings(allPlayers.value, 'r1');
  r2Matches.value = { winnersGroup: [], losersGroup: [] };
  r3Matches.value = { vv: [], vp: [], pv: [], pp: [] };
  currentTab.value = 1;
}

const generateRound2 = (force = false) => {
  if (force && !confirm("Rigenerare Round 2?")) return;
  const r1Winners = allPlayers.value.filter(p => p.r1 === 'winner');
  const r1Losers = allPlayers.value.filter(p => p.r1 === 'loser');
  if (r1Winners.length + r1Losers.length < allPlayers.value.length) return alert("Completa il Round 1 prima!");
  r2Matches.value.winnersGroup = createPairings(r1Winners, 'r2');
  r2Matches.value.losersGroup = createPairings(r1Losers, 'r2');
  r3Matches.value = { vv: [], vp: [], pv: [], pp: [] };
  currentTab.value = 2;
}

const generateRound3 = (force = false) => {
  if (force && !confirm("Rigenerare Round 3?")) return;
  const r2Played = allPlayers.value.filter(p => p.r2 !== 'neutral');
  if (r2Played.length < allPlayers.value.length) return alert("Completa il Round 2 prima!");
  const groupVV = allPlayers.value.filter(p => p.r1 === 'winner' && p.r2 === 'winner');
  const groupVP = allPlayers.value.filter(p => p.r1 === 'winner' && p.r2 === 'loser');
  const groupPV = allPlayers.value.filter(p => p.r1 === 'loser' && p.r2 === 'winner');
  const groupPP = allPlayers.value.filter(p => p.r1 === 'loser' && p.r2 === 'loser');
  r3Matches.value.vv = createPairings(groupVV, 'r3');
  r3Matches.value.vp = createPairings(groupVP, 'r3');
  r3Matches.value.pv = createPairings(groupPV, 'r3');
  r3Matches.value.pp = createPairings(groupPP, 'r3');
  currentTab.value = 3;
}

const completedR1 = () => allPlayers.value.filter(p => p.r1 !== 'neutral').length
const completedR2 = () => allPlayers.value.filter(p => p.r2 !== 'neutral').length
const totalPlayers = () => allPlayers.value.length
</script>

<template>
  <div class="app-wrapper">
    
    <!-- Animated background -->
    <div class="bg-grid"></div>

    <header class="main-header">
      <div class="header-brand">
        <span class="brand-icon">⚔️</span>
        <div>
          <h1>TORNEO</h1>
          <span class="brand-sub">Tournament Manager</span>
        </div>
      </div>
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
          <span class="nav-icon">🎯</span>
          <span class="nav-label">Setup</span>
        </button>
        <button :class="{ active: currentTab === 1 }" @click="currentTab = 1" :disabled="r1Matches.length === 0">
          <span class="nav-icon">1</span>
          <span class="nav-label">Round 1</span>
          <span v-if="r1Matches.length > 0" class="nav-badge" :class="{ done: completedR1() === totalPlayers() }">
            {{ completedR1() }}/{{ totalPlayers() }}
          </span>
        </button>
        <button :class="{ active: currentTab === 2 }" @click="currentTab = 2" :disabled="r1Matches.length === 0">
          <span class="nav-icon">2</span>
          <span class="nav-label">Round 2</span>
          <span v-if="r2Matches.winnersGroup.length > 0" class="nav-badge" :class="{ done: completedR2() === totalPlayers() }">
            {{ completedR2() }}/{{ totalPlayers() }}
          </span>
        </button>
        <button :class="{ active: currentTab === 3 }" @click="currentTab = 3" :disabled="r2Matches.winnersGroup.length === 0">
          <span class="nav-icon">3</span>
          <span class="nav-label">Round 3</span>
        </button>
      </div>
    </nav>

    <main class="main-content">

      <!-- INPUT SECTION -->
      <section v-if="currentTab === 0" class="tab-pane">
        <div class="input-scene">
          <div class="input-card">
            <div class="input-card-header">
              <h2>Partecipanti</h2>
              <p>Inserisci un nome per riga</p>
            </div>
            <div class="textarea-wrapper">
              <textarea v-model="rawInput" placeholder="Mario Rossi&#10;Luca Bianchi&#10;Anna Verdi&#10;..."></textarea>
              <div class="line-count" v-if="rawInput.trim()">
                {{ rawInput.split('\n').filter(n => n.trim()).length }} giocatori
              </div>
            </div>
            <button class="btn-primary" @click="startRound1(false)">
              <span v-if="r1Matches.length === 0">🚀 INIZIA TORNEO</span>
              <span v-else>⚡ AGGIORNA TORNEO</span>
            </button>
          </div>

          <div class="intro-art">
            <div class="bracket-visual">
              <div class="bv-col">
                <div class="bv-match"><div class="bv-p gold"></div><div class="bv-p"></div></div>
                <div class="bv-match"><div class="bv-p"></div><div class="bv-p gold"></div></div>
              </div>
              <div class="bv-arrow">›</div>
              <div class="bv-col mid">
                <div class="bv-match"><div class="bv-p gold"></div><div class="bv-p"></div></div>
              </div>
              <div class="bv-arrow">›</div>
              <div class="bv-col">
                <div class="bv-match champion"><div class="bv-p champ">🏆</div></div>
              </div>
            </div>
            <p class="intro-hint">Sistema a gironi su 3 round</p>
          </div>
        </div>
      </section>

      <!-- ROUND 1 -->
      <section v-if="currentTab === 1" class="tab-pane">
        <div class="round-header">
          <div class="round-title-group">
            <span class="round-number">01</span>
            <h2>Round 1</h2>
          </div>
          <div class="round-actions">
            <div class="progress-pill">
              <div class="progress-bar" :style="{ width: (completedR1()/totalPlayers()*100) + '%' }"></div>
              <span>{{ completedR1() }}/{{ totalPlayers() }}</span>
            </div>
            <button class="btn-secondary" @click="startRound1(true)">🔄 Rigenera</button>
            <button class="btn-primary small" @click="generateRound2(false)" v-if="completedR1() === totalPlayers()">
              Round 2 →
            </button>
          </div>
        </div>
        <div class="matches-grid">
          <div v-for="(match, i) in r1Matches" :key="i" class="match-card" :class="{ resolved: match.p1.r1 !== 'neutral' }">
            <div class="match-index">#{{ i + 1 }}</div>
            <div class="match-body">
              <div class="player-slot" :class="match.p1.r1" @click="toggleMatchResult(match, 'p1')">
                <span class="slot-badge" v-if="match.p1.r1 === 'winner'">✓</span>
                <span class="slot-badge lose" v-if="match.p1.r1 === 'loser'">✗</span>
                <span class="player-name">{{ match.p1.name }}</span>
              </div>
              <div class="vs-badge">
                <span v-if="match.p2">VS</span>
                <span v-else class="bye-text">BYE</span>
              </div>
              <div v-if="match.p2" class="player-slot" :class="match.p2.r1" @click="toggleMatchResult(match, 'p2')">
                <span class="player-name">{{ match.p2.name }}</span>
                <span class="slot-badge" v-if="match.p2.r1 === 'winner'">✓</span>
                <span class="slot-badge lose" v-if="match.p2.r1 === 'loser'">✗</span>
              </div>
              <div v-else class="player-slot bye">
                <span class="player-name">—</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ROUND 2 -->
      <section v-if="currentTab === 2" class="tab-pane">
        <div class="round-header">
          <div class="round-title-group">
            <span class="round-number">02</span>
            <h2>Round 2</h2>
          </div>
          <div class="round-actions">
            <div v-if="r2Matches.winnersGroup.length > 0" class="progress-pill">
              <div class="progress-bar" :style="{ width: (completedR2()/totalPlayers()*100) + '%' }"></div>
              <span>{{ completedR2() }}/{{ totalPlayers() }}</span>
            </div>
            <button v-if="r2Matches.winnersGroup.length === 0" class="btn-primary" @click="generateRound2(false)">
              ⚡ Genera Abbinamenti
            </button>
            <button v-else class="btn-secondary" @click="generateRound2(true)">🔄 Rigenera</button>
            <button class="btn-primary small" @click="generateRound3(false)" v-if="completedR2() === totalPlayers() && totalPlayers() > 0">
              Round 3 →
            </button>
          </div>
        </div>

        <div v-if="r2Matches.winnersGroup.length > 0" class="two-columns">
          <div class="group-panel winners-panel">
            <div class="group-label">
              <span class="group-icon">🏆</span>
              <span>Girone Vincenti</span>
            </div>
            <div v-for="(match, i) in r2Matches.winnersGroup" :key="i" class="match-card" :class="{ resolved: match.p1.r2 !== 'neutral' }">
              <div class="match-index">#{{ i + 1 }}</div>
              <div class="match-body">
                <div class="player-slot" :class="match.p1.r2" @click="toggleMatchResult(match, 'p1')">
                  <span class="slot-badge" v-if="match.p1.r2 === 'winner'">✓</span>
                  <span class="slot-badge lose" v-if="match.p1.r2 === 'loser'">✗</span>
                  <span class="player-name">{{ match.p1.name }}</span>
                </div>
                <div class="vs-badge"><span v-if="match.p2">VS</span><span v-else class="bye-text">BYE</span></div>
                <div v-if="match.p2" class="player-slot" :class="match.p2.r2" @click="toggleMatchResult(match, 'p2')">
                  <span class="player-name">{{ match.p2.name }}</span>
                  <span class="slot-badge" v-if="match.p2.r2 === 'winner'">✓</span>
                  <span class="slot-badge lose" v-if="match.p2.r2 === 'loser'">✗</span>
                </div>
                <div v-else class="player-slot bye"><span class="player-name">—</span></div>
              </div>
            </div>
          </div>

          <div class="group-panel losers-panel">
            <div class="group-label">
              <span class="group-icon">💀</span>
              <span>Girone Perdenti</span>
            </div>
            <div v-for="(match, i) in r2Matches.losersGroup" :key="i" class="match-card" :class="{ resolved: match.p1.r2 !== 'neutral' }">
              <div class="match-index">#{{ i + 1 }}</div>
              <div class="match-body">
                <div class="player-slot" :class="match.p1.r2" @click="toggleMatchResult(match, 'p1')">
                  <span class="slot-badge" v-if="match.p1.r2 === 'winner'">✓</span>
                  <span class="slot-badge lose" v-if="match.p1.r2 === 'loser'">✗</span>
                  <span class="player-name">{{ match.p1.name }}</span>
                </div>
                <div class="vs-badge"><span v-if="match.p2">VS</span><span v-else class="bye-text">BYE</span></div>
                <div v-if="match.p2" class="player-slot" :class="match.p2.r2" @click="toggleMatchResult(match, 'p2')">
                  <span class="player-name">{{ match.p2.name }}</span>
                  <span class="slot-badge" v-if="match.p2.r2 === 'winner'">✓</span>
                  <span class="slot-badge lose" v-if="match.p2.r2 === 'loser'">✗</span>
                </div>
                <div v-else class="player-slot bye"><span class="player-name">—</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ROUND 3 -->
      <section v-if="currentTab === 3" class="tab-pane">
        <div class="round-header">
          <div class="round-title-group">
            <span class="round-number">03</span>
            <h2>Round Finale</h2>
          </div>
          <div class="round-actions">
            <button v-if="r3Matches.vv.length === 0" class="btn-primary" @click="generateRound3(false)">
              ⚡ Genera Abbinamenti
            </button>
            <button v-else class="btn-secondary" @click="generateRound3(true)">🔄 Rigenera</button>
          </div>
        </div>

        <div v-if="r3Matches.vv.length > 0" class="four-columns">
          <!-- TOP TIER -->
          <div class="group-panel tier-gold">
            <div class="group-label">
              <span class="group-icon">🥇</span>
              <span>TOP TIER</span>
            </div>
            <div v-for="(match, i) in r3Matches.vv" :key="i" class="match-card" :class="{ resolved: match.p1.r3 !== 'neutral' }">
              <div class="match-index">#{{ i + 1 }}</div>
              <div class="match-body">
                <div class="player-slot" :class="match.p1.r3" @click="toggleMatchResult(match, 'p1')">
                  <span class="slot-badge" v-if="match.p1.r3 === 'winner'">✓</span>
                  <span class="slot-badge lose" v-if="match.p1.r3 === 'loser'">✗</span>
                  <span class="player-name">{{ match.p1.name }}</span>
                </div>
                <div class="vs-badge"><span v-if="match.p2">VS</span><span v-else class="bye-text">BYE</span></div>
                <div v-if="match.p2" class="player-slot" :class="match.p2.r3" @click="toggleMatchResult(match, 'p2')">
                  <span class="player-name">{{ match.p2.name }}</span>
                  <span class="slot-badge" v-if="match.p2.r3 === 'winner'">✓</span>
                  <span class="slot-badge lose" v-if="match.p2.r3 === 'loser'">✗</span>
                </div>
                <div v-else class="player-slot bye"><span class="player-name">—</span></div>
              </div>
            </div>
          </div>
          <!-- MID A -->
          <div class="group-panel tier-silver">
            <div class="group-label">
              <span class="group-icon">🥈</span>
              <span>MID TIER A</span>
            </div>
            <div v-for="(match, i) in r3Matches.vp" :key="i" class="match-card" :class="{ resolved: match.p1.r3 !== 'neutral' }">
              <div class="match-index">#{{ i + 1 }}</div>
              <div class="match-body">
                <div class="player-slot" :class="match.p1.r3" @click="toggleMatchResult(match, 'p1')">
                  <span class="slot-badge" v-if="match.p1.r3 === 'winner'">✓</span>
                  <span class="slot-badge lose" v-if="match.p1.r3 === 'loser'">✗</span>
                  <span class="player-name">{{ match.p1.name }}</span>
                </div>
                <div class="vs-badge"><span v-if="match.p2">VS</span><span v-else class="bye-text">BYE</span></div>
                <div v-if="match.p2" class="player-slot" :class="match.p2.r3" @click="toggleMatchResult(match, 'p2')">
                  <span class="player-name">{{ match.p2.name }}</span>
                  <span class="slot-badge" v-if="match.p2.r3 === 'winner'">✓</span>
                  <span class="slot-badge lose" v-if="match.p2.r3 === 'loser'">✗</span>
                </div>
                <div v-else class="player-slot bye"><span class="player-name">—</span></div>
              </div>
            </div>
          </div>
          <!-- MID B -->
          <div class="group-panel tier-bronze">
            <div class="group-label">
              <span class="group-icon">🥉</span>
              <span>MID TIER B</span>
            </div>
            <div v-for="(match, i) in r3Matches.pv" :key="i" class="match-card" :class="{ resolved: match.p1.r3 !== 'neutral' }">
              <div class="match-index">#{{ i + 1 }}</div>
              <div class="match-body">
                <div class="player-slot" :class="match.p1.r3" @click="toggleMatchResult(match, 'p1')">
                  <span class="slot-badge" v-if="match.p1.r3 === 'winner'">✓</span>
                  <span class="slot-badge lose" v-if="match.p1.r3 === 'loser'">✗</span>
                  <span class="player-name">{{ match.p1.name }}</span>
                </div>
                <div class="vs-badge"><span v-if="match.p2">VS</span><span v-else class="bye-text">BYE</span></div>
                <div v-if="match.p2" class="player-slot" :class="match.p2.r3" @click="toggleMatchResult(match, 'p2')">
                  <span class="player-name">{{ match.p2.name }}</span>
                  <span class="slot-badge" v-if="match.p2.r3 === 'winner'">✓</span>
                  <span class="slot-badge lose" v-if="match.p2.r3 === 'loser'">✗</span>
                </div>
                <div v-else class="player-slot bye"><span class="player-name">—</span></div>
              </div>
            </div>
          </div>
          <!-- LOW -->
          <div class="group-panel tier-stone">
            <div class="group-label">
              <span class="group-icon">🪨</span>
              <span>LOW TIER</span>
            </div>
            <div v-for="(match, i) in r3Matches.pp" :key="i" class="match-card" :class="{ resolved: match.p1.r3 !== 'neutral' }">
              <div class="match-index">#{{ i + 1 }}</div>
              <div class="match-body">
                <div class="player-slot" :class="match.p1.r3" @click="toggleMatchResult(match, 'p1')">
                  <span class="slot-badge" v-if="match.p1.r3 === 'winner'">✓</span>
                  <span class="slot-badge lose" v-if="match.p1.r3 === 'loser'">✗</span>
                  <span class="player-name">{{ match.p1.name }}</span>
                </div>
                <div class="vs-badge"><span v-if="match.p2">VS</span><span v-else class="bye-text">BYE</span></div>
                <div v-if="match.p2" class="player-slot" :class="match.p2.r3" @click="toggleMatchResult(match, 'p2')">
                  <span class="player-name">{{ match.p2.name }}</span>
                  <span class="slot-badge" v-if="match.p2.r3 === 'winner'">✓</span>
                  <span class="slot-badge lose" v-if="match.p2.r3 === 'loser'">✗</span>
                </div>
                <div v-else class="player-slot bye"><span class="player-name">—</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

body {
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
  transition: all 0.2s;
  white-space: nowrap;
  text-transform: uppercase;
}
.btn-primary:hover { box-shadow: var(--shadow-accent); transform: translateY(-1px); }
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

/* ── INPUT SECTION ── */
.input-scene {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
  max-width: 900px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .input-scene { grid-template-columns: 1fr 1fr; align-items: center; }
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

.input-card textarea {
  width: 100%;
  height: 220px;
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
.input-card textarea:focus { border-color: var(--accent); }
.input-card textarea::placeholder { color: var(--text-dim); }

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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
}

.player-slot {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.15s;
  min-width: 0;
}
.player-slot:hover { background: rgba(255,255,255,0.04); }

.player-slot.winner {
  background: var(--win-dim);
}
.player-slot.loser {
  background: var(--lose-dim);
}
.player-slot.bye {
  background: var(--bg2);
  cursor: default;
  opacity: 0.5;
  justify-content: center;
}

.player-name {
  font-size: 0.88rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.player-slot.winner .player-name { color: var(--win); font-weight: 700; }
.player-slot.loser .player-name { color: var(--text-dim); text-decoration: line-through; }

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

/* Panel border accents */
.winners-panel { border-top: 2px solid var(--win); }
.losers-panel { border-top: 2px solid var(--lose); }
.tier-gold { border-top: 2px solid var(--gold); }
.tier-silver { border-top: 2px solid var(--silver); }
.tier-bronze { border-top: 2px solid var(--bronze); }
.tier-stone { border-top: 2px solid var(--stone); }

.winners-panel .group-label { color: var(--win); }
.losers-panel .group-label { color: var(--lose); }
.tier-gold .group-label { color: var(--gold); }
.tier-silver .group-label { color: var(--silver); }
.tier-bronze .group-label { color: var(--bronze); }
.tier-stone .group-label { color: var(--stone); }

/* ── LAYOUTS ── */
.two-columns {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

.four-columns {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .two-columns { grid-template-columns: 1fr 1fr; }
  .four-columns { grid-template-columns: 1fr 1fr; }
}

@media (min-width: 1280px) {
  .four-columns { grid-template-columns: 1fr 1fr 1fr 1fr; }
}

/* ── ANIMATIONS ── */
.tab-pane {
  animation: fadeUp 0.25s ease;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--surface2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-active); }

/* ── MOBILE REFINEMENTS ── */
@media (max-width: 480px) {
  .main-header { padding: 12px 16px; }
  .header-brand h1 { font-size: 1.5rem; }
  .brand-sub { display: none; }
  .main-content { padding: 16px 12px; }
  .round-number { font-size: 2.5rem; }
  .matches-grid { grid-template-columns: 1fr; }
}
</style>