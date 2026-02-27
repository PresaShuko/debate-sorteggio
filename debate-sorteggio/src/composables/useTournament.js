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
   * @param {Array}  playerList - lista giocatori da accoppiare
   * @param {string} field      - campo del round da resettare ('r1' | 'r2' | 'r3')
   */
  const createPairings = (playerList, field) => {
    playerList.forEach(p => (p[field] = 'neutral'))
    const shuffled = shuffle(playerList)
    const pairings = []
    while (shuffled.length > 0) {
      const p1 = shuffled.pop()
      const p2 = shuffled.length > 0 ? shuffled.pop() : null
      if (!p2) p1[field] = 'winner'   // BYE → vince automaticamente
      pairings.push({ p1, p2 })
    }
    return pairings
  }

  /**
   * Costruisce la lista giocatori da una lista di nomi,
   * preservando tutti i campi esistenti e resettando solo `resetField`.
   * @param {string[]} names       - nomi da processare
   * @param {Array}    allPlayers  - lista corrente per cercare giocatori esistenti
   * @param {string}   resetField  - campo da azzerare ('r1' | 'r2' | 'r3')
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
   * Restituisce una funzione (match, playerRole) => void.
   * @param {Object}   props  - props del componente (per accedere ai matches)
   * @param {string}   field  - campo del round ('r1' | 'r2' | 'r3')
   * @param {string}   matchesKey - chiave nei props per l'array matches (es. 'r1Matches')
   * @param {Function} emit   - funzione emit del componente
   */
  const makeToggle = (props, field, matchesKey, emit) => (match, playerRole) => {
    const player   = match[playerRole]
    const opponent = playerRole === 'p1' ? match.p2 : match.p1
    if (!opponent) return

    if (player[field] !== 'winner') {
      player[field]   = 'winner'
      opponent[field] = 'loser'
    } else {
      player[field] = opponent[field] = 'neutral'
    }

    emit('updateMatches', props[matchesKey].map(m =>
      m.p1.id === match.p1.id && m.p2?.id === match.p2?.id ? match : m
    ))
  }

  /**
   * Versione di makeToggle per R3 che gestisce i 2 gruppi { v, p }.
   */
  const makeToggleR3 = (props, emit) => (match, playerRole, group) => {
    const player   = match[playerRole]
    const opponent = playerRole === 'p1' ? match.p2 : match.p1
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

  return { lineCount, shuffle, createPairings, buildPlayers, makeToggle, makeToggleR3 }
}