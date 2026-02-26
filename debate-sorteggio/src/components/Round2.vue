<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  allPlayers: Array,
  r2Matches:  Array
})

const emit = defineEmits(['updatePlayers', 'updateMatches'])

// Se ci sono già partite, salta la schermata iniziale
const firstScreen = ref(props.r2Matches.length === 0)

// Pre-compila con i nomi attuali di allPlayers
const rawInput  = ref(props.allPlayers.map(p => p.name).join('\n'))
const editMode  = ref(false)
const editInput = ref('')

const lineCount = (text) => text.split('\n').filter(n => n.trim()).length

// Progresso calcolato dai match, non da allPlayers
const completed = computed(() => props.r2Matches.reduce((a, m) => {
  if (m.p1.r2 !== 'neutral') a++
  if (m.p2?.r2 !== 'neutral') a++
  return a
}, 0))
const total = computed(() => props.r2Matches.reduce((a, m) => a + (m.p2 ? 2 : 1), 0))

const shuffle = (array) => {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const createPairings = (playerList) => {
  playerList.forEach(p => (p.r2 = 'neutral'))
  const shuffled = shuffle(playerList)
  const pairings = []
  while (shuffled.length > 0) {
    const p1 = shuffled.pop()
    const p2 = shuffled.length > 0 ? shuffled.pop() : null
    if (!p2) p1.r2 = 'winner'
    pairings.push({ p1, p2, roundKey: 'r2' })
  }
  return pairings
}

// Costruisce la lista giocatori aggiornata preservando i campi degli altri round
const buildPlayers = (names) =>
  names.map((name, i) => {
    const existing = props.allPlayers.find(p => p.name === name)
    // 🔥 Preserva r1 e r3 — resetta solo r2
    return existing
      ? { ...existing, id: i, r2: 'neutral' }
      : { id: i, name: name.trim(), r1: 'neutral', r2: 'neutral', r3: 'neutral' }
  })

const generateRound2 = () => {
  if (!rawInput.value.trim()) return alert('Inserisci i nomi!')
  firstScreen.value = false
  const names = rawInput.value.split('\n').filter(n => n.trim())
  const players = buildPlayers(names)
  emit('updatePlayers', players)
  emit('updateMatches', createPairings(players))
}

const rimescola = () => {
  // 🔥 Crea copie fresche preservando i campi degli altri round
  const players = props.allPlayers.map(p => ({ ...p, r2: 'neutral' }))
  emit('updatePlayers', players)
  emit('updateMatches', createPairings(players))
}

const openEdit = () => {
  editInput.value = props.allPlayers.map(p => p.name).join('\n')
  editMode.value  = true
}
const cancelEdit = () => { editMode.value = false }

const applyEdit = () => {
  if (!editInput.value.trim()) return alert('La lista non può essere vuota!')
  const names = editInput.value.split('\n').filter(n => n.trim())
  const players = buildPlayers(names)
  emit('updatePlayers', players)
  emit('updateMatches', createPairings(players))
  editMode.value = false
}

const toggleMatchResult = (match, playerRole) => {
  const player   = match[playerRole]
  const opponent = playerRole === 'p1' ? match.p2 : match.p1
  if (!opponent) return

  if (player.r2 !== 'winner') {
    player.r2   = 'winner'
    opponent.r2 = 'loser'
  } else {
    player.r2   = 'neutral'
    opponent.r2 = 'neutral'
  }

  emit('updateMatches', props.r2Matches.map(m =>
    m.p1.id === match.p1.id && m.p2?.id === match.p2?.id ? match : m
  ))
}
</script>

<template>
  <div class="tab-pane">
    <div v-if="firstScreen" class="input-scene">
      <div class="input-card">
        <div class="input-card-header">
          <h2>Partecipanti</h2>
          <p>Modifica o conferma i partecipanti per il Round 2</p>
        </div>
        <div class="textarea-wrapper">
          <textarea class="tall" v-model="rawInput"></textarea>
          <div class="line-count" v-if="rawInput.trim()">{{ lineCount(rawInput) }} giocatori</div>
        </div>
        <button class="btn-primary" @click="generateRound2">🎲 SORTEGGIA ROUND 2</button>
      </div>
    </div>

    <div v-else>
      <div class="round-header">
        <div class="round-title-group">
          <span class="round-number">02</span>
          <h2>Round 2</h2>
        </div>
        <div class="round-actions">
          <div class="progress-pill">
            <div class="progress-bar" :style="{ width: (completed / total * 100) + '%' }"></div>
            <span>{{ completed }}/{{ total }}</span>
          </div>
          <button class="btn-secondary" @click="rimescola">🔀 Rimescola</button>
          <button class="btn-secondary" :class="{ active: editMode }"
                  @click="editMode ? cancelEdit() : openEdit()">✏️ Modifica</button>
        </div>
      </div>

      <div v-if="editMode" class="edit-panel">
        <div class="edit-panel-header">
          <span class="edit-panel-title">✏️ Modifica lista partecipanti</span>
          <button class="btn-ghost" @click="cancelEdit">✕ Annulla</button>
        </div>
        <div class="edit-panel-body">
          <div class="edit-panel-field" style="grid-column: 1 / -1">
            <label>👥 Giocatori — un nome per riga</label>
            <textarea v-model="editInput" style="height: 200px"></textarea>
          </div>
          <div class="edit-panel-actions">
            <button class="btn-primary" @click="applyEdit">🎲 Applica e Risorteggia</button>
            <span style="font-size: 0.75rem; color: var(--text-dim)">{{ lineCount(editInput) }} giocatori</span>
          </div>
        </div>
      </div>

      <div class="matches-grid">
        <div v-for="(match, i) in r2Matches" :key="i" class="match-card"
             :class="{ resolved: match.p1.r2 !== 'neutral' }">
          <div class="match-index">#{{ i + 1 }}</div>
          <div class="match-body">
            <div class="player-slot" :class="match.p1.r2" @click="toggleMatchResult(match, 'p1')">
              <span class="slot-badge" v-if="match.p1.r2 === 'winner'">✓</span>
              <span class="slot-badge lose" v-if="match.p1.r2 === 'loser'">✗</span>
              <span class="player-name">{{ match.p1.name }}</span>
            </div>
            <div class="vs-badge">
              <span v-if="match.p2">VS</span>
              <span v-else class="bye-text">BYE</span>
            </div>
            <div v-if="match.p2" class="player-slot" :class="match.p2.r2"
                 @click="toggleMatchResult(match, 'p2')">
              <span class="player-name">{{ match.p2.name }}</span>
              <span class="slot-badge" v-if="match.p2.r2 === 'winner'">✓</span>
              <span class="slot-badge lose" v-if="match.p2.r2 === 'loser'">✗</span>
            </div>
            <div v-else class="player-slot bye"><span class="player-name">—</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>