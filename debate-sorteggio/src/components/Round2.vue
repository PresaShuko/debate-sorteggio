<script setup>
import { computed, ref } from 'vue'
import MatchCard from './MatchCard.vue'
import { useTournament } from '../composables/useTournament.js'

const props = defineProps({
  allPlayers: Array,
  r2Matches:  Array
})
const emit = defineEmits(['updatePlayers', 'updateMatches'])

const { lineCount, createPairings, buildPlayers, makeToggle } = useTournament()

const firstScreen = ref(props.r2Matches.length === 0)
const rawInput    = ref(props.allPlayers.map(p => p.name).join('\n'))
const editMode    = ref(false)
const editInput   = ref('')

const completed = computed(() => props.r2Matches.reduce((a, m) => {
  if (m.p1.r2 !== 'neutral') a++
  if (m.p2?.r2 !== 'neutral') a++
  return a
}, 0))
const total = computed(() => props.r2Matches.reduce((a, m) => a + (m.p2 ? 2 : 1), 0))

const toggleMatchResult = makeToggle(props, 'r2', 'r2Matches', emit)

const generateRound2 = () => {
  if (!rawInput.value.trim()) return alert('Inserisci i nomi!')
  firstScreen.value = false
  const names   = rawInput.value.split('\n').filter(n => n.trim())
  const players = buildPlayers(names, props.allPlayers, 'r2')
  emit('updatePlayers', players)
  emit('updateMatches', createPairings(players, 'r2'))
}

const rimescola = () => {
  if (!confirm('Rimescolare il Round 2? I risultati già inseriti verranno azzerati.')) return
  const players = props.allPlayers.map(p => ({ ...p, r2: 'neutral' }))
  emit('updatePlayers', players)
  emit('updateMatches', createPairings(players, 'r2'))
}

const openEdit = () => {
  editInput.value = props.allPlayers.map(p => p.name).join('\n')
  editMode.value  = true
}
const cancelEdit = () => { editMode.value = false }

const applyEdit = () => {
  if (!editInput.value.trim()) return alert('La lista non può essere vuota!')
  if (!confirm('Applicare le modifiche e risorteggiare? I risultati già inseriti verranno azzerati.')) return
  const names   = editInput.value.split('\n').filter(n => n.trim())
  const players = buildPlayers(names, props.allPlayers, 'r2')
  emit('updatePlayers', players)
  emit('updateMatches', createPairings(players, 'r2'))
  editMode.value = false
}
</script>

<template>
  <div class="tab-pane">

    <!-- ── Schermata inserimento iniziale ── -->
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

    <!-- ── Schermata partite ── -->
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

      <!-- Pannello modifica -->
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
            <span style="font-size: 0.75rem; color: var(--text-dim)">
              {{ lineCount(editInput) }} giocatori
            </span>
          </div>
        </div>
      </div>

      <!-- Lista partite -->
      <div class="matches-grid">
        <MatchCard
          v-for="(match, i) in r2Matches" :key="i"
          :match="match" field="r2" :index="i"
          @toggle="(match, role) => toggleMatchResult(match, role)"
        />
      </div>
    </div>

  </div>
</template>