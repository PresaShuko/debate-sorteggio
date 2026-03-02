// composables/useTournament.js
// Logica condivisa tra tutti e 3 i round

export function useTournament() {

  /** Conta le righe non vuote in una textarea */
  const lineCount = (text) => text.split('\n').filter(n => n.trim()).length

  /** Fisher-Yates shuffle, non muta l'originale */
  const shuffle = (array) => {
    const a = [...array]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  /**
   * Crea le coppie di un round.
   * Se il numero di giocatori è dispari, l'ultimo ottiene un BYE (p2: null)
   * ma NON viene impostato automaticamente come vincitore: l'utente decide.
   * @param {Array}  playerList - lista giocatori da accoppiare
   * @param {string} field      - campo del round da resettare ('r1' | 'r2' | 'r3')
   * @returns {Array} array di { p1, p2 }
   */
  const createPairings = (playerList, field) => {
    playerList.forEach(p => (p[field] = 'neutral'))
    const shuffled = shuffle(playerList)
    const pairings = []
    while (shuffled.length > 0) {
      const p1 = shuffled.pop()
      const p2 = shuffled.length > 0 ? shuffled.pop() : null
      // BYE: p2 è null, ma il vincitore lo decide l'utente (nessun auto-win)
      pairings.push({ p1, p2 })
    }
    return pairings
  }

  /**
   * Come createPairings ma restituisce anche il giocatore rimasto fuori (leftover).
   * Utile per R3 dove i leftover di V e P possono formare una lista Vincente-Perdente.
   * @returns {{ pairings: Array, leftover: Object|null }}
   */
  const createPairingsWithLeftover = (playerList, field) => {
    playerList.forEach(p => (p[field] = 'neutral'))
    const shuffled = shuffle(playerList)
    const pairings = []
    let leftover = null
    while (shuffled.length > 0) {
      const p1 = shuffled.pop()
      if (shuffled.length > 0) {
        const p2 = shuffled.pop()
        pairings.push({ p1, p2 })
      } else {
        // numero dispari: questo giocatore rimane fuori
        leftover = p1
      }
    }
    return { pairings, leftover }
  }

  /**
   * Costruisce la lista giocatori da una lista di nomi,
   * preservando tutti i campi esistenti e resettando solo `resetField`.
   */
  const buildPlayers = (names, allPlayers, resetField) =>
    names.map((name, i) => {
      const existing = allPlayers.find(p => p.name === name)
      return existing
        ? { ...existing, id: i, [resetField]: 'neutral' }
        : { id: i, name: name.trim(), r1: 'neutral', r2: 'neutral', r3: 'neutral' }
    })

  /**
   * Crea la funzione toggleMatchResult per un round specifico.
   * Gestisce anche le partite BYE (p2 === null): click → winner, click di nuovo → neutral.
   */
  const makeToggle = (props, field, matchesKey, emit) => (match, playerRole) => {
    const player   = match[playerRole]
    const opponent = playerRole === 'p1' ? match.p2 : match.p1

    if (!opponent) {
      // BYE: l'utente decide se far passare il giocatore o meno
      player[field] = player[field] === 'winner' ? 'neutral' : 'winner'
    } else {
      if (player[field] !== 'winner') {
        player[field]   = 'winner'
        opponent[field] = 'loser'
      } else {
        player[field] = opponent[field] = 'neutral'
      }
    }

    emit('updateMatches', props[matchesKey].map(m =>
      m.p1.id === match.p1.id && m.p2?.id === match.p2?.id ? match : m
    ))
  }

  /**
   * Versione di makeToggle per R3 che gestisce i 3 gruppi { v, p, m }.
   * Il gruppo 'm' è lo Vincente-Perdente misto (opzionale).
   */
  const makeToggleR3 = (props, emit) => (match, playerRole, group) => {
    const player   = match[playerRole]
    const opponent = playerRole === 'p1' ? match.p2 : match.p1

    if (!opponent) {
      // BYE: toggle winner/neutral
      player.r3 = player.r3 === 'winner' ? 'neutral' : 'winner'
    } else {
      if (player.r3 !== 'winner') {
        player.r3   = 'winner'
        opponent.r3 = 'loser'
      } else {
        player.r3 = opponent.r3 = 'neutral'
      }
    }

    const updateGroup = (key) =>
      (props.r3Matches[key] || []).map(m =>
        m.p1.id === match.p1.id && m.p2?.id === match.p2?.id ? match : m
      )

    emit('updateMatches', {
      v: updateGroup('v'),
      p: updateGroup('p'),
      m: updateGroup('m'),
    })
  }

  return {
    lineCount,
    shuffle,
    createPairings,
    createPairingsWithLeftover,
    buildPlayers,
    makeToggle,
    makeToggleR3,
  }
}