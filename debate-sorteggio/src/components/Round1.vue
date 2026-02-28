<script setup>
import { computed, ref } from 'vue'
import MatchCard from './MatchCard.vue'
import { useTournament } from '../composables/useTournament.js'

const props = defineProps({
  allPlayers: Array,
  r1Matches:  Array
})
const emit = defineEmits(['updatePlayers', 'updateMatches'])

const { lineCount, createPairings, buildPlayers, makeToggle } = useTournament()

const rawInput  = ref('')
const editMode  = ref(false)
const editInput = ref('')

const completed = computed(() => props.r1Matches.reduce((a, m) => {
  if (m.p1.r1 !== 'neutral') a++
  if (m.p2 && m.p2.r1 !== 'neutral') a++
  return a
}, 0))
const total = computed(() => props.r1Matches.reduce((a, m) => a + (m.p2 ? 2 : 1), 0))

const toggleMatchResult = makeToggle(props, 'r1', 'r1Matches', emit)

const generateRound1 = () => {
  if (!rawInput.value.trim()) return alert('Inserisci i nomi!')
  const names = rawInput.value.split('\n').filter(n => n.trim())
  const players = names.map((name, i) => ({
    id: i, name: name.trim(), r1: 'neutral', r2: 'neutral', r3: 'neutral'
  }))
  emit('updatePlayers', players)
  emit('updateMatches', createPairings(players, 'r1'))
}

const rimescola = () => {
  if (!confirm('Rimescolare il Round 1? I risultati già inseriti verranno azzerati.')) return
  emit('updateMatches', createPairings([...props.allPlayers], 'r1'))
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
  const players = buildPlayers(names, props.allPlayers, 'r1')
  emit('updatePlayers', players)
  emit('updateMatches', createPairings(players, 'r1'))
  editMode.value = false
}
</script>

<template>
  <div class="tab-pane">

    <!-- ── Schermata inserimento iniziale ── -->
    <div v-if="allPlayers.length === 0" class="input-scene">
      <div class="input-card">
        <div class="input-card-header">
          <h2>Partecipanti</h2>
          <p>Inserisci un nome per riga</p>
        </div>
        <div class="textarea-wrapper">
          <textarea class="tall" v-model="rawInput"
                    placeholder="Mario Rossi&#10;Luca Bianchi..."></textarea>
          <div class="line-count" v-if="rawInput.trim()">{{ lineCount(rawInput) }} giocatori</div>
        </div>
        <button class="btn-primary" @click="generateRound1">🎲 SORTEGGIA ROUND 1</button>
      </div>
    </div>

    <!-- ── Schermata partite ── -->
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
          v-for="(match, i) in r1Matches" :key="i"
          :match="match" field="r1" :index="i"
          @toggle="(match, role) => toggleMatchResult(match, role)"
        />
      </div>
    </div>

  </div>
</template>