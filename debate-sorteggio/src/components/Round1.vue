<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  allPlayers: Array,
  r1Matches:  Array
})

const emit = defineEmits(['updatePlayers', 'updateMatches'])

const rawInput  = ref('')
const editMode  = ref(false)
const editInput = ref('')

const lineCount = (text) => text.split('\n').filter(n => n.trim()).length

const completed = computed(() => props.r1Matches.reduce((a, m) => {
  if (m.p1.r1 !== 'neutral') a++
  if (m.p2?.r1 !== 'neutral') a++
  return a
}, 0))
const total = computed(() => props.r1Matches.reduce((a, m) => a + (m.p2 ? 2 : 1), 0))

const shuffle = (array) => {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const createPairings = (playerList) => {
  playerList.forEach(p => (p.r1 = 'neutral'))
  const shuffled = shuffle(playerList)
  const pairings = []
  while (shuffled.length > 0) {
    const p1 = shuffled.pop()
    const p2 = shuffled.length > 0 ? shuffled.pop() : null
    if (!p2) p1.r1 = 'winner'
    pairings.push({ p1, p2, roundKey: 'r1' })
  }
  return pairings
}

const generateRound1 = () => {
  if (!rawInput.value.trim()) return alert('Inserisci i nomi!')
  const names = rawInput.value.split('\n').filter(n => n.trim())
  const players = names.map((name, i) => ({
    id: i, name: name.trim(),
    r1: 'neutral', r2: 'neutral', r3: 'neutral'
  }))
  emit('updatePlayers', players)
  emit('updateMatches', createPairings(players))
}

const rimescola = () => {
  if (!confirm('Rimescolare il Round 1? I risultati già inseriti verranno azzerati.')) return
  emit('updateMatches', createPairings([...props.allPlayers]))
}

const openEdit = () => {
  editInput.value = props.allPlayers.map(p => p.name).join('\n')
  editMode.value  = true
}
const cancelEdit = () => { editMode.value = false }

const applyEdit = () => {
  if (!editInput.value.trim()) return alert('La lista non può essere vuota!')
  if (!confirm('Applicare le modifiche e risorteggiare? I risultati già inseriti verranno azzerati.')) return
  const names = editInput.value.split('\n').filter(n => n.trim())
  const players = names.map((name, i) => {
    const existing = props.allPlayers.find(p => p.name === name)
    return existing
      ? { ...existing, id: i, r1: 'neutral' }
      : { id: i, name: name.trim(), r1: 'neutral', r2: 'neutral', r3: 'neutral' }
  })
  emit('updatePlayers', players)
  emit('updateMatches', createPairings(players))
  editMode.value = false
}

const toggleMatchResult = (match, playerRole) => {
  const player   = match[playerRole]
  const opponent = playerRole === 'p1' ? match.p2 : match.p1
  if (!opponent) return

  if (player.r1 !== 'winner') {
    player.r1   = 'winner'
    opponent.r1 = 'loser'
  } else {
    player.r1   = 'neutral'
    opponent.r1 = 'neutral'
  }

  emit('updateMatches', props.r1Matches.map(m =>
    m.p1.id === match.p1.id && m.p2?.id === match.p2?.id ? match : m
  ))
}
</script>

<template>
  <div class="tab-pane">
    <div v-if="allPlayers.length === 0" class="input-scene">
      <div class="input-card">
        <div class="input-card-header">
          <h2>Partecipanti</h2>
          <p>Inserisci un nome per riga</p>
        </div>
        <div class="textarea-wrapper">
          <textarea class="tall" v-model="rawInput" placeholder="Mario Rossi&#10;Luca Bianchi..."></textarea>
          <div class="line-count" v-if="rawInput.trim()">{{ lineCount(rawInput) }} giocatori</div>
        </div>
        <button class="btn-primary" @click="generateRound1">🎲 SORTEGGIA ROUND 1</button>
      </div>
    </div>

    <div v-else>
      <div class="round-header">
        <div class="round-title-group">
          <span class="round-number">01</span>
          <h2>Round 1</h2>
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
        <div v-for="(match, i) in r1Matches" :key="i" class="match-card"
             :class="{ resolved: match.p1.r1 !== 'neutral' }">
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
            <div v-if="match.p2" class="player-slot" :class="match.p2.r1"
                 @click="toggleMatchResult(match, 'p2')">
              <span class="player-name">{{ match.p2.name }}</span>
              <span class="slot-badge" v-if="match.p2.r1 === 'winner'">✓</span>
              <span class="slot-badge lose" v-if="match.p2.r1 === 'loser'">✗</span>
            </div>
            <div v-else class="player-slot bye"><span class="player-name">—</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>