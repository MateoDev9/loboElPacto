import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Bell, BookUser, Building2, Check, ChevronDown, CircleMinus, CirclePlus, Crosshair,
  Dog, Eye, Feather, Flame, FlaskConical, Heart, HeartHandshake, History, KeyRound, Lock, Map, Moon, Music,
  Pause, PawPrint, Play, RotateCcw, Scale, Scissors, ShieldCheck, Skull, SlidersHorizontal, Sparkles, Star, Sun, Timer, Trash2,
  TreeDeciduous, Undo2, Users, Volume2, Vote, Wheat, X,
} from 'lucide-react'
import {
  activateWithFounderCode, isProRole, PRO_PRICE_LABEL, purchaseGrimorioPro, restoreGrimorioPurchase, verifyStoredEntitlement,
} from './billing'
import { BUILDING_LIST, BUILDINGS, recommendedBuildings } from './buildings'
import {
  advanceRoleCall, alivePlayers, aliveWolves, applyActorChoice, applyApothecaryRestore, applyBarberCut, applyConfessorPower,
  applyMayorAssign, applyThiefChoice, assignRoleOwners, bearGrowls, beginScapegoatTie, canElectSheriff, createGame, electSheriff,
  eligibleSheriffCandidates, eliminateByVote, foxTrio, hasActiveBuilding, isVagrant, isWolfAlignedPlayer,
  phaseAfterNoVote, resolveHunterShot, resolveScapegoat, resolveServantChoice, resolveSheriffSuccession, revealCard, unrevealedCards,
} from './game'
import { CATEGORY_LABELS, HOUSE_RULES, isActorCandidate, isWolfRole, OFFICIAL_RULES, recommendedRoles, ROLE_LIST, ROLES } from './roles'
import { clearGame, loadGame, loadHistory, loadLastGroups, loadPeople, loadRules, saveGame, saveHistory, saveLastGroups, savePeople, saveRules } from './storage'
import type { BuildingId, GameRules, GameState, Player, RoleCategory, RoleId, SetupStep, Winner } from './types'

type Screen = 'home' | 'library' | 'setup' | 'game'

// Número de asiento de cada jugador: los selectores lo muestran para relacionarlos con el coro
const SeatContext = createContext<Record<string, number>>({})

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const requestLock = async () => {
      try {
        if (document.visibilityState === 'visible' && !cancelled) {
          sentinel = await navigator.wakeLock.request('screen')
        }
      } catch {
        // El navegador o el ahorro de batería no permite Wake Lock
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void requestLock()
    }

    void requestLock()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      void sentinel?.release().catch(() => {})
    }
  }, [active])
}

function playTimerChime() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([220, 100, 280])
    }
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    ;[528, 660].forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.22)
      gain.gain.setValueAtTime(0.001, now + idx * 0.22)
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.22 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.22 + 0.9)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.22)
      osc.stop(now + idx * 0.22 + 0.95)
    })
  } catch {
    // Sin audio disponible
  }
}

function WolfCrest({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true" className="wolf-crest-svg">
      <path d="M7 6L12.5 14L18 11L23.5 14L29 6L27.5 19.5L31 24.5L23.5 29L18 32L12.5 29L5 24.5L8.5 19.5L7 6Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12.5 19.5L15.5 21.5M23.5 19.5L20.5 21.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M15.5 26L18 28L20.5 26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [setupStep, setSetupStep] = useState<SetupStep>('players')
  const [people, setPeople] = useState<string[]>(() => loadPeople())
  const [names, setNames] = useState<string[]>([])
  const [deck, setDeck] = useState<RoleId[]>([])
  const [actorCards, setActorCards] = useState<RoleId[]>([])
  const [useSheriff, setUseSheriff] = useState(false)
  const [useBuildings, setUseBuildings] = useState(false)
  const [rules, setRules] = useState<GameRules>(() => loadRules())
  const [game, setGame] = useState<GameState | null>(() => loadGame())
  // Estados anteriores de la partida para poder deshacer un toque equivocado (persistido en localStorage)
  const [history, setHistory] = useState<GameState[]>(() => loadHistory())
  const [isPro, setIsPro] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  useWakeLock(screen === 'game' && Boolean(game))

  useEffect(() => {
    void verifyStoredEntitlement().then((valid) => {
      if (valid) setIsPro(true)
    })
  }, [])

  useEffect(() => { savePeople(people) }, [people])
  useEffect(() => { saveRules(rules) }, [rules])
  useEffect(() => { if (game) saveGame(game) }, [game])
  useEffect(() => { saveHistory(history) }, [history])

  const updateGame = (next: GameState) => {
    if (game) setHistory((previous) => [...previous.slice(-14), game])
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
    setGame(createGame(names, deck, deck.includes('actor') ? actorCards.filter((id) => !deck.includes(id)) : [], { sheriff: useSheriff, rules, buildings: useBuildings }))
    setHistory([])
    const previous = loadLastGroups().filter((group) => group.join(',') !== names.join(','))
    saveLastGroups([names, ...previous].slice(0, 10))
    setScreen('game')
  }
  const endGame = () => { clearGame(); setGame(null); setHistory([]); setScreen('home') }

  const paywallModal = showPaywall ? (
    <ProPaywallModal
      onClose={() => setShowPaywall(false)}
      onUnlocked={() => {
        setIsPro(true)
        setShowPaywall(false)
      }}
    />
  ) : null

  if (screen === 'library') return <>{paywallModal}<PeopleLibrary people={people} addPerson={addPerson} removePerson={(name) => setPeople(people.filter((person) => person !== name))} onBack={() => setScreen('home')} /></>
  if (screen === 'setup') {
    if (setupStep === 'players') return <>{paywallModal}<PlayersSetup people={people} names={names} setNames={setNames} addPerson={addPerson} onBack={() => setScreen('home')} onNext={goToRoles} /></>
    return <>{paywallModal}<DeckSetup playerCount={names.length} deck={deck} setDeck={setDeck} actorCards={actorCards} setActorCards={setActorCards} useSheriff={useSheriff} setUseSheriff={setUseSheriff} useBuildings={useBuildings} setUseBuildings={setUseBuildings} rules={rules} setRules={setRules} isPro={isPro} onOpenPaywall={() => setShowPaywall(true)} onBack={() => setSetupStep('players')} onNext={startGame} /></>
  }
  if (screen === 'game' && game) return <>{paywallModal}<GameScreen game={game} setGame={updateGame} canUndo={history.length > 0} onUndo={undo} isPro={isPro} onOpenPaywall={() => setShowPaywall(true)} onExit={() => setScreen('home')} onEnd={endGame} /></>
  return <>{paywallModal}<Home hasGame={Boolean(game)} onNew={startNewSetup} onLibrary={() => setScreen('library')} onContinue={() => setScreen('game')} /></>
}

function Home({ hasGame, onNew, onLibrary, onContinue }: { hasGame: boolean; onNew: () => void; onLibrary: () => void; onContinue: () => void }) {
  return <main className="home-shell"><section className="home-content">
    <div className="brand-mark" aria-hidden="true"><WolfCrest size={38} /></div>
    <span className="brand-kicker">Wolves · El pueblo duerme</span>
    <h1>El pueblo duerme.<br /><em>Es hora de empezar.</em></h1>
    <p className="hero-copy">Prepara las cartas físicas, anota quién tiene cada una conforme despierten la primera noche y dirige cada turno sin consultar el reglamento.</p>
    <div className="home-actions">
      <button className="button button-primary button-large" onClick={onNew}><CirclePlus size={20} /> Nueva partida</button>
      {hasGame && <button className="button button-secondary button-large" onClick={onContinue}><Play size={18} fill="currentColor" /> Continuar partida</button>}
      <button className="button button-secondary button-large" onClick={onLibrary}><BookUser size={19} /> Jugadores habituales</button>
    </div>
    <ol className="ritual-steps" aria-label="Cómo funciona">
      <li><span>I</span><div><strong>Mesa y mazo</strong><small>Elige quién se sienta a la mesa en sentido horario y prepara las cartas reales.</small></div></li>
      <li><span>II</span><div><strong>Primera noche</strong><small>Reparte las cartas físicas. La app ubica cada rol conforme abren los ojos.</small></div></li>
      <li><span>III</span><div><strong>Crónica guiada</strong><small>Llama en orden, resuelve ataques, pociones y votaciones con opción de deshacer.</small></div></li>
    </ol>
    <div className="feature-row"><span><Moon size={15} /> Orden de llamada</span><span><Users size={15} /> 31 personajes</span><span><ShieldCheck size={15} /> Sin conexión</span></div>
  </section></main>
}

function PageHeader({ step, onBack }: { step: string; onBack: () => void }) {
  return <header className="page-header"><button className="icon-button" onClick={onBack} aria-label="Volver"><ArrowLeft size={20} /></button><div className="mini-brand"><WolfCrest size={20} /> Wolves</div><span className="step-label">{step}</span></header>
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
    <div className="section-heading"><h2>Personas guardadas</h2><p>Guarda aquí los nombres de quienes suelen jugar. En cada partida solo tendrás que marcar quién está en la mesa.</p></div>
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
  const lastGroups = useMemo(() => loadLastGroups().filter((group) => group.every((name) => people.includes(name))), [people])
  return <main className="app-shell"><PageHeader step="Paso 1 de 2" onBack={onBack} /><section className="setup-wrap">
    <div className="section-heading"><h2>¿Quién juega hoy?</h2><p>Marca quién está hoy en la mesa. Después podrás colocar sus nombres en el orden de los asientos.</p></div>
    {lastGroups.length > 0 && names.length === 0 && <div className="history-groups">
      {!showHistory ? <button className="button button-secondary button-large reuse-button" style={{ width: '100%' }} onClick={() => setShowHistory(true)}><History size={18} /> Partidas anteriores ({lastGroups.length})</button> : <>
        <h3 className="history-heading"><History size={15} /> Partidas anteriores</h3>
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
      {names.length > 0 && <div className="seating-order"><div><div><strong>Orden de los asientos</strong><small>{selectedSeatIndex === null ? 'Toca un asiento y luego otro para cambiarlos. Empieza por la cabecera y sigue el sentido horario.' : `Asiento ${selectedSeatIndex + 1} seleccionado · toca otro para cambiarlo.`}</small></div><span className="clockwise-label"><RotateCcw size={13} style={{ transform: 'scaleX(-1)' }} /> Sentido horario</span></div>
        <div className="chorus-setup-map"><SeatingCircle variant="setup" players={names.map((name, i) => ({ id: i.toString(), name, alive: true }))} awakeIds={[]} selectedIds={selectedSeatIndex !== null ? [selectedSeatIndex.toString()] : []} targetIds={[]} round={1} onSeatClick={(id) => handleSeatClick(parseInt(id, 10))} /></div>
      </div>}
      <div className="inline-add"><small>¿Falta alguien? Añádelo aquí y quedará guardado.</small><PersonAdder people={people} addPerson={addPerson} onAdded={(name) => setNames([...names, name])} onExisting={(name) => { if (!names.includes(name)) setNames([...names, name]) }} /></div>
    </div>
    <div className="sticky-action"><span>{names.length < 5 ? `Faltan ${5 - names.length} personas` : `${names.length} personas jugarán`}</span><button className="button button-primary" disabled={names.length < 5} onClick={onNext}>Elegir cartas <ArrowRight size={18} /></button></div>
  </section></main>
}

function DeckSetup({
  playerCount, deck, setDeck, actorCards, setActorCards, useSheriff, setUseSheriff, useBuildings, setUseBuildings, rules, setRules, isPro, onOpenPaywall, onBack, onNext,
}: {
  playerCount: number
  deck: RoleId[]
  setDeck: (deck: RoleId[]) => void
  actorCards: RoleId[]
  setActorCards: (cards: RoleId[]) => void
  useSheriff: boolean
  setUseSheriff: (value: boolean) => void
  useBuildings: boolean
  setUseBuildings: (value: boolean) => void
  rules: GameRules
  setRules: (rules: GameRules) => void
  isPro: boolean
  onOpenPaywall: () => void
  onBack: () => void
  onNext: () => void
}) {
  const [customizeRules, setCustomizeRules] = useState(false)
  const counts = countRoles(deck)
  const categories: RoleCategory[] = ['wolves', 'village', 'ambiguous', 'solitary', 'village-expansion']
  // Con el Ladrón se reparten 2 cartas de más, que quedan boca abajo en el centro
  const cardTarget = playerCount + (counts.thief ? 2 : 0)
  const isRecommended = [...deck].sort().join() === recommendedRoles(playerCount).sort().join()
  const addCost = (id: RoleId) => id === 'two_sisters' ? 2 - (counts[id] ?? 0) : id === 'three_brothers' ? 3 - (counts[id] ?? 0) : 1
  const changeCount = (id: RoleId, delta: number) => {
    if (delta > 0 && !isPro && isProRole(id)) {
      onOpenPaywall()
      return
    }
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

  const isHousePreset = rules.sheriffTiebreakOnly && rules.sistersEveryNight && rules.seerFoxLastFirstNight && rules.hunterAlwaysShoots
  const isOfficialPreset = !rules.sheriffTiebreakOnly && !rules.sistersEveryNight && !rules.seerFoxLastFirstNight && !rules.hunterAlwaysShoots

  return <main className="app-shell"><PageHeader step="Paso 2 de 2" onBack={onBack} /><section className="setup-wrap roles-wrap">
    <div className="section-heading"><h2>Elige las cartas</h2><p>Puedes usar la combinación recomendada o ajustarla a las cartas físicas de tu mesa.</p></div>
    {!isPro ? (
      <button type="button" className="grimorio-banner" onClick={onOpenPaywall}>
        <span className="grimorio-banner-icon" aria-hidden="true"><Sparkles size={20} /></span>
        <div>
          <strong>Grimorio Completo PRO · {PRO_PRICE_LABEL}</strong>
          <small>Desbloquea los 24 personajes especiales (Infecto Padre, Flautista, Comediante, Ladrón, Cuervo…) con un único pago para siempre.</small>
        </div>
        <span className="grimorio-cta">Desbloquear</span>
      </button>
    ) : (
      <div className="grimorio-unlocked-pill"><Sparkles size={14} aria-hidden="true" /> Grimorio Completo PRO activo · 31 personajes desbloqueados</div>
    )}
    <div className="deck-summary"><span className="recommend-label"><Sparkles size={14} aria-hidden="true" /> {isRecommended ? 'Mazo recomendado' : 'Mazo personalizado'}</span><strong className={deck.length === cardTarget ? 'complete' : ''}>{deck.length} / {cardTarget} cartas</strong>{!isRecommended && <button className="text-button dark" onClick={() => setDeck(recommendedRoles(playerCount))}>Volver a la recomendación</button>}</div>
    {categories.map((category) => <section className="role-category" key={category}><h3>{CATEGORY_LABELS[category]}</h3><div className="catalog-grid">
      {ROLE_LIST.filter((item) => item.category === category).map((item) => {
        const count = counts[item.id] ?? 0
        const locked = !isPro && isProRole(item.id)
        const description = item.id === 'two_sisters'
          ? (rules.sistersEveryNight ? 'Se reconocen cada noche antes de los Lobos.' : 'Se reconocen la primera noche.')
          : item.description
        return <article className={`catalog-card ${count ? 'chosen' : ''} ${locked ? 'locked-role' : ''}`.trim()} key={item.id} style={{ '--role-color': item.color } as React.CSSProperties} onClick={locked ? onOpenPaywall : undefined}>
          <RoleArtwork roleId={item.id} className="role-icon" /><div><strong>{item.name} {locked && <span className="pro-tag"><Lock size={11} /> PRO</span>}</strong><small>{description}{item.id === 'two_sisters' ? ' Se añaden las 2 cartas.' : item.id === 'three_brothers' ? ' Se añaden las 3 cartas.' : ''}</small></div>{locked ? <div className="counter locked-counter"><button type="button" className="unlock-role-btn" onClick={(e) => { e.stopPropagation(); onOpenPaywall() }} aria-label={`Desbloquear ${item.name} con Grimorio PRO`}><Lock size={16} /></button></div> : <div className="counter"><button disabled={!count} onClick={() => changeCount(item.id, -1)} aria-label={`Quitar ${item.name}`}><CircleMinus size={20} /></button><b>{count}</b><button disabled={count >= item.maxCards || deck.length + addCost(item.id) > cardTarget} onClick={() => changeCount(item.id, 1)} aria-label={`Añadir ${item.name}`}><CirclePlus size={20} /></button></div>}
        </article>
      })}
    </div></section>)}
    {counts.actor ? <section className="role-category"><h3>Cartas del Comediante</h3><p className="optional-note">Elige 3 cartas con poder que no estén en el mazo; ninguna puede ser de lobo. Se colocan boca arriba en el centro y no se reparten.</p><PlayerPicker players={actorCandidates.map((item) => ({ id: item.id, name: item.name, alive: true }))} selected={chosenActorCards} onSelect={(id) => toggleActorCard(id as RoleId)} label={`${chosenActorCards.length} / 3 elegidas`} /></section> : null}
    {!deck.some(isWolfRole) && <p className="form-error">Incluye al menos un Hombre Lobo.</p>}
    <section className="role-category">
      <h3>Cargos y Edificaciones</h3>
      <ToggleCard
        active={useSheriff || useBuildings}
        icon={<Star size={22} />}
        title="Jugar con Alguacil"
        text={rules.sheriffTiebreakOnly
          ? 'La aldea elige a un Alguacil durante el día. Su voto solo decide en caso de empate y, si muere, nombra a su sucesor.'
          : 'La aldea elige a un Alguacil durante el día. Su voto cuenta doble y, si muere, nombra a su sucesor.'}
        onClick={() => setUseSheriff(!useSheriff)}
      />
      <ToggleCard
        active={useBuildings}
        icon={<Building2 size={22} />}
        title={isPro ? 'Jugar con Edificaciones (Oficios públicos)' : 'Jugar con Edificaciones · PRO'}
        text="Cada habitante recibe un edificio público (Granjero, Panadero, Tabernero, Barbero, Noble, Alcalde, Vagabundo…) con poderes adicionales."
        onClick={() => {
          if (!isPro) {
            onOpenPaywall()
            return
          }
          setUseBuildings(!useBuildings)
        }}
      />
    </section>
    <section className="role-category">
      <div className="rules-header-row">
        <h3>Variantes de reglas</h3>
        <button type="button" className="text-button dark" onClick={() => setCustomizeRules(!customizeRules)}>
          <SlidersHorizontal size={14} /> {customizeRules ? 'Ocultar ajustes' : 'Personalizar'}
        </button>
      </div>
      <div className="rules-preset-bar" role="group" aria-label="Modo de reglamento">
        <button type="button" className={`preset-pill ${isHousePreset ? 'selected' : ''}`} onClick={() => setRules({ ...HOUSE_RULES })}>
          <strong>Reglas de la casa</strong>
          <small>Alguacil solo desempata · Vidente al final Noche 1 · Hermanas cada noche · Cazador dispara siempre</small>
        </button>
        <button type="button" className={`preset-pill ${isOfficialPreset ? 'selected' : ''}`} onClick={() => setRules({ ...OFFICIAL_RULES })}>
          <strong>Reglamento estándar</strong>
          <small>Alguacil voto doble · Orden clásico Noche 1 · Hermanas Noche 1 · Cazador sin tiro por amor o empate</small>
        </button>
      </div>
      {customizeRules && (
        <div className="rules-custom-grid">
          <ToggleCard
            active={rules.sheriffTiebreakOnly}
            icon={<Star size={20} />}
            title="El Alguacil solo tiene voto doble ante un empate"
            text={rules.sheriffTiebreakOnly ? 'De normal su voto vale 1; si hay empate, decide quién sale.' : 'Su voto cuenta doble en todas las votaciones.'}
            onClick={() => setRules({ ...rules, sheriffTiebreakOnly: !rules.sheriffTiebreakOnly })}
          />
          <ToggleCard
            active={rules.seerFoxLastFirstNight}
            icon={<Eye size={20} />}
            title="Vidente y Zorro al final de la primera noche"
            text={rules.seerFoxLastFirstNight ? 'Despiertan tras el Infecto Padre para observar el bando real.' : 'Despiertan antes que los Lobos en la primera noche.'}
            onClick={() => setRules({ ...rules, seerFoxLastFirstNight: !rules.seerFoxLastFirstNight })}
          />
          <ToggleCard
            active={rules.sistersEveryNight}
            icon={<Users size={20} />}
            title="Las Dos Hermanas despiertan todas las noches"
            text={rules.sistersEveryNight ? 'Se comunican con gestos cada noche antes de los Lobos.' : 'Solo se reconocen durante la primera noche.'}
            onClick={() => setRules({ ...rules, sistersEveryNight: !rules.sistersEveryNight })}
          />
          <ToggleCard
            active={rules.hunterAlwaysShoots}
            icon={<Crosshair size={20} />}
            title="El Cazador dispara muera como muera"
            text={rules.hunterAlwaysShoots ? 'Dispara incluso si muere de pena o por empate del Cabeza de Turco.' : 'No dispara si muere de pena por Cupido o por empate del Cabeza de Turco.'}
            onClick={() => setRules({ ...rules, hunterAlwaysShoots: !rules.hunterAlwaysShoots })}
          />
        </div>
      )}
    </section>
    {!actorReady && <p className="form-error">Elige las 3 cartas del Comediante.</p>}
    <div className="sticky-action"><span>{deck.length === cardTarget ? (counts.thief ? 'El mazo está listo. Reparte una carta a cada persona y deja 2 boca abajo en el centro.' : 'El mazo está listo. Baraja y reparte las cartas.') : `${Math.abs(cardTarget - deck.length)} cartas ${deck.length < cardTarget ? 'por añadir' : 'de más'}`}</span><button className="button button-primary" disabled={!valid} onClick={onNext}>{deck.includes('angel') ? 'Empezar el día del Ángel' : 'Empezar primera noche'} <ArrowRight size={18} /></button></div>
  </section></main>
}

function DebateTimer() {
  const [secondsLeft, setSecondsLeft] = useState(180)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false)
          setFinished(true)
          playTimerChime()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [running])

  const setPreset = (secs: number) => {
    setRunning(false)
    setFinished(false)
    setSecondsLeft(secs)
  }

  const addMinute = () => {
    setFinished(false)
    setSecondsLeft((prev) => prev + 60)
  }

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
  const secs = (secondsLeft % 60).toString().padStart(2, '0')

  return (
    <div className={`debate-timer ${running ? 'running' : ''} ${finished ? 'finished' : ''}`} role="region" aria-label="Temporizador de debate">
      <div className="timer-display">
        <span className="timer-icon" aria-hidden="true">{finished ? <Bell size={18} /> : <Timer size={18} />}</span>
        <div>
          <strong className="timer-clock">{mins}:{secs}</strong>
          <small>{finished ? '¡Tiempo agotado! A votar' : running ? 'Debate en curso' : 'Reloj de la aldea'}</small>
        </div>
      </div>
      <div className="timer-controls">
        <button type="button" className="timer-chip" onClick={() => setPreset(180)}>3m</button>
        <button type="button" className="timer-chip" onClick={() => setPreset(300)}>5m</button>
        <button type="button" className="timer-chip" onClick={addMinute}>+1m</button>
        <button
          type="button"
          className="timer-play-btn"
          onClick={() => {
            if (secondsLeft === 0) setSecondsLeft(180)
            setFinished(false)
            setRunning(!running)
          }}
          aria-label={running ? 'Pausar temporizador' : 'Iniciar temporizador'}
        >
          {running ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
          <span>{running ? 'Pausar' : 'Iniciar'}</span>
        </button>
      </div>
    </div>
  )
}

function SpokenPrompt({ text }: { text?: string }) {
  if (!text) return null
  return (
    <div className="spoken-script-card" aria-label="Qué decir en voz alta">
      <Volume2 size={16} aria-hidden="true" />
      <div>
        <small>Di en voz alta a la mesa</small>
        <p>{text}</p>
      </div>
    </div>
  )
}

function ProPaywallModal({ onClose, onUnlocked }: { onClose: () => void; onUnlocked: () => void }) {
  const [showCodeBox, setShowCodeBox] = useState(false)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  const handleBuy = async () => {
    setBusy(true)
    setStatus('')
    const res = await purchaseGrimorioPro()
    setBusy(false)
    if (res.ok) {
      onUnlocked()
    } else if (res.message) {
      setStatus(res.message)
      setShowCodeBox(true)
    }
  }

  const handleRestore = async () => {
    setBusy(true)
    setStatus('')
    const res = await restoreGrimorioPurchase()
    setBusy(false)
    if (res.ok) {
      onUnlocked()
    } else {
      setStatus(res.message)
    }
  }

  const handleRedeem = async () => {
    if (!code.trim()) return
    setBusy(true)
    const ok = await activateWithFounderCode(code)
    setBusy(false)
    if (ok) {
      onUnlocked()
    } else {
      setStatus('El código introducido no es válido.')
    }
  }

  return (
    <div className="drawer-backdrop paywall-backdrop" onClick={onClose}>
      <aside className="paywall-modal" role="dialog" aria-modal="true" aria-labelledby="paywall-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-button paywall-close" onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
        <div className="paywall-crest"><WolfCrest size={34} /></div>
        <span className="brand-kicker">Expansión Completa · Pago único</span>
        <h3 id="paywall-title">Grimorio Completo PRO</h3>
        <p className="paywall-lead">Desbloquea para siempre los <strong>24 personajes especiales</strong> y lleva tus partidas al siguiente nivel con un único pago, sin suscripciones ni anuncios.</p>
        <ul className="paywall-perks">
          <li><Check size={16} /> <strong>31 personajes en total:</strong> Infecto Padre, Lobo Feroz, Lobo Albino, Flautista, Comediante, Ladrón, Sirvienta, Zorro, Domador, Pirómano, Cuervo y más.</li>
          <li><Check size={16} /> <strong>Expansión Los Edificios de La Aldea:</strong> activa opcionalmente los 10 oficios públicos (Granjeros, Tabernero, Barbero, Noble, Alcalde, Confesor, Boticario, Institutriz, Panadero y Vagabundos).</li>
          <li><Check size={16} /> <strong>100 % sin conexión y sin anuncios:</strong> una sola compra en el móvil del narrador sirve para toda la mesa.</li>
          <li><Check size={16} /> <strong>Para siempre en tu cuenta:</strong> incluye restauración de compra si cambias de teléfono.</li>
        </ul>
        <div className="paywall-actions">
          <button type="button" className="button button-primary button-large" disabled={busy} onClick={handleBuy}>
            <Sparkles size={18} /> Desbloquear por {PRO_PRICE_LABEL}
          </button>
          <div className="paywall-subactions">
            <button type="button" className="text-button dark" disabled={busy} onClick={handleRestore}>Restaurar compra</button>
            <button type="button" className="text-button dark" onClick={() => setShowCodeBox(!showCodeBox)}>
              <KeyRound size={14} /> {showCodeBox ? 'Ocultar código' : 'Tengo un código'}
            </button>
          </div>
        </div>
        {showCodeBox && (
          <div className="paywall-code-box">
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value); setStatus('') }}
              onKeyDown={(e) => e.key === 'Enter' && void handleRedeem()}
              placeholder="Código de desbloqueo"
              aria-label="Código de desbloqueo"
            />
            <button type="button" className="button button-secondary" disabled={!code.trim() || busy} onClick={handleRedeem}>Validar</button>
          </div>
        )}
        {status && <p className="paywall-status" role="status">{status}</p>}
      </aside>
    </div>
  )
}

function GameScreen({ game, setGame, canUndo, onUndo, isPro, onOpenPaywall, onExit, onEnd }: { game: GameState; setGame: (game: GameState) => void; canUndo: boolean; onUndo: () => void; isPro: boolean; onOpenPaywall: () => void; onExit: () => void; onEnd: () => void }) {
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
  const sheriffTiebreakOnly = game.rules?.sheriffTiebreakOnly ?? true

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
      ? alive.filter((player) => !isWolfAlignedPlayer(game, player) && !hasActiveBuilding(game, player, 'innkeeper'))
      : currentRoleId === 'pyromaniac' || currentRoleId === 'raven'
        ? alive.filter((player) => !roleOwners.some((owner) => owner.id === player.id) && !isVagrant(game, player))
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
    if (game.phase === 'buildings-setup') return { icon: <Building2 size={30} />, kicker: 'Antes de empezar · Edificaciones', title: 'Reparte los edificios', text: 'Asigna el edificio público que tiene cada habitante delante de sí. El reparto recomendado ya está colocado; cámbialo si habéis repartido al azar.', spoken: undefined }
    if (game.phase === 'night-intro') return game.openingDay
      ? { icon: <RoleArtwork roleId="angel" className="phase-role-art" />, kicker: 'Antes de empezar', title: 'Busca al Ángel', text: 'Pide al Ángel que abra los ojos y anota quién es antes de que empiece el debate.', spoken: '«Cerrad todos los ojos un instante… Que abra los ojos únicamente el Ángel.»' }
      : { icon: <Moon size={30} />, kicker: `Noche ${game.round}`, title: 'Todos a dormir', text: game.round === 1 ? 'Vamos a colocar los personajes y resolver sus decisiones iniciales.' : 'Llamaré solo a quienes tengan algo que hacer esta noche.', spoken: '«Cae la noche sobre el pueblo. Todo el mundo cierra los ojos y duerme…»' }
    if (game.phase === 'night-result') return { icon: <Sun size={30} />, kicker: `Día ${game.round}`, title: 'Amanece en la aldea', text: game.lastDeaths.length ? `${game.lastDeaths.length === 1 ? 'Una persona ha muerto' : `${game.lastDeaths.length} personas han muerto`} esta noche. Revisa el resumen antes de abrir la votación.` : game.elderSurvivedAttack ? 'No hay víctimas. El Anciano ha resistido el ataque de los lobos.' : 'La noche ha pasado tranquila. Todo el mundo sigue con vida.', spoken: '«Amanece en el pueblo. Todo el mundo puede abrir los ojos…»' }
    if (game.phase === 'day-discussion') return { icon: <Users size={30} />, kicker: game.openingDay ? 'Día previo · Ángel' : `Día ${game.round}`, title: game.openingDay ? 'La partida empieza de día' : 'Empieza el debate', text: game.openingDay ? 'El Ángel hace que la partida empiece con un debate y una votación.' : 'Cuenta lo que ha pasado y deja que la aldea hable.' }
    if (game.phase === 'day-vote') return { icon: <Vote size={30} />, kicker: `Día ${game.round} · Votación`, title: game.judgeSecondVoteActive ? 'Segunda votación' : 'La aldea vota', text: 'Elige a quién expulsa la aldea. Las reglas especiales se aplicarán al confirmar.', spoken: '«A la cuenta de tres, señalad con el dedo a la persona que queréis expulsar: uno, dos y tres…»' }
    if (game.phase === 'sheriff-action') return { icon: <Star size={30} />, kicker: 'Último aliento del Alguacil', title: 'El Alguacil nombra sucesor', text: sheriffTiebreakOnly ? 'Antes de abandonar la partida, el Alguacil elige quién hereda su cargo y su voto de desempate.' : 'Antes de abandonar la partida, el Alguacil elige quién hereda su cargo y su voto doble.' }
    if (game.phase === 'hunter-action') return { icon: <RoleArtwork roleId="hunter" className="phase-role-art" />, kicker: 'Última acción del Cazador', title: 'El Cazador dispara', text: 'Antes de abandonar la partida, el Cazador debe señalar a una persona.' }
    if (game.phase === 'servant-action') return { icon: <RoleArtwork roleId="devoted_servant" className="phase-role-art" />, kicker: 'Antes de revelar la carta', title: 'La Sirvienta decide', text: `${selectedName(game.pendingVoteTargetId)} ha sido elegido. Puede quedarse con su carta antes de que la reveles.` }
    if (game.phase === 'scapegoat-action') return { icon: <RoleArtwork roleId="scapegoat" className="phase-role-art" />, kicker: 'Empate en la votación', title: 'El Cabeza de Turco elige', text: 'Antes de salir, decide quién podrá votar en la próxima ronda.' }
    if (game.phase === 'game-over') return winnerCopy(game.winner)
    return {
      icon: <RoleArtwork roleId={currentRoleId} className="phase-role-art" />,
      kicker: `Noche ${game.round} · Llamada ${game.sequenceIndex + 1} de ${game.nightSequence.length}`,
      title: actingAsActor ? `El Comediante actúa como ${currentRole?.name}` : `Se despierta ${currentRole?.name}`,
      text: actingAsActor ? `Despierta al Comediante en lugar de ${currentRole?.name}. ${currentRole?.narratorPrompt ?? ''} Retira después la carta del centro.` : currentRole?.narratorPrompt ?? '',
      spoken: currentRole?.spokenPrompt,
    }
  }, [game, currentRoleId, actingAsActor, sheriffTiebreakOnly])

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
    <SpokenPrompt text={phase.spoken} />
    {isDiscoveryCall && <div className="discovery-box"><div><Eye size={17} /><strong>Ubica el personaje</strong><small>Marca {expectedOwnerCount === 1 ? 'a quien ha abierto los ojos' : `a las ${expectedOwnerCount} personas que han abierto los ojos`}.</small></div><PlayerPicker players={alive.filter((player) => !player.roleId || player.roleId === currentRoleId)} selected={assignedOwners.map((player) => player.id)} onSelect={toggleOwner} compact /></div>}
    {discoveryComplete && <div className="who-wakes"><Moon size={16} /> {roleOwners.map((player) => player.name).join(' y ') || (currentRoleId === 'werewolf' ? 'Manada identificada' : 'Acción del narrador')}</div>}
    {discoveryComplete && <RoleAction game={game} setGame={setGame} roleId={currentRoleId!} owners={roleOwners} eligibleTargets={eligibleTargets} targets={targets} updateNight={updateNight} updateTargets={updateTargets} toggleTarget={toggleTarget} skipRole={skipRole} selectedName={selectedName} />}
    <div className="game-action"><button className="button button-light button-large" disabled={!canAdvance} onClick={advance}>{currentRole.passive ? 'Todo anotado' : `${currentRole.shortName} vuelve a dormir`} <ArrowRight size={19} /></button></div>
  </> : null

  return <SeatContext.Provider value={seatNumbers}><main className={`game-shell ${isDay ? 'day' : ''}`}><header className="game-header"><button className="icon-button" onClick={onExit} aria-label="Volver al inicio"><ArrowLeft size={20} /></button><div><span className="round-dot" /> {isDay ? 'Día' : 'Noche'} {game.round}</div><div className="header-actions"><button className="icon-button" onClick={onUndo} disabled={!canUndo} aria-label="Deshacer" title="Deshacer el último paso"><Undo2 size={19} /></button><button className="roles-button" onClick={() => setShowRoles(!showRoles)} aria-expanded={showRoles}><Eye size={17} /> {showRoles ? 'Ocultar' : 'Ver roles'}</button></div></header>
    {showRoles && <RoleDrawer game={game} onClose={closeRoles} />}
    <section className="game-content"><div className="turn-heading"><div className="phase-icon">{phase.icon}</div><div><span className="phase-progress">{phase.kicker}</span><h2>{phase.title}</h2><p className="phase-copy">{phase.text}</p></div></div>
      {game.phase !== 'role-call' && phase.spoken && <SpokenPrompt text={phase.spoken} />}
      {game.phase === 'buildings-setup' && <BuildingsSetupPhase game={game} setGame={setGame} />}
      {game.phase === 'role-call' && <>
        <button className="chorus-toggle" onClick={() => setShowChorus(!showChorus)}><Map size={17} /> {showChorus ? 'Ocultar coro' : 'Mostrar coro'}</button>
        <div className="night-workspace"><div className="night-interaction">{roleAction}</div><aside className={`night-map-panel ${showChorus ? 'show' : ''}`}><SeatingCircle players={game.players} sheriffId={game.sheriffId} awakeIds={roleOwners.map((player) => player.id)} targetIds={chorusTargets} wolfVictimId={currentRoleId === 'witch' ? game.night.wolfTargetId : undefined} protectedId={game.night.protectedTargetId} round={game.round} /></aside></div>
      </>}
      {game.phase === 'night-intro' && <><div className="intro-map"><SeatingCircle players={game.players} sheriffId={game.sheriffId} awakeIds={[]} targetIds={[]} round={game.round} /></div><div className="game-action"><button className="button button-light button-large" onClick={() => setGame(game.nightSequence.length ? { ...game, phase: 'role-call', sequenceIndex: 0 } : { ...game, phase: 'night-result' })}>{game.openingDay ? 'Ubicar al Ángel' : 'Empezar las llamadas'} <ArrowRight size={19} /></button></div></>}
      {game.phase === 'night-result' && <><DaySummary game={game} />{!game.pendingHunters.length && <><SheriffElection game={game} setGame={setGame} /><BuildingDayActions game={game} setGame={setGame} /></>}<div className="game-action morning-actions">{game.pendingHunters.length > 0 ? <button className="button button-dark button-large" onClick={() => setGame({ ...game, phase: 'hunter-action' })}><Crosshair size={19} /> El Cazador dispara</button> : game.sheriffSuccessionPending ? <button className="button button-dark button-large" onClick={() => setGame({ ...game, phase: 'sheriff-action' })}><Star size={19} /> El Alguacil nombra sucesor</button> : <><button className="button button-dark button-large" onClick={() => setGame({ ...game, phase: 'day-vote', pendingVoteTargetId: undefined })}>Abrir votación <Vote size={19} /></button><button className="button button-outline" onClick={() => setGame({ ...game, phase: 'day-discussion' })}>Empezar debate</button></>}</div></>}
      {game.phase === 'day-discussion' && <><DebateTimer /><SheriffElection game={game} setGame={setGame} /><BuildingDayActions game={game} setGame={setGame} /><div className="game-action"><button className="button button-dark button-large" onClick={() => setGame({ ...game, phase: 'day-vote', pendingVoteTargetId: undefined })}>Abrir votación <Vote size={19} /></button></div></>}
      {game.phase === 'day-vote' && <><DebateTimer /><BuildingDayActions game={game} setGame={setGame} /><VoteScreen game={game} setGame={setGame} /></>}
      {game.phase === 'hunter-action' && <HunterShot game={game} setGame={setGame} />}
      {game.phase === 'sheriff-action' && <PlayerPicker players={eligibleSheriffCandidates(game)} selected={[]} onSelect={(id) => setGame(resolveSheriffSuccession(game, id))} label={game.buildingsEnabled ? 'Nuevo Alguacil (entre los Granjeros vivos)' : 'Nuevo Alguacil'} />}
      {game.phase === 'servant-action' && <div className="decision-cards"><button onClick={() => setGame(resolveServantChoice(game, true))}><span className="icon-badge"><HeartHandshake size={24} /></span><strong>Adoptar el personaje</strong><small>La Sirvienta conserva la vida con la carta de {selectedName(game.pendingVoteTargetId)}.</small></button><button onClick={() => setGame(resolveServantChoice(game, false))}><span className="icon-badge"><Moon size={24} /></span><strong>No intervenir</strong><small>La persona elegida será eliminada normalmente.</small></button></div>}
      {game.phase === 'scapegoat-action' && <><PlayerPicker players={alive.filter((player) => player.id !== game.pendingVoteTargetId)} selected={game.scapegoatVoters} onSelect={(id) => setGame({ ...game, scapegoatVoters: game.scapegoatVoters.includes(id) ? game.scapegoatVoters.filter((item) => item !== id) : [...game.scapegoatVoters, id] })} label="Podrán votar la próxima vez" /><div className="game-action"><button className="button button-dark button-large" disabled={!game.scapegoatVoters.length} onClick={() => setGame(resolveScapegoat(game, game.scapegoatVoters))}>Confirmar decisión <ArrowRight size={19} /></button></div></>}
      {game.phase === 'game-over' && <>
        {!isPro && (
          <button type="button" className="grimorio-banner gameover-grimorio" onClick={onOpenPaywall}>
            <span className="grimorio-banner-icon" aria-hidden="true"><Sparkles size={20} /></span>
            <div>
              <strong>¿Queréis más roles para la siguiente partida?</strong>
              <small>Desbloquea el Grimorio Completo PRO (24 personajes extra) por un único pago de {PRO_PRICE_LABEL} entre toda la mesa.</small>
            </div>
            <span className="grimorio-cta">Ver PRO</span>
          </button>
        )}
        <div className="game-action"><button className="button button-light button-large" onClick={onEnd}><RotateCcw size={19} /> Volver al inicio</button></div>
      </>}
    </section><footer className="alive-strip"><span><span className="alive-dot" /> {alive.length} con vida</span><span>{game.players.length - alive.length} eliminados</span></footer>
  </main></SeatContext.Provider>
}

function RoleAction({ game, setGame, roleId, eligibleTargets, targets, updateNight, updateTargets, toggleTarget, skipRole, selectedName }: { game: GameState; setGame: (game: GameState) => void; roleId: RoleId; owners: Player[]; eligibleTargets: Player[]; targets: string[]; updateNight: (patch: Partial<GameState['night']>) => void; updateTargets: (roleId: RoleId, targets: string[]) => void; toggleTarget: (roleId: RoleId, id: string, max: number) => void; skipRole: (roleId: RoleId) => void; selectedName: (id?: string) => string | undefined }) {
  const role = ROLES[roleId]
  if (roleId === 'wolf_hound') return <RuleCard title="No hace falta preguntarle"><p>Solo anota quién tiene el Perro Lobo. Cuando despierte la manada, marca si ha abierto los ojos con ellos.</p></RuleCard>
  if (roleId === 'thief') return <ThiefActions game={game} setGame={setGame} />
  if (roleId === 'sectarian') return <SectarianGroups game={game} setGame={setGame} />
  if (roleId === 'actor') return <ActorActions game={game} setGame={setGame} />
  if (roleId === 'werewolf') return <>
    {(game.round === 1 || game.servantRestartRole === 'wolf_hound') && game.players.some((player) => player.roleId === 'wolf_hound' && player.alive) && <ToggleCard active={game.roleChoices.wolf_hound === 'wolves'} icon={<Dog size={22} />} title="El Perro Lobo abrió los ojos con la manada" text="Márcalo solo si lo has observado; no se le pregunta su elección." onClick={() => setGame({ ...game, roleChoices: { ...game.roleChoices, wolf_hound: game.roleChoices.wolf_hound === 'wolves' ? 'village' : 'wolves' } })} />}
    <PlayerPicker players={eligibleTargets} selected={game.night.wolfTargetId ? [game.night.wolfTargetId] : []} onSelect={(id) => updateNight({ wolfTargetId: id })} label="Víctima de la manada" />
    {!game.villagePowersDisabled && game.players.some((player) => player.roleId === 'little_girl' && player.alive) && <ToggleCard active={game.night.littleGirlCaught} icon={<Eye size={22} />} title="La Niña Pequeña ha sido sorprendida" text="Si la descubren espiando, morirá en lugar de la víctima elegida." onClick={() => updateNight({ littleGirlCaught: !game.night.littleGirlCaught })} />}
    {game.buildingsEnabled && game.players.some((player) => player.alive && hasActiveBuilding(game, player, 'baker')) && <RuleCard title="🥖 El Panadero abre los ojos al cerrar los lobos"><p>Justo después de decir «Hombres Lobo, cerrad los ojos», pide al Panadero que abra los ojos un instante para ver si descubre algún movimiento tardío.</p></RuleCard>}
  </>
  if (roleId === 'infect_father') return <ToggleCard active={game.night.infectVictim} disabled={!game.infectionAvailable || !game.night.wolfTargetId} icon={<Skull size={22} />} title="Infectar a la víctima" text={!game.infectionAvailable ? 'El poder ya se utilizó.' : !game.night.wolfTargetId ? 'La manada todavía no ha elegido víctima.' : game.players.find((player) => player.id === game.night.wolfTargetId)?.roleId === 'elder' && game.elderWolfHits === 0 ? `${selectedName(game.night.wolfTargetId)} es el Anciano: la primera mordedura no le infecta y resistirá el ataque. El poder se gastará.` : `${selectedName(game.night.wolfTargetId)} no morirá y se incorporará en secreto a la manada.`} onClick={() => updateNight({ infectVictim: !game.night.infectVictim })} />
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

function BuildingsSetupPhase({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  const updateBuilding = (playerId: string, buildingId: BuildingId) => {
    setGame({
      ...game,
      players: game.players.map((player) => player.id === playerId ? { ...player, buildingId, buildingUsed: false } : player),
    })
  }
  const shuffleBuildings = () => {
    const pool = [...recommendedBuildings(game.players.length)]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    setGame({
      ...game,
      players: game.players.map((player, idx) => ({ ...player, buildingId: pool[idx] ?? 'vagrant', buildingUsed: false })),
    })
  }
  return (
    <div className="buildings-setup">
      <div className="buildings-setup-toolbar">
        <small>Asigna el edificio público que tiene cada persona delante en la mesa.</small>
        <button type="button" className="text-button" onClick={shuffleBuildings}>Repartir al azar</button>
      </div>
      <div className="buildings-setup-list">
        {game.players.map((player, idx) => {
          const bId = player.buildingId ?? 'vagrant'
          const bDef = BUILDINGS[bId]
          return (
            <div className="building-row" key={player.id}>
              <div className="building-player">
                <span className="seat-pill">{idx + 1}</span>
                <div>
                  <strong>{player.name}</strong>
                  <small>{bDef.description}</small>
                </div>
              </div>
              <label className="building-select-wrap">
                <select value={bId} onChange={(e) => updateBuilding(player.id, e.target.value as BuildingId)} aria-label={`Edificio de ${player.name}`}>
                  {BUILDING_LIST.map((b) => (
                    <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                  ))}
                </select>
                <ChevronDown size={15} />
              </label>
            </div>
          )
        })}
      </div>
      <div className="game-action">
        <button type="button" className="button button-light button-large" onClick={() => setGame({ ...game, phase: 'night-intro' })}>
          Confirmar edificios y empezar <ArrowRight size={19} />
        </button>
      </div>
    </div>
  )
}

function BuildingDayActions({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  const [openTool, setOpenTool] = useState<'mayor' | 'barber' | 'confessor' | 'apothecary' | null>(null)
  const [mayorVagrantId, setMayorVagrantId] = useState<string>('')
  const [mayorBuilding, setMayorBuilding] = useState<BuildingId | ''>('')
  const [confessorTargetId, setConfessorTargetId] = useState<string>('')

  if (!game.buildingsEnabled || game.villagePowersDisabled) return null
  const alive = alivePlayers(game)
  const mayor = alive.find((p) => hasActiveBuilding(game, p, 'mayor'))
  const barber = alive.find((p) => hasActiveBuilding(game, p, 'barber'))
  const confessor = alive.find((p) => hasActiveBuilding(game, p, 'confessor'))
  const apothecary = alive.find((p) => hasActiveBuilding(game, p, 'apothecary'))

  const vagrants = alive.filter((p) => isVagrant(game, p))
  const vacantList = game.vacantBuildings ?? []
  const canMayorAct = Boolean(mayor && vacantList.length > 0 && vagrants.length > 0)
  const barberTargets = alive.filter((p) => barber && p.id !== barber.id && !isVagrant(game, p))
  const confessorTargets = alive.filter((p) => confessor && p.id !== confessor.id)
  const spentBuildingPlayers = alive.filter((p) => apothecary && p.id !== apothecary.id && p.buildingId && p.buildingUsed && BUILDINGS[p.buildingId].uniquePower)

  if (!canMayorAct && !barber && !confessor && !(apothecary && spentBuildingPlayers.length > 0)) return null

  return (
    <div className="building-day-panel" aria-label="Oficios y edificios del día">
      <div className="building-day-header">
        <Building2 size={16} aria-hidden="true" />
        <strong>Poderes de Edificaciones (Día)</strong>
      </div>
      <div className="building-day-buttons">
        {canMayorAct && (
          <button type="button" className={`building-chip ${openTool === 'mayor' ? 'active' : ''}`} onClick={() => setOpenTool(openTool === 'mayor' ? null : 'mayor')}>
            🏛️ Alcalde ({vacantList.length} libre{vacantList.length > 1 ? 's' : ''})
          </button>
        )}
        {barber && (
          <button type="button" className={`building-chip ${openTool === 'barber' ? 'active' : ''}`} onClick={() => setOpenTool(openTool === 'barber' ? null : 'barber')}>
            🪒 Barbero ({barber.name})
          </button>
        )}
        {confessor && (
          <button type="button" className={`building-chip ${openTool === 'confessor' ? 'active' : ''}`} onClick={() => setOpenTool(openTool === 'confessor' ? null : 'confessor')}>
            ⛪ Confesor ({confessor.name})
          </button>
        )}
        {apothecary && spentBuildingPlayers.length > 0 && (
          <button type="button" className={`building-chip ${openTool === 'apothecary' ? 'active' : ''}`} onClick={() => setOpenTool(openTool === 'apothecary' ? null : 'apothecary')}>
            ⚗️ Boticario ({apothecary.name})
          </button>
        )}
      </div>

      {openTool === 'mayor' && canMayorAct && (
        <div className="building-tool-drawer">
          <p><strong>🏛️ {mayor?.name} (Alcalde):</strong> entrega un edificio vacante a un Vagabundo con su poder restaurado.</p>
          <ChoiceSelect
            label="Edificio vacante a entregar"
            value={mayorBuilding}
            onChange={(val) => setMayorBuilding(val as BuildingId | '')}
            options={vacantList.map((b, i) => ({ value: `${b}:${i}`, label: `${BUILDINGS[b].icon} ${BUILDINGS[b].name}` }))}
          />
          <PlayerPicker
            players={vagrants}
            selected={mayorVagrantId ? [mayorVagrantId] : []}
            onSelect={setMayorVagrantId}
            label="Vagabundo que recibe el edificio"
            compact
          />
          <button
            type="button"
            className="button button-dark"
            disabled={!mayorBuilding || !mayorVagrantId}
            onClick={() => {
              const bId = mayorBuilding.split(':')[0] as BuildingId
              setGame(applyMayorAssign(game, mayorVagrantId, bId))
              setMayorBuilding('')
              setMayorVagrantId('')
              setOpenTool(null)
            }}
          >
            Entregar edificio
          </button>
        </div>
      )}

      {openTool === 'barber' && barber && (
        <div className="building-tool-drawer">
          <p><strong>🪒 {barber.name} (Barbero):</strong> degüella a una persona con edificio. Si no es un Hombre Lobo, el Barbero también muere.</p>
          <PlayerPicker
            players={barberTargets}
            selected={[]}
            onSelect={(targetId) => {
              setGame(applyBarberCut(game, targetId))
              setOpenTool(null)
            }}
            label="Persona degollada por el Barbero"
            compact
          />
        </div>
      )}

      {openTool === 'confessor' && confessor && (
        <div className="building-tool-drawer">
          <p><strong>⛪ {confessor.name} (Confesor):</strong> elige a una persona para que le muestre su carta en secreto (poder único).</p>
          <PlayerPicker
            players={confessorTargets}
            selected={confessorTargetId ? [confessorTargetId] : []}
            onSelect={setConfessorTargetId}
            label="Persona confesada"
            compact
          />
          {confessorTargetId && <RevealCard game={game} playerId={confessorTargetId} />}
          <button
            type="button"
            className="button button-dark"
            disabled={!confessorTargetId}
            onClick={() => {
              setGame(applyConfessorPower(game))
              setConfessorTargetId('')
              setOpenTool(null)
            }}
          >
            Marcar confesión realizada
          </button>
        </div>
      )}

      {openTool === 'apothecary' && apothecary && (
        <div className="building-tool-drawer">
          <p><strong>⚗️ {apothecary.name} (Boticario):</strong> devuelve el poder único de edificio a quien ya lo haya gastado.</p>
          <PlayerPicker
            players={spentBuildingPlayers}
            selected={[]}
            onSelect={(targetId) => {
              setGame(applyApothecaryRestore(game, targetId))
              setOpenTool(null)
            }}
            label="Propietario que recupera su poder"
            compact
          />
        </div>
      )}
    </div>
  )
}

function SheriffElection({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
  if (!canElectSheriff(game)) return null
  const firstElection = !game.players.some((player) => !player.alive)
  const tiebreakOnly = game.rules?.sheriffTiebreakOnly ?? true
  const ruleCopy = tiebreakOnly ? 'Su voto decidirá en caso de empate.' : 'Su voto contará doble.'
  const candidates = eligibleSheriffCandidates(game)
  return <div className="discovery-box"><div><Star size={17} aria-hidden="true" /><strong>{game.buildingsEnabled ? 'Los Granjeros eligen Alguacil' : 'Elige al Alguacil'}</strong><small>{game.buildingsEnabled ? `Votan solo los Granjeros vivos entre sí. ${ruleCopy}` : firstElection ? `La aldea vota a su Alguacil. ${ruleCopy}` : `La aldea no tiene Alguacil. Votad a uno nuevo; ${ruleCopy.toLocaleLowerCase()}`}</small></div><PlayerPicker players={candidates} selected={[]} onSelect={(id) => setGame(electSheriff(game, id))} compact /></div>
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
  const tiebreakOnly = game.rules?.sheriffTiebreakOnly ?? true
  const headmistress = game.buildingsEnabled ? alive.find((p) => hasActiveBuilding(game, p, 'headmistress')) : undefined
  const noble = game.buildingsEnabled ? alive.find((p) => hasActiveBuilding(game, p, 'noble')) : undefined
  const innkeeper = game.buildingsEnabled ? alive.find((p) => hasActiveBuilding(game, p, 'innkeeper')) : undefined
  const pendingPlayer = game.players.find((p) => p.id === game.pendingVoteTargetId)
  const canNoblePardon = Boolean(noble && pendingPlayer && !isVagrant(game, pendingPlayer))
  const voteTargets = game.buildingsEnabled ? alive.filter((p) => !hasActiveBuilding(game, p, 'innkeeper')) : alive

  const toggleHeadmistressMute = (id: string) => {
    const current = game.headmistressMutedIds ?? []
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-2)
    setGame({ ...game, headmistressMutedIds: next })
  }

  return <>
    {game.scapegoatVoters.length > 0 && <RuleCard title="Derecho a voto limitado"><p>Por decisión del Cabeza de Turco, solo votan: {game.scapegoatVoters.map((id) => game.players.find((player) => player.id === id)?.name).filter(Boolean).join(', ')}.</p></RuleCard>}
    {ravenName && <RuleCard title={`El Cuervo acusa a ${ravenName}`}><p>Empieza la votación con dos votos en contra.</p></RuleCard>}
    <SheriffElection game={game} setGame={setGame} />
    {sheriffName && (tiebreakOnly
      ? <RuleCard title={`${sheriffName} desempata como Alguacil`}><p>Su voto vale normal, pero decide quién sale en caso de empate{scapegoatAlive ? ' si no interviene el Cabeza de Turco' : ''}.</p></RuleCard>
      : <RuleCard title={`El voto de ${sheriffName} cuenta doble`}><p>Es el Alguacil de la aldea.</p></RuleCard>
    )}
    {foolName && <RuleCard title={`${foolName} no vota`}><p>El Tonto de la Aldea ya fue indultado y perdió su derecho a voto.</p></RuleCard>}
    {innkeeper && <RuleCard title={`🍺 ${innkeeper.name} (Tabernero) es inmune`}><p>No se puede votar contra el Tabernero, pero debe votar antes que nadie.</p></RuleCard>}
    {headmistress && (
      <div className="discovery-box">
        <div>
          <strong>📏 {headmistress.name} (Institutriz) no vota</strong>
          <small>Puede prohibir votar hoy hasta a 2 propietarios de edificios (nunca a Vagabundos).</small>
        </div>
        <PlayerPicker
          players={alive.filter((p) => p.id !== headmistress.id && !isVagrant(game, p))}
          selected={game.headmistressMutedIds ?? []}
          onSelect={toggleHeadmistressMute}
          compact
        />
      </div>
    )}
    <PlayerPicker players={voteTargets} selected={game.pendingVoteTargetId ? [game.pendingVoteTargetId] : []} onSelect={(id) => { setCard(''); setGame({ ...game, pendingVoteTargetId: id, noblePardonRequested: false, innkeeperLostImmunity: false }) }} label="Persona elegida por la aldea" />
    <CardReveal game={game} playerId={game.pendingVoteTargetId} value={card} onChange={setCard} />
    {canNoblePardon && (
      <ToggleCard
        active={Boolean(game.noblePardonRequested)}
        icon={<Star size={22} />}
        title={`👑 ${noble?.name} (Noble) indulta a ${pendingPlayer?.name}`}
        text="Poder único: la persona condenada no es eliminada ni revela su carta."
        onClick={() => setGame({ ...game, noblePardonRequested: !game.noblePardonRequested })}
      />
    )}
    {innkeeper && game.pendingVoteTargetId && !game.noblePardonRequested && (
      <ToggleCard
        active={Boolean(game.innkeeperLostImmunity)}
        icon={<Flame size={22} />}
        title={`🍺 ${innkeeper.name} votó contra ${pendingPlayer?.name}`}
        text="Si el Tabernero vota a la persona que resulta eliminada, pierde su taberna y su inmunidad."
        onClick={() => setGame({ ...game, innkeeperLostImmunity: !game.innkeeperLostImmunity })}
      />
    )}
    {!game.villagePowersDisabled && game.judgePowerAvailable && alive.some((player) => player.roleId === 'stuttering_judge') && <ToggleCard active={game.judgeSecondVoteRequested} icon={<Scale size={22} />} title="El Juez ha hecho la señal" text="Después de esta expulsión habrá otra votación, sin debate." onClick={() => setGame({ ...game, judgeSecondVoteRequested: !game.judgeSecondVoteRequested })} />}
    <div className="game-action"><button className="button button-dark button-large" disabled={!game.pendingVoteTargetId || missingCard} onClick={() => game.pendingVoteTargetId && setGame(eliminateByVote(revealCard(game, game.pendingVoteTargetId, (card || undefined) as RoleId | undefined), game.pendingVoteTargetId))}><Skull size={19} /> {game.noblePardonRequested ? 'Confirmar indulto del Noble' : 'Confirmar expulsión'}</button>{scapegoatAlive && <button className="button button-outline" onClick={() => setGame(beginScapegoatTie(game))}>La votación ha empatado</button>}<button className="text-button" onClick={() => setGame(phaseAfterNoVote(game))}>Nadie es expulsado</button></div>
  </>
}

function DaySummary({ game }: { game: GameState }) {
  const bear = game.players.find((player) => player.roleId === 'bear_tamer' && player.alive)
  return <div className="day-summary">
    {game.lastDeaths.length > 0 && <section className="death-summary" aria-label="Víctimas de la noche"><div className="death-summary-head"><span><Skull size={18} /></span><div><strong>Víctimas de la noche</strong><small>Estas personas han muerto esta noche</small></div><b>{game.lastDeaths.length}</b></div><div className="death-grid">{game.lastDeaths.map((id) => { const player = game.players.find((item) => item.id === id); if (!player) return null; return <article className="death-card" key={id}><RoleArtwork roleId={player.roleId} className="death-role-art" /><div><small>Ha muerto</small><strong>{player.name}</strong><p>{player.roleId ? ROLES[player.roleId].name : 'Carta sin revelar'}</p></div></article> })}</div></section>}
    {!game.lastDeaths.length && <div className="no-deaths-card"><span className="icon-badge safe"><Sun size={24} /></span><div><strong>La noche ha pasado tranquila</strong><small>Todo el mundo sigue con vida.</small></div></div>}
    {bear && !game.villagePowersDisabled && <div className={`morning-card ${bearGrowls(game) ? 'danger' : 'safe'}`}><span className={`icon-badge ${bearGrowls(game) ? 'danger' : 'safe'}`}><PawPrint size={22} /></span><div><strong>{bearGrowls(game) ? 'El oso gruñe' : 'El oso está tranquilo'}</strong><small>{bearGrowls(game) ? 'Hay un lobo vivo junto al Domador.' : 'No hay lobos vivos junto al Domador.'}</small></div></div>}
    {game.villagePowersDisabled && <div className="morning-card danger"><span className="icon-badge danger"><TreeDeciduous size={22} /></span><div><strong>La aldea pierde sus poderes</strong><small>El Anciano murió por una causa ajena al ataque de los lobos.</small></div></div>}
    {game.burnedPlayerId && <div className="morning-card"><span className="icon-badge"><Flame size={22} /></span><div><strong>Edificio quemado</strong><small>Quita el edificio de {game.players.find((player) => player.id === game.burnedPlayerId)?.name}. Si sigue vivo, pasa a ser vagabundo.</small></div></div>}
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
  return <div className="witch-actions"><button disabled={!game.healPotionAvailable || !realVictim} className={`potion-card ${game.night.witchSaved ? 'selected' : ''}`} onClick={() => updateNight({ witchSaved: !game.night.witchSaved })}><span className="icon-badge safe"><FlaskConical size={22} /></span><div><strong>Poción de curación</strong><small>{!game.healPotionAvailable ? 'Ya utilizada' : realVictim ? `Salvar a ${selectedName(realVictim)}` : 'Esta noche no hay víctima que curar'}</small></div>{game.night.witchSaved && <Check size={19} />}</button>
    <div className={`poison-box ${!game.poisonPotionAvailable ? 'disabled' : ''}`}><div><span className="icon-badge danger"><Skull size={22} /></span><strong>Poción de veneno</strong><small>{game.poisonPotionAvailable ? 'Eliminar a otra persona' : 'Ya utilizada'}</small></div>{game.poisonPotionAvailable && <PlayerPicker players={alive.filter((player) => player.roleId !== 'witch')} selected={game.night.witchPoisonTargetId ? [game.night.witchPoisonTargetId] : []} onSelect={(id) => updateNight({ witchPoisonTargetId: game.night.witchPoisonTargetId === id ? undefined : id })} compact />}</div>
  </div>
}

function FoxResult({ game, centerId }: { game: GameState; centerId: string }) {
  const trio = foxTrio(game, centerId)
  const hasWolf = trio.some((player) => isWolfAlignedPlayer(game, player))
  return <div className="reveal-card"><span className={`icon-badge ${hasWolf ? 'danger' : 'safe'}`}>{hasWolf ? <WolfCrest size={24} /> : <Wheat size={22} />}</span><div><small>{trio.map((player) => player.name).join(' · ')}</small><strong>{hasWolf ? 'Hay al menos un lobo: conserva el poder' : 'No hay lobos: el Zorro pierde el poder'}</strong></div></div>
}

function RevealCard({ game, playerId }: { game: GameState; playerId: string }) {
  const player = game.players.find((item) => item.id === playerId)
  if (!player?.roleId) return null
  return <div className="reveal-card"><RoleArtwork roleId={player.roleId} className="reveal-role-art" /><div><small>Su carta es</small><strong>{ROLES[player.roleId].name}</strong></div></div>
}

function OptionalTarget({ title, players, selected, disabled, onSelect }: { title: string; players: Player[]; selected?: string; disabled?: boolean; onSelect: (id: string) => void }) {
  if (disabled) return <RuleCard title="Poder ya utilizado"><p>Este personaje no tiene que hacer nada más.</p></RuleCard>
  return <><PlayerPicker players={players} selected={selected ? [selected] : []} onSelect={onSelect} label={title} /><p className="optional-note">Es opcional: puedes seguir sin elegir a nadie.</p></>
}

function ToggleCard({ active, disabled, icon, title, text, onClick }: { active: boolean; disabled?: boolean; icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return <button type="button" disabled={disabled} className={`toggle-card ${active ? 'selected' : ''}`} onClick={onClick}><span className="icon-badge" aria-hidden="true">{icon}</span><div><strong>{title}</strong><small>{text}</small></div>{active && <Check size={19} />}</button>
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
  return <div className="drawer-backdrop" onClick={onClose}><aside className="role-drawer" role="dialog" aria-modal="true" aria-labelledby="role-drawer-title" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><h3 id="role-drawer-title">Cartas y estados</h3><small className="drawer-subtitle">Información secreta del narrador</small></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button></div><div className="drawer-list">{game.players.map((player) => {
    const bLabel = game.buildingsEnabled && player.buildingId ? `${BUILDINGS[player.buildingId].icon} ${BUILDINGS[player.buildingId].name}${player.buildingUsed ? ' (gastado)' : ''}` : ''
    const states = [bLabel, player.id === game.sheriffId ? 'Alguacil' : '', game.infectedIds.includes(player.id) ? 'Infectado' : '', game.charmedIds.includes(player.id) ? 'Hechizado' : '', game.lovers.includes(player.id) ? 'Enamorado' : '', player.id === game.mentorId ? 'Modelo' : ''].filter(Boolean)
    return <div className={`drawer-player ${!player.alive ? 'dead' : ''}`} key={player.id}><RoleArtwork roleId={player.roleId} className="role-icon small" /><div><strong>{player.name}</strong><small>{player.roleId ? ROLES[player.roleId].name : 'Aún sin ubicar'}{states.length ? ` · ${states.join(' · ')}` : ''}</small></div><b>{player.alive ? 'Con vida' : 'Eliminado'}</b></div>
  })}</div><button className="button button-primary" onClick={onClose}><Eye size={17} /> Cerrar</button></aside></div>
}

function RoleArtwork({ roleId, className = '' }: { roleId?: RoleId; className?: string }) {
  const role = roleId ? ROLES[roleId] : undefined
  const cardId = role?.id === 'pure_villager' ? 'villager' : role?.id
  const cardUrl = cardId ? `${import.meta.env.BASE_URL}cards/${cardId}.webp?v=6` : undefined
  const variantClass = role?.id === 'pure_villager' ? 'pure-variant' : ''
  return <span className={`role-artwork ${variantClass} ${className}`.trim()}>{role ? <><span aria-hidden="true" className="role-fallback-glyph">{role.shortName[0]}</span><img src={cardUrl} alt={`Carta de ${role.name}`} onError={(event) => { event.currentTarget.hidden = true }} /></> : <Moon size={16} aria-hidden="true" />}</span>
}

function winnerCopy(winner?: Winner) {
  const copies: Record<Winner, { icon: React.ReactNode; title: string; text: string }> = {
    village: { icon: <ShieldCheck size={34} />, title: 'La aldea está a salvo', text: 'Todos los Hombres Lobo han sido eliminados.' },
    wolves: { icon: <WolfCrest size={36} />, title: 'Los lobos dominan la aldea', text: 'La manada iguala o supera al resto de habitantes.' },
    angel: { icon: <Feather size={34} />, title: 'El Ángel despierta de su pesadilla', text: 'Ha sido eliminado en la primera votación o durante la primera noche.' },
    flutist: { icon: <Music size={34} />, title: 'El Flautista encanta la aldea', text: 'Todas las demás personas vivas están hechizadas.' },
    albino_wolf: { icon: <WolfCrest size={36} />, title: 'El Lobo Albino queda solo', text: 'Es el único superviviente de la aldea.' },
    sectarian: { icon: <Flame size={34} />, title: 'Vence el Abominable Sectario', text: 'Ha eliminado a todo el grupo contrario.' },
    lovers: { icon: <Heart size={34} />, title: 'Los amantes sobreviven juntos', text: 'Son las dos únicas personas con vida.' },
    nobody: { icon: <Skull size={34} />, title: 'Nadie sobrevive', text: 'No queda nadie con vida en la aldea: ningún bando gana.' },
  }
  const copy = copies[winner ?? 'village']
  return { icon: copy.icon, kicker: 'Fin de la partida', title: copy.title, text: copy.text, spoken: undefined }
}

function countRoles(roles: RoleId[]): Partial<Record<RoleId, number>> {
  return roles.reduce<Partial<Record<RoleId, number>>>((counts, roleId) => { counts[roleId] = (counts[roleId] ?? 0) + 1; return counts }, {})
}

export default App
