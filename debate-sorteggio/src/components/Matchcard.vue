<script setup>
/**
 * MatchCard.vue
 * Componente riutilizzabile per visualizzare una singola partita.
 *
 * Props:
 *   match  - oggetto { p1, p2 } della partita
 *   field  - campo risultato da leggere ('r1' | 'r2' | 'r3')
 *   index  - numero progressivo (per il badge #N)
 *
 * Emits:
 *   toggle(match, playerRole, ...extra) - quando si clicca su uno slot
 *   I parametri extra vengono passati direttamente (es. 'group' in R3)
 */
defineProps({
  match: { type: Object, required: true },
  field: { type: String, required: true },
  index: { type: Number, required: true },
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <div class="match-card" :class="{ resolved: match.p1[field] !== 'neutral' }">
    <div class="match-index">#{{ index + 1 }}</div>
    <div class="match-body">

      <!-- Giocatore 1 -->
      <div class="player-slot" :class="match.p1[field]"
           @click="emit('toggle', match, 'p1')">
        <span class="slot-badge"      v-if="match.p1[field] === 'winner'">✓</span>
        <span class="slot-badge lose" v-if="match.p1[field] === 'loser'">✗</span>
        <span class="player-name">{{ match.p1.name }}</span>
      </div>

      <!-- VS / BYE -->
      <div class="vs-badge">
        <span v-if="match.p2">VS</span>
        <span v-else class="bye-text">BYE</span>
      </div>

      <!-- Giocatore 2 -->
      <div v-if="match.p2" class="player-slot" :class="match.p2[field]"
           @click="emit('toggle', match, 'p2')">
        <span class="player-name">{{ match.p2.name }}</span>
        <span class="slot-badge"      v-if="match.p2[field] === 'winner'">✓</span>
        <span class="slot-badge lose" v-if="match.p2[field] === 'loser'">✗</span>
      </div>
      <div v-else class="player-slot bye">
        <span class="player-name">—</span>
      </div>

    </div>
  </div>
</template>