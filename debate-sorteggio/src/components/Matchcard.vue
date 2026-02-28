<script setup>
/**
 * MatchCard.vue
 * Componente riutilizzabile per visualizzare una singola partita.
 *
 * Props:
 *   match      - oggetto { p1, p2 } della partita
 *   field      - campo risultato da leggere ('r1' | 'r2' | 'r3')
 *   index      - numero progressivo (per il badge #N)
 *   showGroup  - (opzionale) se true, mostra un badge con la provenienza del giocatore
 *                basandosi su player.r2 ('winner' → 🏆, 'loser' → ⭕)
 *
 * Emits:
 *   toggle(match, playerRole) - quando si clicca su uno slot
 */
defineProps({
  match:     { type: Object,  required: true },
  field:     { type: String,  required: true },
  index:     { type: Number,  required: true },
  showGroup: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle'])

const groupIcon = (player) => player.r2 === 'winner' ? '🏆' : '⭕'
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
        <span class="player-name">
          <span v-if="showGroup" class="group-origin-badge">{{ groupIcon(match.p1) }}</span>
          {{ match.p1.name }}
        </span>
      </div>

      <!-- VS / BYE -->
      <div class="vs-badge">
        <span v-if="match.p2">VS</span>
        <span v-else class="bye-text">❌</span>
      </div>

      <!-- Giocatore 2 -->
      <div v-if="match.p2" class="player-slot" :class="match.p2[field]"
           @click="emit('toggle', match, 'p2')">
        <span class="player-name">
          {{ match.p2.name }}
          <span v-if="showGroup" class="group-origin-badge">{{ groupIcon(match.p2) }}</span>
        </span>
        <span class="slot-badge"      v-if="match.p2[field] === 'winner'">✓</span>
        <span class="slot-badge lose" v-if="match.p2[field] === 'loser'">✗</span>
      </div>
      <!-- BYE: slot cliccabile per assegnare la vittoria manualmente -->
      <div v-else class="player-slot bye"
           @click="emit('toggle', match, 'p1')">
        <span class="player-name">—</span>
        <span class="bye-hint">clicca per assegnare</span>
      </div>

    </div>
  </div>
</template>

<style scoped>
.bye-hint {
  font-size: 0.65rem;
  color: var(--text-dim, #888);
  display: block;
  text-align: center;
  margin-top: 2px;
  pointer-events: none;
}
.group-origin-badge {
  font-size: 0.8em;
  margin-right: 3px;
  vertical-align: middle;
}
</style>