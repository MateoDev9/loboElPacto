import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookUser, Check, ChevronDown, CircleMinus, CirclePlus,
  Eye, Map, Moon, Play, RotateCcw, ShieldCheck, Skull, Sparkles, Star, Sun, Trash2, Undo2, Users, Vote, X,
} from 'lucide-react'
import {
  advanceRoleCall, alivePlayers, aliveWolves, applyActorChoice, applyThiefChoice, assignRoleOwners, bearGrowls,
  beginScapegoatTie, createGame, eliminateByVote, foxTrio, isWolfAlignedPlayer, phaseAfterNoVote,
  canElectSheriff, electSheriff, resolveHunterShot, resolveScapegoat, resolveServantChoice, resolveSheriffSuccession, revealCard, unrevealedCards,
} from './game'
import { CATEGORY_LABELS, isActorCandidate, isWolfRole, recommendedRoles, ROLE_LIST, ROLES } from './roles'
import { clearGame, loadGame, loadLastGroups, loadPeople, saveGame, saveLastGroups, savePeople } from './storage'
import type { GameState, Player, RoleCategory, RoleId, SetupStep, Winner } from './types'

type Screen = 'home' | 'library' | 'setup' | 'game'

// Número de asiento de cada jugador: los selectores lo muestran para relacionarlos con el coro
const SeatContext = createContext<Record<string, number>>({})

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [setupStep, setSetupStep] = useState<SetupStep>('players')
  const [people, setPeople] = useState<string[]>(() => loadPeople())
  const [names, setNames] = useState<string[]>([])
  const [deck, setDeck] = useState<RoleId[]>([])
  const [actorCards, setActorCards] = useState<RoleId[]>([])
  const [useSheriff, setUseSheriff] = useState(false)
  const [game, setGame] = useState<GameState | null>(() => loadGame())
  // Estados anteriores de la partida para poder deshacer un toque equivocado (solo en memoria)
  const [history, setHistory] = useState<GameState[]>([])

  useEffect(() => { savePeople(people) }, [people])
  useEffect(() => { if (game) saveGame(game) }, [game])

  const updateGame = (next: GameState) => {
    if (game) setHistory((previous) => [...previous.slice(-49), game])
    setGame(next)
  }
  const undo = () => {
    const previous = history[history.length - 1]
    if (!previous) return
    setHistory(history.slice(0, -1))
    setGame(previous)
  }

  const addPerson = (rawName: string) => {
    const name = rawName.trim()
    if (!name || people.some((person) => person.toLocaleLowerCase() === name.toLocaleLowerCase())) return false
    setPeople([...people, name].sort((a, b) => a.localeCompare(b, 'es')))
    return true
  }

  const startNewSetup = () => { if (!game || window.confirm('Hay una partida guardada. Si empiezas una nueva, se perderá cuando la inicies. ¿Continuar?')) resetSetup() }
  const resetSetup = () => { setNames([]); setDeck([]); setActorCards([]); setSetupStep('players'); setScreen('setup') }
  const goToRoles = () => {
    const deckFits = deck.length > 0 && deck.length === names.length + (deck.includes('thief') ? 2 : 0)
    if (!deckFits) { setDeck(recommendedRoles(names.length)); setActorCards([]) }
    setSetupStep('roles')
  }
  const startGame = () => {
    setGame(createGame(names, deck, deck.includes('actor') ? actorCards.filter((id) => !deck.includes(id)) : [], { sheriff: useSheriff }))
    setHistory([])
    const previous = loadLastGroups().filter((group) => group.join(',') !== names.join(','))
    saveLastGroups([names, ...previous].slice(0, 10))
    setScreen('game')
  }
  const endGame = () => { clearGame(); setGame(null); setHistory([]); setScreen('home') }

  if (screen === 'library') return <PeopleLibrary people={people} addPerson={addPerson} removePerson={(name) => setPeople(people.filter((person) => person !== name))} onBack={() => setScreen('home')} />
  if (screen === 'setup') {
    if (setupStep === 'players') return <PlayersSetup people={people} names={names} setNames={setNames} addPerson={addPerson} onBack={() => setScreen('home')} onNext={goToRoles} />
    return <DeckSetup playerCount={names.length} deck={deck} setDeck={setDeck} actorCards={actorCards} setActorCards={setActorCards} useSheriff={useSheriff} setUseSheriff={setUseSheriff} onBack={() => setSetupStep('players')} onNext={startGame} />
  }
  if (screen === 'game' && game) return <GameScreen game={game} setGame={updateGame} canUndo={history.length > 0} onUndo={undo} onExit={() => setScreen('home')} onEnd={endGame} />
  return <Home hasGame={Boolean(game)} onNew={startNewSetup} onLibrary={() => setScreen('library')} onContinue={() => setScreen('game')} />
}

function Home({ hasGame, onNew, onLibrary, onContinue }: { hasGame: boolean; onNew: () => void; onLibrary: () => void; onContinue: () => void }) {
  return <main className="home-shell"><div className="forest-glow" /><section className="home-content">
    <div className="brand-mark" aria-hidden="true">🐺</div><p className="eyebrow">Para quien lleva la partida</p>
    <h1>La aldea duerme.<br /><em>Es hora de empezar.</em></h1>
    <p className="hero-copy">Prepara las cartas, averigua quién tiene cada una durante la primera noche y lleva el turno sin perderte.</p>
    <div className="home-actions">
      <button className="button button-primary button-large" onClick={onNew}><CirclePlus size={21} /> Nueva partida</button>
      {hasGame && <button className="button button-secondary button-large" onClick={onContinue}><Play size={19} fill="currentColor" /> Continuar partida</button>}
      <button className="button button-secondary button-large" onClick={onLibrary}><BookUser size={19} /> Jugadores habituales</button>
    </div>
    <div className="feature-row"><span><Moon size={15} /> Orden de llamada</span><span><Users size={15} /> 31 personajes</span><span><ShieldCheck size={15} /> Partida guardada</span></div>
  </section></main>
}

function PageHeader({ step, onBack }: { step: string; onBack: () => void }) {
  return <header className="page-header"><button className="icon-button" onClick={onBack} aria-label="Volver"><ArrowLeft size={20} /></button><div className="mini-brand"><span>🐺</span> Lobo</div><span className="step-label">{step}</span></header>
}

function PersonAdder({ people, addPerson, onAdded, onExisting }: { people: string[]; addPerson: (name: string) => boolean; onAdded?: (name: string) => void; onExisting?: (name: string) => void }) {
  const [value, setValue] = useState('')
  const [notice, setNotice] = useState('')
  const submit = () => {
    const name = value.trim()
    if (!name) return
    const existing = people.find((person) => person.toLocaleLowerCase() === name.toLocaleLowerCase())
    if (existing) {
      if (onExisting) { onExisting(existing); setValue(''); setNotice('') } else setNotice(`${existing} ya está en la lista.`)
      return
    }
    if (addPerson(name)) { setValue(''); setNotice(''); onAdded?.(name) }
  }
  return <><div className="person-adder"><input value={value} onChange={(event) => { setValue(event.target.value); setNotice('') }} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="Nombre de la persona" aria-label="Nombre de la persona" /><button className="button button-primary" onClick={submit} disabled={!value.trim()}><CirclePlus size={17} /> Guardar</button></div>{notice && <p className="form-error" role="status">{notice}</p>}</>
}

function PeopleLibrary({ people, addPerson, removePerson, onBack }: { people: string[]; addPerson: (name: string) => boolean; removePerson: (name: string) => void; onBack: () => void }) {
  return <main className="app-shell"><PageHeader step="Biblioteca" onBack={onBack} /><section className="setup-wrap">
    <div className="section-heading"><p className="eyebrow">Jugadores habituales</p><h2>Personas guardadas</h2><p>Guarda aquí los nombres de quienes suelen jugar. En cada partida solo tendrás que marcar quién está en la mesa.</p></div>
    <div className="panel library-panel"><PersonAdder people={people} addPerson={addPerson} />
      <div className="library-list">{people.length ? people.map((name) => <div key={name}><span className="avatar">{name[0].toUpperCase()}</span><strong>{name}</strong><button className="remove-button" onClick={() => removePerson(name)} aria-label={`Eliminar a ${name}`}><Trash2 size={17} /></button></div>) : <p className="empty-state">Aún no has guardado ningún nombre.</p>}</div>
    </div>
  </section></main>
}

function PlayersSetup({ people, names, setNames, addPerson, onBack, onNext }: { people: string[]; names: string[]; setNames: (names: string[]) => void; addPerson: (name: string) => boolean; onBack: () => void; onNext: () => void }) {
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  useEffect(() => { setSelectedSeatIndex(null) }, [names.length])
  const toggle = (name: string) => setNames(names.includes(name) ? names.filter((person) => person !== name) : [...names, name])
  const handleSeatClick = (index: number) => {
    if (selectedSeatIndex === null) {
      setSelectedSeatIndex(index)
    } else {
      if (selectedSeatIndex !== index) {
        const reordered = [...names]
        ;[reordered[selectedSeatIndex], reordered[index]] = [reordered[index], reordered[selectedSeatIndex]]
        setNames(reordered)
      }
      setSelectedSeatIndex(null)
    }
  }
  const lastGroups = useMemo(() => loadLastGroups().filter((group) => group.every((name) => people.includes(name))), [])
  return <main className="app-shell"><PageHeader step="Paso 1 de 2" onBack={onBack} /><section className="setup-wrap">
    <div className="section-heading"><p className="eyebrow">Prepara la partida</p><h2>¿Quién juega hoy?</h2><p>Marca quién está hoy en la mesa. Después podrás colocar sus nombres en el orden de los asientos.</p></div>
    {lastGroups.length > 0 && names.length === 0 && <div className="history-groups">
      {!showHistory ? <button className="button button-secondary button-large reuse-button" style={{ width: '100%' }} onClick={() => setShowHistory(true)}>✨ Partidas anteriores ({lastGroups.length})</button> : <>
        <p className="eyebrow">✨ Partidas anteriores</p>
        <div className="history-scroll">
          {lastGroups.map((group, i) => (
            <button key={i} className="history-card" onClick={() => { setNames([...group]); setShowHistory(false) }}>
              <strong>{group.length} jugadores</strong>
              <small>{group.join(', ')}</small>
            </button>
          ))}
        </div>
      </>}
    </div>}
    <div className="panel player-panel"><div className="panel-title"><span>Jugadores</span><span className="count-pill">{names.length} elegidos</span></div>
      <div className="people-grid">{people.map((name) => <button key={name} className={names.includes(name) ? 'selected' : ''} onClick={() => toggle(name)}><span className="avatar">{name[0].toUpperCase()}</span><strong>{name}</strong>{names.includes(name) && <Check size={17} />}</button>)}</div>
      {!people.length && <p className="empty-state">Añade algún nombre para empezar.</p>}
      {names.length > 0 && <div className="seating-order"><div><div><strong>Orden de los asientos</strong><small>{selectedSeatIndex === null ? 'Toca un asiento y luego otro para cambiarlos. Empieza por la cabecera y sigue el sentido horario.' : `Asiento ${selectedSeatIndex + 1} seleccionado · toca otro para cambiarlo.`}</small></div><span className="clockwise-label">↻ Sentido horario</span></div>
        <div className="chorus-setup-map"><SeatingCircle variant="setup" players={names.map((name, i) => ({ id: i.toString(), name, alive: true }))} awakeIds={[]} selectedIds={selectedSeatIndex !== null ? [selectedSeatIndex.toString()] : []} targetIds={[]} round={1} onSeatClick={(id) => handleSeatClick(parseInt(id, 10))} /></div>
      </div>}
      <div className="inline-add"><small>¿Falta alguien? Añádelo aquí y quedará guardado.</small><PersonAdder people={people} addPerson={addPerson} onAdded={(name) => setNames([...names, name])} onExisting={(name) => { if (!names.includes(name)) setNames([...names, name]) }} /></div>
    </div>
    <div className="sticky-action"><span>{names.length < 5 ? `Faltan ${5 - names.length} personas` : `${names.length} personas jugarán`}</span><button className="button button-primary" disabled={names.length < 5} onClick={onNext}>Elegir cartas <ArrowRight size={18} /></button></div>
  </section></main>
}

function DeckSetup({ playerCount, deck, setDeck, actorCards, setActorCards, useSheriff, setUseSheriff, onBack, onNext }: { playerCount: number; deck: RoleId[]; setDeck: (deck: RoleId[]) => void; actorCards: RoleId[]; setActorCards: (cards: RoleId[]) => void; useSheriff: boolean; setUseSheriff: (value: boolean) => void; onBack: () => void; onNext: () => void }) {
  const counts = countRoles(deck)
  const categories: RoleCategory[] = ['wolves', 'village', 'ambiguous', 'solitary', 'village-expansion']
  // Con el Ladrón se reparten 2 cartas de más, que quedan boca abajo en el centro
  const cardTarget = playerCount + (counts.thief ? 2 : 0)
  const isRecommended = [...deck].sort().join() === recommendedRoles(playerCount).sort().join()
  const addCost = (id: RoleId) => id === 'two_sisters' ? 2 - (counts[id] ?? 0) : id === 'three_brothers' ? 3 - (counts[id] ?? 0) : 1
  const changeCount = (id: RoleId, delta: number) => {
    const groupedRole = id === 'two_sisters' || id === 'three_brothers'
    if (delta > 0) {
      const amount = groupedRole ? ROLES[id].maxCards - (counts[id] ?? 0) : 1
      setDeck([...deck, ...Array<RoleId>(amount).fill(id), ...(id === 'thief' ? Array<RoleId>(2).fill('villager') : [])])
    } else if (groupedRole) setDeck(deck.filter((roleId) => roleId !== id))
    else {
      let next = deck
      const removeOne = (roleId: RoleId) => { const index = next.lastIndexOf(roleId); if (index >= 0) next = next.filter((_, itemIndex) => itemIndex !== index) }
      removeOne(id)
      if (id === 'thief') { removeOne('villager'); removeOne('villager') }
      setDeck(next)
    }
  }
  const actorCandidates = ROLE_LIST.filter((item) => isActorCandidate(item.id) && !deck.includes(item.id))
  const chosenActorCards = actorCards.filter((id) => !deck.includes(id))
  const toggleActorCard = (id: RoleId) => setActorCards(chosenActorCards.includes(id) ? chosenActorCards.filter((card) => card !== id) : [...chosenActorCards, id].slice(-3))
  const actorReady = !counts.actor || chosenActorCards.length === Math.min(3, actorCandidates.length)
  const completeGroups = (!counts.two_sisters || counts.two_sisters === 2) && (!counts.three_brothers || counts.three_brothers === 3)
  const valid = deck.length === cardTarget && deck.some(isWolfRole) && completeGroups && actorReady
  return <main className="app-shell"><PageHeader step="Paso 2 de 2" onBack={onBack} /><section className="setup-wrap roles-wrap">
    <div className="section-heading"><p className="eyebrow">Prepara el mazo</p><h2>Elige las cartas</h2><p>Puedes usar la recomendación o cambiarla antes de repartir.</p></div>
    <div className="deck-summary"><span className="recommend-label"><Sparkles size={14} aria-hidden="true" /> {isRecommended ? 'Mazo recomendado' : 'Mazo personalizado'}</span><strong className={deck.length === cardTarget ? 'complete' : ''}>{deck.length} / {cardTarget} cartas</strong>{!isRecommended && <button className="text-button dark" onClick={() => setDeck(recommendedRoles(playerCount))}>Volver a la recomendación</button>}</div>
    {categories.map((category) => <section className="role-category" key={category}><h3>{CATEGORY_LABELS[category]}</h3><div className="catalog-grid">
      {ROLE_LIST.filter((item) => item.category === category).map((item) => { const count = counts[item.id] ?? 0; return <article className={`catalog-card ${count ? 'chosen' : ''}`} key={item.id} style={{ '--role-color': item.color } as React.CSSProperties}>
        <RoleArtwork roleId={item.id} className="role-icon" /><div><strong>{item.name}</strong><small>{item.description}{item.id === 'two_sisters' ? ' Se añaden las 2 cartas.' : item.id === 'three_brothers' ? ' Se añaden las 3 cartas.' : ''}</small></div><div className="counter"><button disabled={!count} onClick={() => changeCount(item.id, -1)} aria-label={`Quitar ${item.name}`}><CircleMinus size={20} /></button><b>{count}</b><button disabled={count >= item.maxCards || deck.length + addCost(item.id) > cardTarget} onClick={() => changeCount(item.id, 1)} aria-label={`Añadir ${item.name}`}><CirclePlus size={20} /></button></div>
      </article> })}
    </div></section>)}
    {counts.actor ? <section className="role-category"><h3>Cartas del Comediante</h3><p className="optional-note">Elige 3 cartas con poder que no estén en el mazo; ninguna puede ser de lobo. Se colocan boca arriba en el centro y no se reparten.</p><PlayerPicker players={actorCandidates.map((item) => ({ id: item.id, name: item.name, alive: true }))} selected={chosenActorCards} onSelect={(id) => toggleActorCard(id as RoleId)} label={`${chosenActorCards.length} / 3 elegidas`} /></section> : null}
    {!deck.some(isWolfRole) && <p className="form-error">Incluye al menos un Hombre Lobo.</p>}
    <section className="role-category"><h3>Cargos</h3><ToggleCard active={useSheriff} icon="⭐" title="Jugar con Alguacil" text="La aldea elige a un Alguacil durante el día. Su voto cuenta doble y, si muere, nombra a su sucesor." onClick={() => setUseSheriff(!useSheriff)} /></section>
    {!actorReady && <p className="form-error">Elige las 3 cartas del Comediante.</p>}
    <div className="sticky-action"><span>{deck.length === cardTarget ? (counts.thief ? 'El mazo está listo. Reparte una carta a cada persona y deja 2 boca abajo en el centro.' : 'El mazo está listo. Baraja y reparte las cartas.') : `${Math.abs(cardTarget - deck.length)} cartas ${deck.length < cardTarget ? 'por añadir' : 'de más'}`}</span><button className="button button-primary" disabled={!valid} onClick={onNext}>{deck.includes('angel') ? 'Empezar el día del Ángel' : 'Empezar primera noche'} <ArrowRight size={18} /></button></div>
  </section></main>
}

function GameScreen({ game, setGame, canUndo, onUndo, onExit, onEnd }: { game: GameState; setGame: (game: GameState) => void; canUndo: boolean; onUndo: () => void; onExit: () => void; onEnd: () => void }) {
  const [showRoles, setShowRoles] = useState(false)
  const [showChorus, setShowChorus] = useState(true)
  const alive = alivePlayers(game)
  const seatNumbers = useMemo(() => Object.fromEntries(game.players.map((player, index) => [player.id, index + 1])), [game.players])
  const closeRoles = useMemo(() => () => setShowRoles(false), [])
  const isDay = !['night-intro', 'role-call'].includes(game.phase)
  const selectedName = (id?: string) => game.players.find((player) => player.id === id)?.name
  const currentRoleId = game.phase === 'role-call' ? game.nightSequence[game.sequenceIndex] : undefined
  const currentRole = currentRoleId ? ROLES[currentRoleId] : undefined
  // El Comediante vuelve a despertar en el turno del personaje cuya carta ha elegido
  const actingAsActor = Boolean(currentRoleId && currentRoleId !== 'actor' && currentRoleId === game.night.actorRoleId)
  const assignedOwners = currentRoleId ? alive.filter((player) => player.roleId === (actingAsActor ? 'actor' : currentRoleId)) : []
  const roleOwners = currentRoleId === 'werewolf' ? aliveWolves(game) : assignedOwners
  const expectedOwnerCount = currentRoleId && !actingAsActor ? game.deck.filter((roleId) => roleId === currentRoleId).length : 0
  const isDiscoveryCall = game.round === 1 && expectedOwnerCount > 0
  // Antes de que actúe el Ladrón, la carta puede estar entre las 2 sobrantes y nadie abrir los ojos
  const thiefPending = currentRoleId !== 'thief' && game.deck.includes('thief') && !game.thiefLeftovers
  // Quien salió en el día del Ángel ya tiene su carta revelada y cuenta como ubicado
  const revealedDeadOwners = currentRoleId && !actingAsActor ? game.players.filter((player) => !player.alive && player.roleId === currentRoleId) : []
  const discoveryComplete = !isDiscoveryCall || assignedOwners.length + revealedDeadOwners.length === expectedOwnerCount || thiefPending
  const targets = currentRoleId ? game.night.targets[currentRoleId] ?? [] : []

  const updateNight = (patch: Partial<GameState['night']>) => setGame({ ...game, night: { ...game.night, ...patch } })
  const updateTargets = (roleId: RoleId, nextTargets: string[]) => updateNight({ targets: { ...game.night.targets, [roleId]: nextTargets } })
  const toggleTarget = (roleId: RoleId, id: string, max: number) => {
    const current = game.night.targets[roleId] ?? []
    updateTargets(roleId, current.includes(id) ? current.filter((target) => target !== id) : [...current, id].slice(-max))
  }
  const toggleOwner = (playerId: string) => {
    if (!currentRoleId) return
    const ownerIds = assignedOwners.map((player) => player.id)
    const deadIds = revealedDeadOwners.map((player) => player.id)
    const nextOwners = ownerIds.includes(playerId) ? ownerIds.filter((id) => id !== playerId) : ownerIds.length + deadIds.length < expectedOwnerCount ? [...ownerIds, playerId] : ownerIds
    setGame(assignRoleOwners(game, currentRoleId, [...deadIds, ...nextOwners]))
  }
  const skipRole = (roleId: RoleId) => updateNight({ skippedRoles: game.night.skippedRoles.includes(roleId) ? game.night.skippedRoles.filter((id) => id !== roleId) : [...game.night.skippedRoles, roleId] })

  const eligibleTargets = currentRoleId === 'albino_wolf'
    ? aliveWolves(game).filter((player) => player.roleId !== 'albino_wolf')
    : currentRoleId === 'werewolf' || currentRoleId === 'fierce_wolf'
      ? alive.filter((player) => !isWolfAlignedPlayer(game, player))
      : currentRoleId === 'protector'
        ? alive.filter((player) => player.id !== game.lastProtectedTargetId)
        : currentRoleId === 'cupid'
          ? alive
          : currentRoleId === 'flutist'
            ? alive.filter((player) => !roleOwners.some((owner) => owner.id === player.id) && !game.charmedIds.includes(player.id))
            : alive.filter((player) => !roleOwners.some((owner) => owner.id === player.id))

  const skipFirstNightAction = game.round === 1 && currentRoleId === 'albino_wolf'
  const actorRole = game.night.actorRoleId ? ROLES[game.night.actorRoleId] : undefined
  const actorHasCards = availableActorCards(game).length > 0
  const thiefLeftovers = game.thiefLeftovers ?? []
  const thiefMustSwap = thiefLeftovers.filter(Boolean).length === 2 && thiefLeftovers.every(isWolfRole)
  const thiefComplete = thiefLeftovers.filter(Boolean).length === 2 && Boolean(game.roleChoices.thief) && [...thiefLeftovers, ...(thiefMustSwap ? [] : ['thief'])].includes(game.roleChoices.thief!)
  const sectarianComplete = Object.keys(game.sectarianGroups).length === game.players.length
  const requiredTargets = Math.min(currentRoleId === 'flutist' || currentRoleId === 'cupid' ? 2 : 1, eligibleTargets.length)
  const oneTargetComplete = currentRoleId === 'fierce_wolf' ? !eligibleTargets.length || Boolean(game.night.fierceWolfTargetId)
    : currentRoleId === 'albino_wolf' ? !eligibleTargets.length || Boolean(game.night.albinoWolfTargetId)
      : targets.length === requiredTargets
  const actionComplete = !currentRole || skipFirstNightAction || currentRole.callKind === 'confirm' || currentRole.callKind === 'witch'
    || currentRole.callKind === 'optional-one-target'
    || (currentRole.callKind === 'wolves' && (!eligibleTargets.length || Boolean(game.night.wolfTargetId)))
    || (currentRole.callKind === 'one-target' && oneTargetComplete)
    || (currentRole.callKind === 'two-targets' && targets.length === requiredTargets)
    || (currentRole.callKind === 'three-neighbours' && (!eligibleTargets.length || targets.length === 1 || game.night.skippedRoles.includes(currentRole.id)))
    || (currentRole.callKind === 'thief' && thiefComplete)
    || (currentRole.callKind === 'sectarian' && sectarianComplete)
    || (currentRole.callKind === 'actor' && (Boolean(actorRole) || !actorHasCards))
  const canAdvance = discoveryComplete && actionComplete

  const advance = () => {
    if (!currentRoleId) return
    let updated = game
    if (currentRoleId === 'thief' && game.roleChoices.thief) updated = applyThiefChoice(updated, game.roleChoices.thief as RoleId)
    if (currentRoleId === 'witch') updated = { ...updated, healPotionAvailable: updated.healPotionAvailable && !updated.night.witchSaved, poisonPotionAvailable: updated.poisonPotionAvailable && !updated.night.witchPoisonTargetId }
    if (currentRoleId === 'cupid') updated = { ...updated, lovers: targets }
    if (currentRoleId === 'wild_child') updated = { ...updated, mentorId: targets[0] }
    if (currentRoleId === 'flutist') updated = { ...updated, charmedIds: [...new Set([...updated.charmedIds, ...targets])] }
    if (currentRoleId === 'fox' && targets[0] && !foxTrio(updated, targets[0]).some((player) => isWolfAlignedPlayer(updated, player))) updated = { ...updated, foxPowerAvailable: false }
    if (currentRoleId === 'infect_father' && updated.night.infectVictim) updated = { ...updated, infectionAvailable: false }
    if (currentRoleId === 'pyromaniac' && updated.night.pyromaniacTargetId) updated = { ...updated, pyromaniacAvailable: false }
    if (currentRoleId === 'actor' && updated.night.actorRoleId) updated = applyActorChoice(updated)
    setGame(advanceRoleCall(updated))
  }

  const phase = useMemo(() => {
    if (game.phase === 'night-intro') return game.openingDay
      ? { icon: <RoleArtwork roleId="angel" className="phase-role-art" />, kicker: 'Antes de empezar', title: 'Busca al Ángel', text: 'Pide al Ángel que abra los ojos y anota quién es antes de que empiece el debate.' }
      : { icon: <Moon size={30} />, kicker: `Noche ${game.round}`, title: 'Todos a dormir', text: game.round === 1 ? 'Vamos a colocar los personajes y resolver sus decisiones iniciales.' : 'Llamaré solo a quienes tengan algo que hacer esta noche.' }
    if (game.phase === 'night-result') return { icon: <Sun size={30} />, kicker: `Día ${game.round}`, title: 'Amanece en la aldea', text: game.lastDeaths.length ? `${game.lastDeaths.length === 1 ? 'Una persona ha muerto' : `${game.lastDeaths.length} personas han muerto`} esta noche. Revisa el resumen antes de abrir la votación.` : game.elderSurvivedAttack ? 'No hay víctimas. El Anciano ha resistido el ataque de los lobos.' : 'La noche ha pasado tranquila. Todo el mundo sigue con vida.' }
    if (game.phase === 'day-discussion') return { icon: <Users size={30} />, kicker: game.openingDay ? 'Día previo · Ángel' : `Día ${game.round}`, title: game.openingDay ? 'La partida empieza de día' : 'Empieza el debate', text: game.openingDay ? 'El Ángel hace que la partida empiece con un debate y una votación.' : 'Cuenta lo que ha pasado y deja que la aldea hable.' }
    if (game.phase === 'day-vote') return { icon: <Vote size={30} />, kicker: `Día ${game.round} · Votación`, title: game.judgeSecondVoteActive ? 'Segunda votación' : 'La aldea vota', text: 'Elige a quién expulsa la aldea. Las reglas especiales se aplicarán al confirmar.' }
    if (game.phase === 'sheriff-action') return { icon: <Star size={30} />, kicker: 'Último aliento del Alguacil', title: 'El Alguacil nombra sucesor', text: 'Antes de abandonar la partida, el Alguacil elige quién hereda su cargo y su voto doble.' }
    if (game.phase === 'hunter-action') return { icon: <RoleArtwork roleId="hunter" className="phase-role-art" />, kicker: 'Última acción del Cazador', title: 'El Cazador dispara', text: 'Antes de abandonar la partida, el Cazador debe señalar a una persona.' }
    if (game.phase === 'servant-action') return { icon: <RoleArtwork roleId="devoted_servant" className="phase-role-art" />, kicker: 'Antes de revelar la carta', title: 'La Sirvienta decide', text: `${selectedName(game.pendingVoteTargetId)} ha sido elegido. Puede quedarse con su carta antes de que la reveles.` }
    if (game.phase === 'scapegoat-action') return { icon: <RoleArtwork roleId="scapegoat" className="phase-role-art" />, kicker: 'Empate en la votación', title: 'El Cabeza de Turco elige', text: 'Antes de salir, decide quién podrá votar en la próxima ronda.' }
    if (game.phase === 'game-over') return winnerCopy(game.winner)
    return { icon: <RoleArtwork roleId={currentRoleId} className="phase-role-art" />, kicker: `Noche ${game.round} · Llamada ${game.sequenceIndex + 1} de ${game.nightSequence.length}`, title: actingAsActor ? `El Comediante actúa como ${currentRole?.name}` : `Se despierta ${currentRole?.name}`, text: actingAsActor ? `Despierta al Comediante en lugar de ${currentRole?.name}. ${currentRole?.narratorPrompt ?? ''} Retira después la carta del centro.` : currentRole?.narratorPrompt ?? '' }
  }, [game, currentRoleId, actingAsActor])

  const chorusTargets = [
    ...targets,
    ...(currentRoleId === 'werewolf' && game.night.wolfTargetId ? [game.night.wolfTargetId] : []),
    ...(currentRoleId === 'infect_father' && game.night.wolfTargetId ? [game.night.wolfTargetId] : []),
    ...(currentRoleId === 'fierce_wolf' && game.night.fierceWolfTargetId ? [game.night.fierceWolfTargetId] : []),
    ...(currentRoleId === 'albino_wolf' && game.night.albinoWolfTargetId ? [game.night.albinoWolfTargetId] : []),
    ...(currentRoleId === 'raven' && game.night.ravenTargetId ? [game.night.ravenTargetId] : []),
    ...(currentRoleId === 'pyromaniac' && game.night.pyromaniacTargetId ? [game.night.pyromaniacTargetId] : []),
    ...(currentRoleId === 'witch' && game.night.witchPoisonTargetId ? [game.night.witchPoisonTargetId] : []),
  ]

  const roleAction = game.phase === 'role-call' && currentRole ? <>
    {isDiscoveryCall && <div className="discovery-box"><div><Eye size={17} /><strong>Ubica el personaje</strong><small>Marca {expectedOwnerCount === 1 ? 'a quien ha abierto los ojos' : `a las ${expectedOwnerCount} personas que han abierto los ojos`}.</small></div><PlayerPicker players={alive.filter((player) => !player.roleId || player.roleId === currentRoleId)} selected={assignedOwners.map((player) => player.id)} onSelect={toggleOwner} compact /></div>}
    {discoveryComplete && <div className="who-wakes"><Moon size={16} /> {roleOwners.map((player) => player.name).join(' y ') || (currentRoleId === 'werewolf' ? 'Manada identificada' : 'Acción del narrador')}</div>}
    {discoveryComplete && <RoleAction game={game} setGame={setGame} roleId={currentRoleId!} owners={roleOwners} eligibleTargets={eligibleTargets} targets={targets} updateNight={updateNight} updateTargets={updateTargets} toggleTarget={toggleTarget} skipRole={skipRole} selectedName={selectedName} />}
    <div className="game-action"><button className="button button-light button-large" disabled={!canAdvance} onClick={advance}>{currentRole.passive ? 'Todo anotado' : `${currentRole.shortName} vuelve a dormir`} <ArrowRight size={19} /></button></div>
  </> : null

  return <SeatContext.Provider value={seatNumbers}><main className={`game-shell ${isDay ? 'day' : ''}`}><header className="game-header"><button className="icon-button" onClick={onExit} aria-label="Volver al inicio"><ArrowLeft size={20} /></button><div><span className="round-dot" /> {isDay ? 'Día' : 'Noche'} {game.round}</div><div className="header-actions"><button className="icon-button" onClick={onUndo} disabled={!canUndo} aria-label="Deshacer" title="Deshacer el último paso"><Undo2 size={19} /></button><button className="roles-button" onClick={() => setShowRoles(!showRoles)} aria-expanded={showRoles}><Eye size={17} /> {showRoles ? 'Ocultar' : 'Ver roles'}</button></div></header>
    {showRoles && <RoleDrawer game={game} onClose={closeRoles} />}
    <section className="game-content"><div className="turn-heading"><div className="phase-icon">{phase.icon}</div><div><p className="eyebrow">{phase.kicker}</p><h2>{phase.title}</h2><p className="phase-copy">{phase.text}</p></div></div>
      {game.phase === 'role-call' && <>
        <button className="chorus-toggle" onClick={() => setShowChorus(!showChorus)}><Map size={17} /> {showChorus ? 'Ocultar coro' : 'Mostrar coro'}</button>
        <div className="night-workspace"><div className="night-interaction">{roleAction}</div><aside className={`night-map-panel ${showChorus ? 'show' : ''}`}><SeatingCircle players={game.players} sheriffId={game.sheriffId} awakeIds={roleOwners.map((player) => player.id)} targetIds={chorusTargets} wolfVictimId={currentRoleId === 'witch' ? game.night.wolfTargetId : undefined} protectedId={game.night.protectedTargetId} round={game.round} /></aside></div>
      </>}
      {game.phase === 'night-intro' && <><div className="intro-map"><SeatingCircle players={game.players} sheriffId={game.sheriffId} awakeIds={[]} targetIds={[]} round={game.round} /></div><div className="game-action"><button className="button button-light button-large" onClick={() => setGame(game.nightSequence.length ? { ...game, phase: 'role-call', sequenceIndex: 0 } : { ...game, phase: 'night-result' })}>{game.openingDay ? 'Ubicar al Ángel' : 'Empezar las llamadas'} <ArrowRight size={19} /></button></div></>}
      {game.phase === 'night-result' && <><DaySummary game={game} />{!game.pendingHunters.length && <SheriffElection game={game} setGame={setGame} />}<div className="game-action morning-actions">{game.pendingHunters.length > 0 ? <button className="button button-dark button-large" onClick={() => setGame({ ...game, phase: 'hunter-action' })}>🎯 El Cazador dispara</button> : game.sheriffSuccessionPending ? <button className="button button-dark button-large" onClick={() => setGame({ ...game, phase: 'sheriff-action' })}><Star size={19} /> El Alguacil nombra sucesor</button> : <><button className="button button-dark button-large" onClick={() => setGame({ ...game, phase: 'day-vote', pendingVoteTargetId: undefined })}>Abrir votación <Vote size={19} /></button><button className="button button-outline" onClick={() => setGame({ ...game, phase: 'day-discussion' })}>Empezar debate</button></>}</div></>}
      {game.phase === 'day-discussion' && <SheriffElection game={game} setGame={setGame} />}
      {game.phase === 'day-discussion' && <div className="game-action"><button className="button button-dark button-large" onClick={() => setGame({ ...game, phase: 'day-vote', pendingVoteTargetId: undefined })}>Abrir votación <Vote size={19} /></button></div>}
      {game.phase === 'day-vote' && <VoteScreen game={game} setGame={setGame} />}
      {game.phase === 'hunter-action' && <HunterShot game={game} setGame={setGame} />}
      {game.phase === 'sheriff-action' && <PlayerPicker players={alive} selected={[]} onSelect={(id) => setGame(resolveSheriffSuccession(game, id))} label="Nuevo Alguacil" />}
      {game.phase === 'servant-action' && <div className="decision-cards"><button onClick={() => setGame(resolveServantChoice(game, true))}><span>🫶</span><strong>Adoptar el personaje</strong><small>La Sirvienta conserva la vida con la carta de {selectedName(game.pendingVoteTargetId)}.</small></button><button onClick={() => setGame(resolveServantChoice(game, false))}><span>🌙</span><strong>No intervenir</strong><small>La persona elegida será eliminada normalmente.</small></button></div>}
      {game.phase === 'scapegoat-action' && <><PlayerPicker players={alive.filter((player) => player.id !== game.pendingVoteTargetId)} selected={game.scapegoatVoters} onSelect={(id) => setGame({ ...game, scapegoatVoters: game.scapegoatVoters.includes(id) ? game.scapegoatVoters.filter((item) => item !== id) : [...game.scapegoatVoters, id] })} label="Podrán votar la próxima vez" /><div className="game-action"><button className="button button-dark button-large" disabled={!game.scapegoatVoters.length} onClick={() => setGame(resolveScapegoat(game, game.scapegoatVoters))}>Confirmar decisión <ArrowRight size={19} /></button></div></>}
      {game.phase === 'game-over' && <div className="game-action"><button className="button button-light button-large" onClick={onEnd}><RotateCcw size={19} /> Volver al inicio</button></div>}
    </section><footer className="alive-strip"><span><span className="alive-dot" /> {alive.length} con vida</span><span>{game.players.length - alive.length} eliminados</span></footer>
  </main></SeatContext.Provider>
}

function RoleAction({ game, setGame, roleId, owners, eligibleTargets, targets, updateNight, updateTargets, toggleTarget, skipRole, selectedName }: { game: GameState; setGame: (game: GameState) => void; roleId: RoleId; owners: Player[]; eligibleTargets: Player[]; targets: string[]; updateNight: (patch: Partial<GameState['night']>) => void; updateTargets: (roleId: RoleId, targets: string[]) => void; toggleTarget: (roleId: RoleId, id: string, max: number) => void; skipRole: (roleId: RoleId) => void; selectedName: (id?: string) => string | undefined }) {
  const role = ROLES[roleId]
  if (roleId === 'wolf_hound') return <RuleCard title="No hace falta preguntarle"><p>Solo anota quién tiene el Perro Lobo. Cuando despierte la manada, marca si ha abierto los ojos con ellos.</p></RuleCard>
  if (roleId === 'thief') return <ThiefActions game={game} setGame={setGame} />
  if (roleId === 'sectarian') return <SectarianGroups game={game} setGame={setGame} />
  if (roleId === 'actor') return <ActorActions game={game} setGame={setGame} />
  if (roleId === 'werewolf') return <>
    {(game.round === 1 || game.servantRestartRole === 'wolf_hound') && game.players.some((player) => player.roleId === 'wolf_hound' && player.alive) && <ToggleCard active={game.roleChoices.wolf_hound === 'wolves'} icon="🐕" title="El Perro Lobo abrió los ojos con la manada" text="Márcalo solo si lo has observado; no se le pregunta su elección." onClick={() => setGame({ ...game, roleChoices: { ...game.roleChoices, wolf_hound: game.roleChoices.wolf_hound === 'wolves' ? 'village' : 'wolves' } })} />}
    <PlayerPicker players={eligibleTargets} selected={game.night.wolfTargetId ? [game.night.wolfTargetId] : []} onSelect={(id) => updateNight({ wolfTargetId: id })} label="Víctima de la manada" />
    {!game.villagePowersDisabled && game.players.some((player) => player.roleId === 'little_girl' && player.alive) && <ToggleCard active={game.night.littleGirlCaught} icon="👁️" title="La Niña Pequeña ha sido sorprendida" text="Si la descubren espiando, morirá en lugar de la víctima elegida." onClick={() => updateNight({ littleGirlCaught: !game.night.littleGirlCaught })} />}
  </>
  if (roleId === 'infect_father') return <ToggleCard active={game.night.infectVictim} disabled={!game.infectionAvailable || !game.night.wolfTargetId} icon="🦠" title="Infectar a la víctima" text={!game.infectionAvailable ? 'El poder ya se utilizó.' : !game.night.wolfTargetId ? 'La manada todavía no ha elegido víctima.' : game.players.find((player) => player.id === game.night.wolfTargetId)?.roleId === 'elder' && game.elderWolfHits === 0 ? `${selectedName(game.night.wolfTargetId)} es el Anciano: la primera mordedura no le infecta y resistirá el ataque. El poder se gastará.` : `${selectedName(game.night.wolfTargetId)} no morirá y se incorporará en secreto a la manada.`} onClick={() => updateNight({ infectVictim: !game.night.infectVictim })} />
  if (roleId === 'fierce_wolf') return game.wolfDeathsOccurred ? <RuleCard title="El segundo ataque se ha perdido"><p>Ya ha muerto un Hombre Lobo, el Niño Salvaje o el Perro Lobo.</p></RuleCard> : <PlayerPicker players={eligibleTargets} selected={game.night.fierceWolfTargetId ? [game.night.fierceWolfTargetId] : []} onSelect={(id) => updateNight({ fierceWolfTargetId: id })} label="Segunda víctima del Lobo Feroz" />
  if (roleId === 'albino_wolf' && game.round === 1) return <RuleCard title="Esta noche no actúa solo"><p>Participa con la manada. Su ataque contra otro lobo empieza en la segunda noche y se repite una noche de cada dos.</p></RuleCard>
  if (roleId === 'albino_wolf') return <PlayerPicker players={eligibleTargets} selected={game.night.albinoWolfTargetId ? [game.night.albinoWolfTargetId] : []} onSelect={(id) => updateNight({ albinoWolfTargetId: id })} label="Hombre Lobo eliminado por el Albino" />
  if (roleId === 'protector') return <PlayerPicker players={eligibleTargets} selected={targets} onSelect={(id) => updateNight({ targets: { ...game.night.targets, protector: [id] }, protectedTargetId: id })} label="Persona protegida esta noche" />
  if (roleId === 'seer') return <><PlayerPicker players={eligibleTargets} selected={targets} onSelect={(id) => updateTargets(roleId, [id])} label="Persona investigada" />{targets[0] && game.players.find((player) => player.id === targets[0])?.roleId && <RevealCard game={game} playerId={targets[0]} />}</>
  if (roleId === 'wild_child') return <PlayerPicker players={eligibleTargets} selected={targets} onSelect={(id) => updateTargets(roleId, [id])} label="Modelo a seguir" />
  if (roleId === 'cupid') return <><PlayerPicker players={eligibleTargets} selected={targets} onSelect={(id) => toggleTarget(roleId, id, 2)} label="Dos personas enamoradas" />{targets.length === 2 && <RuleCard title="Despierta ahora a los amantes"><p>Toca sus cabezas y deja que se reconozcan antes de continuar.</p></RuleCard>}</>
  if (roleId === 'flutist') return <><PlayerPicker players={eligibleTargets} selected={targets} onSelect={(id) => toggleTarget(roleId, id, Math.min(2, eligibleTargets.length))} label="Personas hechizadas esta noche" />{targets.length > 0 && <RuleCard title="Reúne a todos los hechizados"><p>Despierta también a {game.charmedIds.concat(targets).map(selectedName).filter(Boolean).join(', ')} para que se reconozcan.</p></RuleCard>}</>
  if (roleId === 'fox') return <><PlayerPicker players={alivePlayers(game)} selected={targets} onSelect={(id) => updateTargets(roleId, [id])} label="Persona central de tres vecinos" /><button className="skip-action" onClick={() => skipRole(roleId)}>{game.night.skippedRoles.includes(roleId) ? <Check size={16} /> : null} No usar el poder esta noche</button>{targets[0] && <FoxResult game={game} centerId={targets[0]} />}</>
  if (roleId === 'witch') return <WitchActions game={game} updateNight={updateNight} selectedName={selectedName} />
  if (roleId === 'raven') return <OptionalTarget title="Persona con dos votos en contra" players={eligibleTargets} selected={game.night.ravenTargetId} onSelect={(id) => updateNight({ ravenTargetId: game.night.ravenTargetId === id ? undefined : id })} />
  if (roleId === 'pyromaniac') return <OptionalTarget title="Edificio que arde esta noche" players={eligibleTargets} selected={game.night.pyromaniacTargetId} disabled={!game.pyromaniacAvailable} onSelect={(id) => updateNight({ pyromaniacTargetId: game.night.pyromaniacTargetId === id ? undefined : id })} />
  if (role.callKind === 'one-target') return <PlayerPicker players={eligibleTargets} selected={targets} onSelect={(id) => updateTargets(roleId, [id])} label="Elige una persona" />
  if (role.passive) return <RuleCard title="Sin acción esta noche"><p>{role.description} Su efecto se aplicará cuando toque.</p></RuleCard>
  return <RuleCard title="Sin elección"><p>{role.description}</p></RuleCard>
}

const availableActorCards = (game: GameState) => {
  // Partidas guardadas antes de preparar las 3 cartas: se ofrece cualquier carta válida
  const cards = game.actorCards?.length ? game.actorCards : ROLE_LIST.filter((role) => isActorCandidate(role.id)).map((role) => role.id)
  return cards.filter((id) => !game.actorUsedRoles.includes(id))
}

function ActorActions({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  const allowed = availableActorCards(game)
  const chosen = game.night.actorRoleId ? ROLES[game.night.actorRoleId] : undefined
  if (!allowed.length) return <RuleCard title="No le quedan cartas"><p>El Comediante ya ha usado todas sus cartas y actúa como un Aldeano más.</p></RuleCard>
  return <><ChoiceSelect label="Carta del centro elegida por el Comediante" value={game.night.actorRoleId ?? ''} onChange={(value) => setGame({ ...game, night: { ...game.night, actorRoleId: (value || undefined) as RoleId | undefined } })} options={allowed.map((id) => ({ value: id, label: ROLES[id].name }))} />
    {chosen && <RuleCard title={`Actuará como ${chosen.name}`}><p>Vuelve a dormir ahora. Lo despertaré de nuevo en el turno de {chosen.name} para que use su poder.</p></RuleCard>}
  </>
}

function ThiefActions({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  const leftovers = game.thiefLeftovers ?? []
  const deckRoles = [...new Set(game.deck)]
  const counts = countRoles(game.deck)
  const setLeftover = (index: number, value: string) => {
    const next = [...leftovers]
    next[index] = value as RoleId
    setGame({ ...game, thiefLeftovers: next, roleChoices: { ...game.roleChoices, thief: undefined } })
  }
  // Una carta solo puede estar dos veces en el centro si hay al menos dos en el mazo (la del Ladrón está en su mano)
  const optionsFor = (index: number) => deckRoles.filter((id) => {
    const other = leftovers[1 - index]
    const available = (counts[id] ?? 0) - (id === 'thief' ? 1 : 0) - (other === id ? 1 : 0)
    return available > 0
  }).map((id) => ({ value: id, label: ROLES[id].name }))
  const ready = leftovers.filter(Boolean).length === 2
  const mustSwap = ready && leftovers.every(isWolfRole)
  return <>
    <ChoiceSelect label="Primera carta sobrante" value={leftovers[0] ?? ''} onChange={(value) => setLeftover(0, value)} options={optionsFor(0)} />
    <ChoiceSelect label="Segunda carta sobrante" value={leftovers[1] ?? ''} onChange={(value) => setLeftover(1, value)} options={optionsFor(1)} />
    {ready && <ChoiceSelect label="Decisión del Ladrón" value={game.roleChoices.thief ?? ''} onChange={(value) => setGame({ ...game, roleChoices: { ...game.roleChoices, thief: value || undefined } })} options={[...(mustSwap ? [] : [{ value: 'thief', label: 'Conserva el Ladrón' }]), ...[...new Set(leftovers)].map((id) => ({ value: id, label: `Cambia por ${ROLES[id].name}` }))]} />}
    {mustSwap && <RuleCard title="Está obligado a cambiar"><p>Las dos cartas sobrantes son de lobo: el Ladrón debe quedarse con una de ellas.</p></RuleCard>}
  </>
}

function SectarianGroups({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  return <div className="group-assignment"><div><strong>Dos grupos públicos</strong><small>Reproduce aquí la división que hayas anunciado a la mesa.</small></div>{game.players.map((player) => <div className="group-row" key={player.id}><strong>{player.name}</strong><button className={game.sectarianGroups[player.id] === 'A' ? 'selected' : ''} onClick={() => setGame({ ...game, sectarianGroups: { ...game.sectarianGroups, [player.id]: 'A' } })}>Grupo A</button><button className={game.sectarianGroups[player.id] === 'B' ? 'selected' : ''} onClick={() => setGame({ ...game, sectarianGroups: { ...game.sectarianGroups, [player.id]: 'B' } })}>Grupo B</button></div>)}</div>
}

// En el día del Ángel las cartas aún no están ubicadas: quien sale muestra la suya y el narrador la anota
const needsCardReveal = (game: GameState, playerId?: string) => Boolean(game.openingDay && playerId && !game.players.find((player) => player.id === playerId)?.roleId)

function CardReveal({ game, playerId, value, onChange }: { game: GameState; playerId?: string; value: string; onChange: (value: string) => void }) {
  if (!needsCardReveal(game, playerId)) return null
  const name = game.players.find((player) => player.id === playerId)?.name
  return <ChoiceSelect label={`Carta que muestra ${name}`} value={value} onChange={onChange} options={unrevealedCards(game).map((id) => ({ value: id, label: ROLES[id].name }))} />
}

function SheriffElection({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  if (!canElectSheriff(game)) return null
  const firstElection = !game.players.some((player) => !player.alive)
  return <div className="discovery-box"><div><Star size={17} aria-hidden="true" /><strong>Elige al Alguacil</strong><small>{firstElection ? 'La aldea vota a su Alguacil. Su voto contará doble.' : 'La aldea no tiene Alguacil. Votad a uno nuevo; su voto contará doble.'}</small></div><PlayerPicker players={alivePlayers(game)} selected={[]} onSelect={(id) => setGame(electSheriff(game, id))} compact /></div>
}

function HunterShot({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  const [targetId, setTargetId] = useState<string>()
  const [card, setCard] = useState('')
  const alive = alivePlayers(game)
  if (!game.openingDay) return <><PlayerPicker players={alive} selected={[]} onSelect={(id) => setGame(resolveHunterShot(game, id))} label="Persona alcanzada por el disparo" /><p className="action-warning">El disparo se resuelve al instante.</p></>
  const missingCard = needsCardReveal(game, targetId) && !card
  return <>
    <PlayerPicker players={alive} selected={targetId ? [targetId] : []} onSelect={(id) => { setTargetId(id); setCard('') }} label="Persona alcanzada por el disparo" />
    <CardReveal game={game} playerId={targetId} value={card} onChange={setCard} />
    <div className="game-action"><button className="button button-dark button-large" disabled={!targetId || missingCard} onClick={() => targetId && setGame(resolveHunterShot(revealCard(game, targetId, (card || undefined) as RoleId | undefined), targetId))}>Confirmar disparo <ArrowRight size={19} /></button></div>
  </>
}

function VoteScreen({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  const [card, setCard] = useState('')
  const alive = alivePlayers(game)
  const missingCard = needsCardReveal(game, game.pendingVoteTargetId) && !card
  const ravenName = game.players.find((player) => player.id === game.ravenVoteTargetId)?.name
  const scapegoatAlive = !game.villagePowersDisabled && alive.some((player) => player.roleId === 'scapegoat')
  const sheriffName = game.players.find((player) => player.id === game.sheriffId && player.alive)?.name
  const foolName = game.foolRevealed ? alive.find((player) => player.roleId === 'village_fool')?.name : undefined
  return <>
    {game.scapegoatVoters.length > 0 && <RuleCard title="Derecho a voto limitado"><p>Por decisión del Cabeza de Turco, solo votan: {game.scapegoatVoters.map((id) => game.players.find((player) => player.id === id)?.name).filter(Boolean).join(', ')}.</p></RuleCard>}
    {ravenName && <RuleCard title={`El Cuervo acusa a ${ravenName}`}><p>Empieza la votación con dos votos en contra.</p></RuleCard>}
    <SheriffElection game={game} setGame={setGame} />
    {sheriffName && <RuleCard title={`El voto de ${sheriffName} cuenta doble`}><p>Es el Alguacil de la aldea.</p></RuleCard>}
    {foolName && <RuleCard title={`${foolName} no vota`}><p>El Tonto de la Aldea ya fue indultado y perdió su derecho a voto.</p></RuleCard>}
    <PlayerPicker players={alive} selected={game.pendingVoteTargetId ? [game.pendingVoteTargetId] : []} onSelect={(id) => { setCard(''); setGame({ ...game, pendingVoteTargetId: id }) }} label="Persona elegida por la aldea" />
    <CardReveal game={game} playerId={game.pendingVoteTargetId} value={card} onChange={setCard} />
    {!game.villagePowersDisabled && game.judgePowerAvailable && alive.some((player) => player.roleId === 'stuttering_judge') && <ToggleCard active={game.judgeSecondVoteRequested} icon="⚖️" title="El Juez ha hecho la señal" text="Después de esta expulsión habrá otra votación, sin debate." onClick={() => setGame({ ...game, judgeSecondVoteRequested: !game.judgeSecondVoteRequested })} />}
    <div className="game-action"><button className="button button-dark button-large" disabled={!game.pendingVoteTargetId || missingCard} onClick={() => game.pendingVoteTargetId && setGame(eliminateByVote(revealCard(game, game.pendingVoteTargetId, (card || undefined) as RoleId | undefined), game.pendingVoteTargetId))}><Skull size={19} /> Confirmar expulsión</button>{scapegoatAlive && <button className="button button-outline" onClick={() => setGame(beginScapegoatTie(game))}>La votación ha empatado</button>}<button className="text-button" onClick={() => setGame(phaseAfterNoVote(game))}>Nadie es expulsado</button></div>
  </>
}

function DaySummary({ game }: { game: GameState }) {
  const bear = game.players.find((player) => player.roleId === 'bear_tamer' && player.alive)
  return <div className="day-summary">
    {game.lastDeaths.length > 0 && <section className="death-summary" aria-label="Víctimas de la noche"><div className="death-summary-head"><span><Skull size={18} /></span><div><strong>Víctimas de la noche</strong><small>Estas personas han muerto esta noche</small></div><b>{game.lastDeaths.length}</b></div><div className="death-grid">{game.lastDeaths.map((id) => { const player = game.players.find((item) => item.id === id); if (!player) return null; return <article className="death-card" key={id}><RoleArtwork roleId={player.roleId} className="death-role-art" /><div><small>Ha muerto</small><strong>{player.name}</strong><p>{player.roleId ? ROLES[player.roleId].name : 'Carta sin revelar'}</p></div></article> })}</div></section>}
    {!game.lastDeaths.length && <div className="no-deaths-card"><span>🌤️</span><div><strong>La noche ha pasado tranquila</strong><small>Todo el mundo sigue con vida.</small></div></div>}
    {bear && !game.villagePowersDisabled && <div className={`morning-card ${bearGrowls(game) ? 'danger' : 'safe'}`}><span>🐻</span><div><strong>{bearGrowls(game) ? 'El oso gruñe' : 'El oso está tranquilo'}</strong><small>{bearGrowls(game) ? 'Hay un lobo vivo junto al Domador.' : 'No hay lobos vivos junto al Domador.'}</small></div></div>}
    {game.villagePowersDisabled && <div className="morning-card danger"><span>🌳</span><div><strong>La aldea pierde sus poderes</strong><small>El Anciano murió por una causa ajena al ataque de los lobos.</small></div></div>}
    {game.burnedPlayerId && <div className="morning-card"><span>🔥</span><div><strong>Edificio quemado</strong><small>Quita el edificio de {game.players.find((player) => player.id === game.burnedPlayerId)?.name}. Si sigue vivo, pasa a ser vagabundo.</small></div></div>}
  </div>
}

function SeatingCircle({ players, sheriffId, awakeIds, selectedIds = [], targetIds, wolfVictimId, protectedId, round, onSeatClick, variant = 'night' }: { players: Player[]; sheriffId?: string; awakeIds: string[]; selectedIds?: string[]; targetIds: string[]; wolfVictimId?: string; protectedId?: string; round: number; onSeatClick?: (id: string) => void; variant?: 'night' | 'setup' }) {
  const mapHeight = variant === 'setup' ? Math.max(420, Math.ceil(players.length / 2) * 76 + 108) : Math.max(380, players.length * 48)
  const setupRows = Math.ceil(players.length / 2)
  const setupRightCount = Math.max(0, Math.floor(players.length / 2) - 1)
  const W_px = 620 * 0.8
  const H_px = mapHeight * 0.75
  const P = 2 * (W_px + H_px)

  return <div className={`chorus-map ${variant === 'setup' ? 'chorus-map--setup' : ''}`.trim()} style={{ '--map-height': `${mapHeight}px` } as React.CSSProperties} aria-label="Ubicación de las personas en el coro"><div className="chorus-center"><Moon size={18} /><strong>Coro</strong><small>{variant === 'setup' ? 'Orden de asientos' : `Noche ${round}`}</small></div>{players.map((player, index) => {
    const d = (index / players.length) * P
    let x = 0, y = 0
    if (d <= W_px / 2) {
      x = W_px / 2 + d; y = 0
    } else if (d <= W_px / 2 + H_px) {
      x = W_px; y = d - W_px / 2
    } else if (d <= W_px / 2 + H_px + W_px) {
      x = W_px - (d - (W_px / 2 + H_px)); y = H_px
    } else if (d <= W_px / 2 + 2 * H_px + W_px) {
      x = 0; y = H_px - (d - (W_px / 2 + H_px + W_px))
    } else {
      x = d - (W_px / 2 + 2 * H_px + W_px); y = 0
    }

    const xFrac = x / W_px
    const yFrac = y / H_px
    // En dos columnas el coro se recorre como la mesa: baja por la derecha y sube por la izquierda
    const gridPlace = (() => {
      if (index === 0) return { column: 1, row: 1 }
      if (index === 1) return { column: 2, row: 1 }
      if (index < 2 + setupRightCount) return { column: 2, row: index }
      return { column: 1, row: setupRows - (index - (2 + setupRightCount)) }
    })()
    const style = variant === 'setup'
      ? { gridColumn: `${gridPlace.column}`, gridRow: `${gridPlace.row}` }
      : { left: `calc(65px + (100% - 130px) * ${xFrac})`, top: `calc(55px + (100% - 110px) * ${yFrac})`, '--seat-col': gridPlace.column, '--seat-row': gridPlace.row } as React.CSSProperties

    const classes = ['chorus-seat', awakeIds.includes(player.id) ? 'awake' : '', selectedIds.includes(player.id) ? 'seat-selected' : '', targetIds.includes(player.id) ? 'targeted' : '', wolfVictimId === player.id ? 'victim' : '', protectedId === player.id ? 'protected' : '', !player.alive ? 'dead' : '', onSeatClick ? 'clickable' : ''].filter(Boolean).join(' ')
    const states = [awakeIds.includes(player.id) ? 'despierto' : '', selectedIds.includes(player.id) ? 'seleccionado' : '', targetIds.includes(player.id) ? 'objetivo' : '', wolfVictimId === player.id ? 'víctima' : '', protectedId === player.id ? 'protegido' : '', sheriffId === player.id ? 'Alguacil' : '', !player.alive ? 'eliminado' : ''].filter(Boolean)
    return <button className={classes} style={style} key={player.id} title={player.name} onClick={() => onSeatClick?.(player.id)} aria-label={`Asiento ${index + 1}: ${player.name}${states.length ? `, ${states.join(', ')}` : ''}`}><span className="seat-number">{index + 1}</span><strong>{player.name}</strong>{player.roleId && <RoleArtwork roleId={player.roleId} className="seat-role-art" />}{sheriffId === player.id && <span className="seat-badge" aria-hidden="true"><Star size={12} /></span>}</button>
  })}</div>
}

function WitchActions({ game, updateNight, selectedName }: { game: GameState; updateNight: (patch: Partial<GameState['night']>) => void; selectedName: (id?: string) => string | undefined }) {
  const alive = alivePlayers(game)
  const realVictim = game.night.infectVictim || game.night.littleGirlCaught ? undefined : game.night.wolfTargetId
  return <div className="witch-actions"><button disabled={!game.healPotionAvailable || !realVictim} className={`potion-card ${game.night.witchSaved ? 'selected' : ''}`} onClick={() => updateNight({ witchSaved: !game.night.witchSaved })}><span>💚</span><div><strong>Poción de curación</strong><small>{!game.healPotionAvailable ? 'Ya utilizada' : realVictim ? `Salvar a ${selectedName(realVictim)}` : 'Esta noche no hay víctima que curar'}</small></div>{game.night.witchSaved && <Check size={19} />}</button>
    <div className={`poison-box ${!game.poisonPotionAvailable ? 'disabled' : ''}`}><div><span>☠️</span><strong>Poción de veneno</strong><small>{game.poisonPotionAvailable ? 'Eliminar a otra persona' : 'Ya utilizada'}</small></div>{game.poisonPotionAvailable && <PlayerPicker players={alive.filter((player) => player.roleId !== 'witch')} selected={game.night.witchPoisonTargetId ? [game.night.witchPoisonTargetId] : []} onSelect={(id) => updateNight({ witchPoisonTargetId: game.night.witchPoisonTargetId === id ? undefined : id })} compact />}</div>
  </div>
}

function FoxResult({ game, centerId }: { game: GameState; centerId: string }) {
  const trio = foxTrio(game, centerId)
  const hasWolf = trio.some((player) => isWolfAlignedPlayer(game, player))
  return <div className="reveal-card"><span>{hasWolf ? '🐺' : '🌾'}</span><div><small>{trio.map((player) => player.name).join(' · ')}</small><strong>{hasWolf ? 'Hay al menos un lobo: conserva el poder' : 'No hay lobos: el Zorro pierde el poder'}</strong></div></div>
}

function RevealCard({ game, playerId }: { game: GameState; playerId: string }) {
  const player = game.players.find((item) => item.id === playerId)
  if (!player?.roleId) return null
  return <div className="reveal-card"><RoleArtwork roleId={player.roleId} /><div><small>Su carta es</small><strong>{ROLES[player.roleId].name}</strong></div></div>
}

function OptionalTarget({ title, players, selected, disabled, onSelect }: { title: string; players: Player[]; selected?: string; disabled?: boolean; onSelect: (id: string) => void }) {
  if (disabled) return <RuleCard title="Poder ya utilizado"><p>Este personaje no tiene que hacer nada más.</p></RuleCard>
  return <><PlayerPicker players={players} selected={selected ? [selected] : []} onSelect={onSelect} label={title} /><p className="optional-note">Es opcional: puedes seguir sin elegir a nadie.</p></>
}

function ToggleCard({ active, disabled, icon, title, text, onClick }: { active: boolean; disabled?: boolean; icon: string; title: string; text: string; onClick: () => void }) {
  return <button disabled={disabled} className={`toggle-card ${active ? 'selected' : ''}`} onClick={onClick}><span>{icon}</span><div><strong>{title}</strong><small>{text}</small></div>{active && <Check size={19} />}</button>
}

function RuleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rule-card"><strong>{title}</strong>{children}</div>
}

function ChoiceSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <label className="choice-select"><span>{label}</span><div><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Selecciona la carta física…</option>{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select><ChevronDown size={17} /></div></label>
}

function PlayerPicker({ players, selected, onSelect, label, compact = false }: { players: Player[]; selected: string[]; onSelect: (id: string) => void; label?: string; compact?: boolean }) {
  const seats = useContext(SeatContext)
  return <div className={`picker ${compact ? 'compact' : ''}`}>{label && <h3>{label}</h3>}{players.length ? <div className="picker-grid">{players.map((player) => {
    const seat = seats[player.id]
    return <button className={selected.includes(player.id) ? 'selected' : ''} key={player.id} onClick={() => onSelect(player.id)} aria-pressed={selected.includes(player.id)} aria-label={seat ? `${player.name}, asiento ${seat}` : undefined}><span aria-hidden="true">{seat ?? player.name[0].toUpperCase()}</span>{player.name}{selected.includes(player.id) && <Check size={16} aria-hidden="true" />}</button>
  })}</div> : <p className="picker-empty">No hay nadie disponible para esta acción. Puedes seguir.</p>}</div>
}

function RoleDrawer({ game, onClose }: { game: GameState; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); opener?.focus() }
  }, [onClose])
  return <div className="drawer-backdrop" onClick={onClose}><aside className="role-drawer" role="dialog" aria-modal="true" aria-labelledby="role-drawer-title" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><p className="eyebrow">Solo para el narrador</p><h3 id="role-drawer-title">Cartas y estados</h3></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button></div><div className="drawer-list">{game.players.map((player) => {
    const states = [player.id === game.sheriffId ? 'Alguacil' : '', game.infectedIds.includes(player.id) ? 'Infectado' : '', game.charmedIds.includes(player.id) ? 'Hechizado' : '', game.lovers.includes(player.id) ? 'Enamorado' : '', player.id === game.mentorId ? 'Modelo' : ''].filter(Boolean)
    return <div className={`drawer-player ${!player.alive ? 'dead' : ''}`} key={player.id}><RoleArtwork roleId={player.roleId} className="role-icon small" /><div><strong>{player.name}</strong><small>{player.roleId ? ROLES[player.roleId].name : 'Aún sin ubicar'}{states.length ? ` · ${states.join(' · ')}` : ''}</small></div><b>{player.alive ? 'Con vida' : 'Eliminado'}</b></div>
  })}</div><button className="button button-primary" onClick={onClose}><Eye size={17} /> Cerrar</button></aside></div>
}

function RoleArtwork({ roleId, className = '' }: { roleId?: RoleId; className?: string }) {
  const role = roleId ? ROLES[roleId] : undefined
  const cardId = role?.id === 'pure_villager' ? 'villager' : role?.id
  const cardUrl = cardId ? `${import.meta.env.BASE_URL}cards/${cardId}.webp` : undefined
  const variantClass = role?.id === 'pure_villager' ? 'pure-variant' : ''
  return <span className={`role-artwork ${variantClass} ${className}`.trim()}>{role ? <><span aria-hidden="true">{role.icon}</span><img src={cardUrl} alt={`Carta de ${role.name}`} onError={(event) => { event.currentTarget.hidden = true }} /></> : <span aria-hidden="true">❔</span>}</span>
}

function winnerCopy(winner?: Winner) {
  const copies: Record<Winner, { icon: string; title: string; text: string }> = {
    village: { icon: '🏡', title: 'La aldea está a salvo', text: 'Todos los Hombres Lobo han sido eliminados.' },
    wolves: { icon: '🐺', title: 'Los lobos dominan la aldea', text: 'La manada iguala o supera al resto de habitantes.' },
    angel: { icon: '🪽', title: 'El Ángel despierta de su pesadilla', text: 'Ha sido eliminado en la primera votación o durante la primera noche.' },
    flutist: { icon: '🎶', title: 'El Flautista encanta la aldea', text: 'Todas las demás personas vivas están hechizadas.' },
    albino_wolf: { icon: '🐺', title: 'El Lobo Albino queda solo', text: 'Es el único superviviente de Castronegro.' },
    sectarian: { icon: '🕯️', title: 'Vence el Abominable Sectario', text: 'Ha eliminado a todo el grupo contrario.' },
    lovers: { icon: '💘', title: 'Los amantes sobreviven juntos', text: 'Son las dos únicas personas con vida.' },
    nobody: { icon: '🕯️', title: 'Nadie sobrevive', text: 'No queda nadie con vida en Castronegro: ningún bando gana.' },
  }
  const copy = copies[winner ?? 'village']
  return { icon: <span className="emoji-large">{copy.icon}</span>, kicker: 'Fin de la partida', title: copy.title, text: copy.text }
}

function countRoles(roles: RoleId[]): Partial<Record<RoleId, number>> {
  return roles.reduce<Partial<Record<RoleId, number>>>((counts, roleId) => { counts[roleId] = (counts[roleId] ?? 0) + 1; return counts }, {})
}

export default App
