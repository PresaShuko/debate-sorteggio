<script setup>
import { computed, ref } from 'vue'
import MatchCard from './MatchCard.vue'
import { useTournament } from '../composables/useTournament.js'

const props = defineProps({
  allPlayers: Array,
  r3Matches:  Object   // { v: [], p: [] }
})
const emit = defineEmits(['updatePlayers', 'updateMatches'])

const { lineCount, createPairings, buildPlayers, makeToggleR3 } = useTournament()

const inputV = ref(props.allPlayers.filter(p => p.r2 === 'winner').map(p => p.name).join('\n'))
const inputP = ref(props.allPlayers.filter(p => p.r2 === 'loser').map(p => p.name).join('\n'))

const editMode = ref(false)
const editV    = ref('')
const editP    = ref('')

const isInputPhase = computed(() =>
  (!props.r3Matches.v || props.r3Matches.v.length === 0) &&
  (!props.r3Matches.p || props.r3Matches.p.length === 0)
)

const toggleMatchResult = makeToggleR3(props, emit)

// Costruisce i giocatori di R3 da due testi (vincenti/perdenti)
// preservando r1 e r2 — resetta solo r3
const buildR3Players = (textV, textP) => {
  const process = (text, r2Val) =>
    text.split('\n').map(n => n.trim()).filter(Boolean).map(name => {
      const existing = props.allPlayers.find(p => p.name === name)
      return existing
        ? { ...existing, r3: 'neutral' }
        : { id: 0, name, r1: 'neutral', r2: r2Val, r3: 'neutral' }
    })
  return [...process(textV, 'winner'), ...process(textP, 'loser')]
    .map((p, i) => ({ ...p, id: i }))
}

const emitR3 = (players) => {
  emit('updatePlayers', players)
  emit('updateMatches', {
    v: createPairings(players.filter(p => p.r2 === 'winner'), 'r3'),
    p: createPairings(players.filter(p => p.r2 === 'loser'),  'r3'),
  })
}

const generateRound3 = () => emitR3(buildR3Players(inputV.value, inputP.value))

const rimescola = () => {
  if (!confirm('Rimescolare il Round Finale? I risultati già inseriti verranno azzerati.')) return
  emitR3(props.allPlayers.map(p => ({ ...p, r3: 'neutral' })))
}

const openEdit = () => {
  editV.value = props.allPlayers.filter(p => p.r2 === 'winner').map(p => p.name).join('\n')
  editP.value = props.allPlayers.filter(p => p.r2 === 'loser').map(p => p.name).join('\n')
  editMode.value = true
}
const cancelEdit = () => { editMode.value = false }

const applyEdit = () => {
  if (!editV.value.trim() && !editP.value.trim()) return alert('Le liste non possono essere entrambe vuote!')
  if (!confirm('Applicare le modifiche e risorteggiare? I risultati già inseriti verranno azzerati.')) return
  emitR3(buildR3Players(editV.value, editP.value))
  editMode.value = false
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

    <!-- ── Pannello modifica ── -->
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
          <label>⭕ Perdenti Round 2</label>
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
          <h2>⭕ Perdenti R2</h2>
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

      <div class="group-panel tier-gold">
        <div class="group-label"><span>🏆 Vincenti Round 2</span></div>
        <MatchCard
          v-for="(m, i) in r3Matches.v" :key="m.p1.id"
          :match="m" field="r3" :index="i"
          @toggle="(match, role) => toggleMatchResult(match, role, 'v')"
        />
      </div>

      <div class="group-panel tier-stone">
        <div class="group-label"><span>⭕ Perdenti Round 2</span></div>
        <MatchCard
          v-for="(m, i) in r3Matches.p" :key="m.p1.id"
          :match="m" field="r3" :index="i"
          @toggle="(match, role) => toggleMatchResult(match, role, 'p')"
        />
      </div>

    </div>
  </div>
</template>