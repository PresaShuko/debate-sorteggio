<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  allPlayers: Array,
  r3Matches:  Object   // { v: [], p: [] }
})

const emit = defineEmits(['updatePlayers', 'updateMatches'])

// Pre-compila con i nomi da allPlayers divisi per risultato r2
const initialV = props.allPlayers.filter(p => p.r2 === 'winner').map(p => p.name).join('\n')
const initialP = props.allPlayers.filter(p => p.r2 === 'loser').map(p => p.name).join('\n')

const inputV = ref(initialV)
const inputP = ref(initialP)

const editMode = ref(false)
const editV    = ref('')
const editP    = ref('')

const lineCount = (text) => text.split('\n').filter(n => n.trim()).length

const isInputPhase = computed(() =>
  (!props.r3Matches.v || props.r3Matches.v.length === 0) &&
  (!props.r3Matches.p || props.r3Matches.p.length === 0)
)

const shuffle = (array) => {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const createPairings = (players) => {
  const shuffled = shuffle([...players])
  const pairings = []
  while (shuffled.length > 0) {
    const p1 = shuffled.pop()
    const p2 = shuffled.length ? shuffled.pop() : null
    p1.r3 = 'neutral'
    if (p2) p2.r3 = 'neutral'
    else p1.r3 = 'winner'
    pairings.push({ p1, p2 })
  }
  return pairings
}

// Costruisce giocatori preservando r1 e r2 — resetta solo r3
const buildPlayers = (textV, textP) => {
  const process = (text, r2Val) =>
    text.split('\n').map(n => n.trim()).filter(Boolean).map(name => {
      const existing = props.allPlayers.find(p => p.name === name)
      // 🔥 Preserva r1 e r2 — resetta solo r3
      return existing
        ? { ...existing, r3: 'neutral' }
        : { id: 0, name, r1: 'neutral', r2: r2Val, r3: 'neutral' }
    })
  const winners = process(textV, 'winner')
  const losers  = process(textP, 'loser')
  return [...winners, ...losers].map((p, i) => ({ ...p, id: i }))
}

const generateRound3 = () => {
  const newPlayers = buildPlayers(inputV.value, inputP.value)
  emit('updatePlayers', newPlayers)
  emit('updateMatches', {
    v: createPairings(newPlayers.filter(p => p.r2 === 'winner')),
    p: createPairings(newPlayers.filter(p => p.r2 === 'loser')),
  })
}

const rimescola = () => {
  const players = props.allPlayers.map(p => ({ ...p, r3: 'neutral' }))
  emit('updatePlayers', players)
  emit('updateMatches', {
    v: createPairings(players.filter(p => p.r2 === 'winner')),
    p: createPairings(players.filter(p => p.r2 === 'loser')),
  })
}

const openEdit = () => {
  editV.value = props.allPlayers.filter(p => p.r2 === 'winner').map(p => p.name).join('\n')
  editP.value = props.allPlayers.filter(p => p.r2 === 'loser').map(p => p.name).join('\n')
  editMode.value = true
}
const cancelEdit = () => { editMode.value = false }

const applyEdit = () => {
  if (!editV.value.trim() && !editP.value.trim()) return alert('Le liste non possono essere entrambe vuote!')
  const newPlayers = buildPlayers(editV.value, editP.value)
  emit('updatePlayers', newPlayers)
  emit('updateMatches', {
    v: createPairings(newPlayers.filter(p => p.r2 === 'winner')),
    p: createPairings(newPlayers.filter(p => p.r2 === 'loser')),
  })
  editMode.value = false
}

const toggleMatchResult = (match, role, group) => {
  const player   = match[role]
  const opponent = role === 'p1' ? match.p2 : match.p1
  if (!opponent) return

  if (player.r3 !== 'winner') {
    player.r3   = 'winner'
    opponent.r3 = 'loser'
  } else {
    player.r3 = opponent.r3 = 'neutral'
  }

  const updateGroup = (key) =>
    props.r3Matches[key].map(m =>
      m.p1.id === match.p1.id && m.p2?.id === match.p2?.id ? match : m
    )

  emit('updateMatches', { v: updateGroup('v'), p: updateGroup('p') })
}
</script>

<template>
  <div class="tab-pane">

    <!-- ── Header ── -->
    <div class="round-header">
      <div class="round-title-group">
        <span class="round-number">03</span>
        <h2>Round Finale</h2>
      </div>
      <div class="round-actions">
        <template v-if="!isInputPhase">
          <button class="btn-secondary" @click="rimescola">🔀 Rimescola</button>
          <button class="btn-secondary" :class="{ active: editMode }"
                  @click="editMode ? cancelEdit() : openEdit()">✏️ Modifica</button>
        </template>
      </div>
    </div>

    <!-- ── Edit panel ── -->
    <div v-if="editMode && !isInputPhase" class="edit-panel">
      <div class="edit-panel-header">
        <span class="edit-panel-title">✏️ Modifica liste Round 3</span>
        <button class="btn-ghost" @click="cancelEdit">✕ Annulla</button>
      </div>
      <div class="edit-panel-body grid-2x2-inner">
        <div class="edit-panel-field">
          <label>🏆 Vincenti Round 2</label>
          <textarea v-model="editV" style="height: 180px"></textarea>
        </div>
        <div class="edit-panel-field">
          <label>💀 Perdenti Round 2</label>
          <textarea v-model="editP" style="height: 180px"></textarea>
        </div>
        <div class="edit-panel-actions">
          <button class="btn-primary" @click="applyEdit">🎲 Applica e Risorteggia</button>
          <span style="font-size:0.75rem; color:var(--text-dim)">
            {{ lineCount(editV) + lineCount(editP) }} giocatori
          </span>
        </div>
      </div>
    </div>

    <!-- ── Fase INPUT: textarea precompilate ── -->
    <div v-if="isInputPhase" class="input-scene" style="grid-template-columns: 1fr 1fr; gap: 20px;">
      <div class="input-card">
        <div class="input-card-header">
          <h2>🏆 Vincenti R2</h2>
          <p>Modifica o conferma i vincenti</p>
        </div>
        <div class="textarea-wrapper">
          <textarea class="tall" v-model="inputV"></textarea>
          <div class="line-count" v-if="inputV.trim()">{{ lineCount(inputV) }} giocatori</div>
        </div>
      </div>

      <div class="input-card">
        <div class="input-card-header">
          <h2>💀 Perdenti R2</h2>
          <p>Modifica o conferma i perdenti</p>
        </div>
        <div class="textarea-wrapper">
          <textarea class="tall" v-model="inputP"></textarea>
          <div class="line-count" v-if="inputP.trim()">{{ lineCount(inputP) }} giocatori</div>
        </div>
      </div>

      <div style="grid-column: 1 / -1; display: flex; justify-content: center; margin-top: 8px;">
        <button class="btn-primary" @click="generateRound3">🎲 SORTEGGIA ROUND FINALE</button>
      </div>
    </div>

    <!-- ── Fase MATCHES: 2 gironi ── -->
    <div v-else class="grid-2x2">

      <!-- Vincenti -->
      <div class="group-panel tier-gold">
        <div class="group-label"><span>🏆 Vincenti Round 2</span></div>
        <div v-for="(m, i) in r3Matches.v" :key="m.p1.id" class="match-card"
             :class="{ resolved: m.p1.r3 !== 'neutral' }">
          <div class="match-index">#{{ i + 1 }}</div>
          <div class="match-body">
            <div class="player-slot" :class="m.p1.r3" @click="toggleMatchResult(m, 'p1', 'v')">
              <span class="slot-badge" v-if="m.p1.r3 === 'winner'">✓</span>
              <span class="slot-badge lose" v-if="m.p1.r3 === 'loser'">✗</span>
              <span class="player-name">{{ m.p1.name }}</span>
            </div>
            <div class="vs-badge">
              <span v-if="m.p2">VS</span>
              <span v-else class="bye-text">BYE</span>
            </div>
            <div v-if="m.p2" class="player-slot" :class="m.p2.r3"
                 @click="toggleMatchResult(m, 'p2', 'v')">
              <span class="player-name">{{ m.p2.name }}</span>
              <span class="slot-badge" v-if="m.p2.r3 === 'winner'">✓</span>
              <span class="slot-badge lose" v-if="m.p2.r3 === 'loser'">✗</span>
            </div>
            <div v-else class="player-slot bye"><span class="player-name">—</span></div>
          </div>
        </div>
      </div>

      <!-- Perdenti -->
      <div class="group-panel tier-stone">
        <div class="group-label"><span>💀 Perdenti Round 2</span></div>
        <div v-for="(m, i) in r3Matches.p" :key="m.p1.id" class="match-card"
             :class="{ resolved: m.p1.r3 !== 'neutral' }">
          <div class="match-index">#{{ i + 1 }}</div>
          <div class="match-body">
            <div class="player-slot" :class="m.p1.r3" @click="toggleMatchResult(m, 'p1', 'p')">
              <span class="slot-badge" v-if="m.p1.r3 === 'winner'">✓</span>
              <span class="slot-badge lose" v-if="m.p1.r3 === 'loser'">✗</span>
              <span class="player-name">{{ m.p1.name }}</span>
            </div>
            <div class="vs-badge">
              <span v-if="m.p2">VS</span>
              <span v-else class="bye-text">BYE</span>
            </div>
            <div v-if="m.p2" class="player-slot" :class="m.p2.r3"
                 @click="toggleMatchResult(m, 'p2', 'p')">
              <span class="player-name">{{ m.p2.name }}</span>
              <span class="slot-badge" v-if="m.p2.r3 === 'winner'">✓</span>
              <span class="slot-badge lose" v-if="m.p2.r3 === 'loser'">✗</span>
            </div>
            <div v-else class="player-slot bye"><span class="player-name">—</span></div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>