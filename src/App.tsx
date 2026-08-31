import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookUser, Check, ChevronDown, CircleMinus, CirclePlus,
  Eye, Moon, Play, RotateCcw, ShieldCheck, Skull, Sparkles, Sun, Trash2, Users, Vote,
} from 'lucide-react'
import { advanceRoleCall, alivePlayers, aliveWolves, assignRoleOwners, createGame, eliminateByVote } from './game'
import { CATEGORY_LABELS, isWolfRole, recommendedRoles, ROLE_LIST, ROLES } from './roles'
import { clearGame, loadGame, loadPeople, saveGame, savePeople } from './storage'
import type { GameState, Player, RoleCategory, RoleId, SetupStep } from './types'

type Screen = 'home' | 'library' | 'setup' | 'game'
function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [setupStep, setSetupStep] = useState<SetupStep>('players')
  const [people, setPeople] = useState<string[]>(() => loadPeople())
  const [names, setNames] = useState<string[]>([])
  const [deck, setDeck] = useState<RoleId[]>([])
  const [game, setGame] = useState<GameState | null>(() => loadGame())

  useEffect(() => { savePeople(people) }, [people])
  useEffect(() => { if (game) saveGame(game) }, [game])

  const addPerson = (rawName: string) => {
    const name = rawName.trim()
    if (!name || people.some((person) => person.toLocaleLowerCase() === name.toLocaleLowerCase())) return false
    setPeople([...people, name].sort((a, b) => a.localeCompare(b, 'es')))
    return true
  }

  const resetSetup = () => {
    setNames([])
    setDeck([])
    setSetupStep('players')
    setScreen('setup')
  }

  const goToRoles = () => {
    setDeck(recommendedRoles(names.length))
    setSetupStep('roles')
  }

  const startGame = () => {
    const nextGame = createGame(names, deck)
    setGame(nextGame)
    setScreen('game')
  }

  const endGame = () => { clearGame(); setGame(null); setScreen('home') }

  if (screen === 'library') return <PeopleLibrary people={people} addPerson={addPerson} removePerson={(name) => setPeople(people.filter((person) => person !== name))} onBack={() => setScreen('home')} />
  if (screen === 'setup') {
    if (setupStep === 'players') return <PlayersSetup people={people} names={names} setNames={setNames} addPerson={addPerson} onBack={() => setScreen('home')} onNext={goToRoles} />
    return <DeckSetup playerCount={names.length} deck={deck} setDeck={setDeck} onBack={() => setSetupStep('players')} onNext={startGame} />
  }
  if (screen === 'game' && game) return <GameScreen game={game} setGame={setGame} onExit={() => setScreen('home')} onEnd={endGame} />
  return <Home hasGame={Boolean(game)} onNew={resetSetup} onLibrary={() => setScreen('library')} onContinue={() => setScreen('game')} />
}

function Home({ hasGame, onNew, onLibrary, onContinue }: { hasGame: boolean; onNew: () => void; onLibrary: () => void; onContinue: () => void }) {
  return <main className="home-shell"><div className="forest-glow" /><section className="home-content">
    <div className="brand-mark" aria-hidden="true">🐺</div><p className="eyebrow">Asistente del narrador</p>
    <h1>La aldea duerme.<br /><em>Tú conoces la verdad.</em></h1>
    <p className="hero-copy">Prepara el mazo físico, descubre el reparto durante la primera noche y sigue cada llamada en el orden correcto.</p>
    <div className="home-actions">
      <button className="button button-primary button-large" onClick={onNew}><CirclePlus size={21} /> Nueva partida</button>
      {hasGame && <button className="button button-secondary button-large" onClick={onContinue}><Play size={19} fill="currentColor" /> Continuar partida</button>}
      <button className="button button-secondary button-large" onClick={onLibrary}><BookUser size={19} /> Biblioteca de personas</button>
    </div>
    <div className="feature-row"><span><Moon size={15} /> Orden de El Pacto</span><span><Users size={15} /> 31 personajes</span><span><ShieldCheck size={15} /> Guardado automático</span></div>
  </section></main>
}

function PageHeader({ step, onBack }: { step: string; onBack: () => void }) {
  return <header className="page-header"><button className="icon-button" onClick={onBack} aria-label="Volver"><ArrowLeft size={20} /></button><div className="mini-brand"><span>🐺</span> Lobo</div><span className="step-label">{step}</span></header>
}

function PersonAdder({ addPerson, onAdded }: { addPerson: (name: string) => boolean; onAdded?: (name: string) => void }) {
  const [value, setValue] = useState('')
  const submit = () => { const name = value.trim(); if (addPerson(name)) { setValue(''); onAdded?.(name) } }
  return <div className="person-adder"><input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="Nombre de la persona" /><button className="button button-primary" onClick={submit} disabled={!value.trim()}><CirclePlus size={17} /> Guardar</button></div>
}

function PeopleLibrary({ people, addPerson, removePerson, onBack }: { people: string[]; addPerson: (name: string) => boolean; removePerson: (name: string) => void; onBack: () => void }) {
  return <main className="app-shell"><PageHeader step="Biblioteca" onBack={onBack} /><section className="setup-wrap">
    <div className="section-heading"><p className="eyebrow">Tu grupo habitual</p><h2>Biblioteca de personas</h2><p>Guarda aquí a quienes suelen jugar. Después solo tendrás que seleccionar quién viene a cada partida.</p></div>
    <div className="panel library-panel"><PersonAdder addPerson={addPerson} />
      <div className="library-list">{people.length ? people.map((name) => <div key={name}><span className="avatar">{name[0].toUpperCase()}</span><strong>{name}</strong><button className="remove-button" onClick={() => removePerson(name)} aria-label={`Eliminar a ${name}`}><Trash2 size={17} /></button></div>) : <p className="empty-state">Todavía no has guardado a nadie.</p>}</div>
    </div>
  </section></main>
}

function PlayersSetup({ people, names, setNames, addPerson, onBack, onNext }: { people: string[]; names: string[]; setNames: (names: string[]) => void; addPerson: (name: string) => boolean; onBack: () => void; onNext: () => void }) {
  const toggle = (name: string) => setNames(names.includes(name) ? names.filter((person) => person !== name) : [...names, name])
  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= names.length) return
    const reordered = [...names]
    ;[reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]]
    setNames(reordered)
  }
  return <main className="app-shell"><PageHeader step="Paso 1 de 2" onBack={onBack} /><section className="setup-wrap">
    <div className="section-heading"><p className="eyebrow">Reúne a la aldea</p><h2>¿Quién juega hoy?</h2><p>Selecciona al menos 5 personas de tu biblioteca. El narrador no se incluye.</p></div>
    <div className="panel player-panel"><div className="panel-title"><span>Biblioteca</span><span className="count-pill">{names.length} seleccionadas</span></div>
      <div className="people-grid">{people.map((name) => <button key={name} className={names.includes(name) ? 'selected' : ''} onClick={() => toggle(name)}><span className="avatar">{name[0].toUpperCase()}</span><strong>{name}</strong>{names.includes(name) && <Check size={17} />}</button>)}</div>
      {!people.length && <p className="empty-state">Añade a tu grupo habitual para empezar.</p>}
      {names.length > 0 && <div className="seating-order"><div><strong>Orden en el coro</strong><small>De arriba hacia abajo, en sentido horario.</small></div><ol>{names.map((name, index) => <li key={name}><span>{index + 1}</span><strong>{name}</strong><div><button disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Mover a ${name} hacia arriba`}><ArrowUp size={15} /></button><button disabled={index === names.length - 1} onClick={() => move(index, 1)} aria-label={`Mover a ${name} hacia abajo`}><ArrowDown size={15} /></button></div></li>)}</ol></div>}
      <div className="inline-add"><small>¿Falta alguien? Se guardará también en la biblioteca.</small><PersonAdder addPerson={addPerson} onAdded={(name) => setNames([...names, name])} /></div>
    </div>
    <div className="sticky-action"><span>{names.length < 5 ? `Faltan ${5 - names.length} personas` : `${names.length} personas jugarán`}</span><button className="button button-primary" disabled={names.length < 5} onClick={onNext}>Elegir cartas <ArrowRight size={18} /></button></div>
  </section></main>
}

function DeckSetup({ playerCount, deck, setDeck, onBack, onNext }: { playerCount: number; deck: RoleId[]; setDeck: (deck: RoleId[]) => void; onBack: () => void; onNext: () => void }) {
  const counts = countRoles(deck)
  const categories: RoleCategory[] = ['wolves', 'village', 'ambiguous', 'solitary', 'village-expansion']
  const changeCount = (id: RoleId, delta: number) => {
    const groupedRole = id === 'two_sisters' || id === 'three_brothers'
    if (delta > 0) {
      const amount = groupedRole ? ROLES[id].maxCards - (counts[id] ?? 0) : 1
      setDeck([...deck, ...Array<RoleId>(amount).fill(id)])
    } else if (groupedRole) {
      setDeck(deck.filter((roleId) => roleId !== id))
    } else {
      const index = deck.lastIndexOf(id)
      if (index >= 0) setDeck(deck.filter((_, itemIndex) => itemIndex !== index))
    }
  }
  const completeGroups = !counts.two_sisters || counts.two_sisters === 2
    ? (!counts.three_brothers || counts.three_brothers === 3)
    : false
  const valid = deck.length === playerCount && deck.some(isWolfRole) && completeGroups
  return <main className="app-shell"><PageHeader step="Paso 2 de 2" onBack={onBack} /><section className="setup-wrap roles-wrap">
    <div className="section-heading"><p className="eyebrow">Prepara las cartas</p><h2>Elige el mazo físico</h2><p>Partimos de una recomendación equilibrada. Puedes añadir o quitar cualquier personaje antes de barajar y repartir las cartas en persona.</p></div>
    <div className="deck-summary"><span className="recommend-label"><Sparkles size={14} /> Recomendación editable</span><strong className={deck.length === playerCount ? 'complete' : ''}>{deck.length} / {playerCount} cartas</strong><button className="text-button dark" onClick={() => setDeck(recommendedRoles(playerCount))}>Restaurar recomendación</button></div>
    {categories.map((category) => <section className="role-category" key={category}><h3>{CATEGORY_LABELS[category]}</h3><div className="catalog-grid">
      {ROLE_LIST.filter((item) => item.category === category).map((item) => { const count = counts[item.id] ?? 0; return <article className={`catalog-card ${count ? 'chosen' : ''}`} key={item.id} style={{ '--role-color': item.color } as React.CSSProperties}>
        <span className="role-icon">{item.icon}</span><div><strong>{item.name}</strong><small>{item.description}{item.id === 'two_sisters' ? ' Se añaden siempre las 2 cartas.' : item.id === 'three_brothers' ? ' Se añaden siempre las 3 cartas.' : ''}</small></div><div className="counter"><button disabled={!count} onClick={() => changeCount(item.id, -1)} aria-label={`Quitar ${item.name}`}><CircleMinus size={20} /></button><b>{count}</b><button disabled={count >= item.maxCards || deck.length + (item.id === 'two_sisters' ? 2 - count : item.id === 'three_brothers' ? 3 - count : 1) > playerCount} onClick={() => changeCount(item.id, 1)} aria-label={`Añadir ${item.name}`}><CirclePlus size={20} /></button></div>
      </article> })}
    </div></section>)}
    {!deck.some(isWolfRole) && <p className="form-error">Incluye al menos un Hombre Lobo.</p>}
    {!completeGroups && <p className="form-error">Las Hermanas necesitan 2 cartas y los Hermanos, 3.</p>}
    <div className="sticky-action"><span>{deck.length === playerCount ? 'Baraja y reparte: anotarás quién es quién durante la noche' : `${Math.abs(playerCount - deck.length)} cartas ${deck.length < playerCount ? 'por añadir' : 'de más'}`}</span><button className="button button-primary" disabled={!valid} onClick={onNext}>Empezar primera noche <Moon size={18} /></button></div>
  </section></main>
}

function GameScreen({ game, setGame, onExit, onEnd }: { game: GameState; setGame: (game: GameState) => void; onExit: () => void; onEnd: () => void }) {
  const [showRoles, setShowRoles] = useState(false)
  const alive = alivePlayers(game)
  const isDay = ['night-result', 'day-discussion', 'day-vote'].includes(game.phase)
  const selectedName = (id?: string) => game.players.find((player) => player.id === id)?.name
  const currentRoleId = game.phase === 'role-call' ? game.nightSequence[game.sequenceIndex] : undefined
  const currentRole = currentRoleId ? ROLES[currentRoleId] : undefined
  const assignedOwners = currentRoleId ? alive.filter((player) => player.roleId === currentRoleId) : []
  const roleOwners = currentRoleId === 'werewolf' ? aliveWolves(game) : assignedOwners
  const expectedOwnerCount = currentRoleId ? game.deck.filter((roleId) => roleId === currentRoleId).length : 0
  const isDiscoveryCall = game.round === 1 && expectedOwnerCount > 0
  const discoveryComplete = !isDiscoveryCall || assignedOwners.length === expectedOwnerCount

  const updateNight = (patch: Partial<GameState['night']>) => setGame({ ...game, night: { ...game.night, ...patch } })
  const updateTargets = (roleId: RoleId, targets: string[]) => updateNight({ targets: { ...game.night.targets, [roleId]: targets } })
  const toggleTarget = (roleId: RoleId, id: string, max: number) => {
    const current = game.night.targets[roleId] ?? []
    const next = current.includes(id) ? current.filter((target) => target !== id) : [...current, id].slice(-max)
    updateTargets(roleId, next)
  }
  const toggleOwner = (playerId: string) => {
    if (!currentRoleId) return
    const ownerIds = assignedOwners.map((player) => player.id)
    const nextOwners = ownerIds.includes(playerId)
      ? ownerIds.filter((id) => id !== playerId)
      : ownerIds.length < expectedOwnerCount ? [...ownerIds, playerId] : ownerIds
    setGame(assignRoleOwners(game, currentRoleId, nextOwners))
  }
  const advance = () => {
    let updated = game
    if (currentRoleId === 'witch') updated = { ...game, healPotionAvailable: game.healPotionAvailable && !game.night.witchSaved, poisonPotionAvailable: game.poisonPotionAvailable && !game.night.witchPoisonTargetId }
    setGame(advanceRoleCall(updated))
  }

  const phase = useMemo(() => {
    if (game.phase === 'night-intro') return { icon: <Moon size={32} />, kicker: `Noche ${game.round}`, title: 'La aldea se duerme', text: game.round === 1 ? 'La primera noche incluye decisiones iniciales, ubicaciones para el narrador y después los poderes nocturnos.' : 'Pide a todos que cierren los ojos. La app llamará únicamente a los personajes vivos que deban actuar.' }
    if (game.phase === 'night-result') return { icon: <Sun size={32} />, kicker: `Día ${game.round}`, title: 'La aldea despierta', text: game.lastDeaths.length ? `Esta noche han muerto: ${game.lastDeaths.map(selectedName).join(' y ')}.` : 'Ha amanecido sin víctimas.' }
    if (game.phase === 'day-discussion') return { icon: <Users size={32} />, kicker: `Día ${game.round}`, title: 'Comienza el debate', text: 'Revela las víctimas, comprueba el gruñido del Domador de Osos y deja que la aldea debata.' }
    if (game.phase === 'day-vote') return { icon: <Vote size={32} />, kicker: `Día ${game.round} · Votación`, title: 'La aldea dicta sentencia', text: 'Selecciona a la persona eliminada por mayoría o indica que no hubo expulsión.' }
    if (game.phase === 'game-over') return { icon: <span className="emoji-large">{game.winner === 'village' ? '🏡' : '🐺'}</span>, kicker: 'Fin de la partida', title: game.winner === 'village' ? 'La aldea está a salvo' : 'Los lobos dominan la aldea', text: game.winner === 'village' ? 'Todos los Hombres Lobo han sido eliminados.' : 'Los lobos ya igualan en número al resto de habitantes.' }
    return { icon: <span className="emoji-large">{currentRole?.icon}</span>, kicker: `Noche ${game.round} · ${game.sequenceIndex + 1} de ${game.nightSequence.length}`, title: currentRole?.narratorOnly && !isDiscoveryCall ? `Recordatorio: ${currentRole.name}` : `Se despierta: ${currentRole?.name}`, text: currentRole?.narratorPrompt ?? '' }
  }, [game, currentRoleId])

  const targets = currentRoleId ? game.night.targets[currentRoleId] ?? [] : []
  const callNeeds = currentRole?.callKind
  const skipFirstNightAction = game.round === 1 && currentRoleId === 'albino_wolf'
  const dogChoiceComplete = currentRoleId !== 'wolf_hound' || Boolean(game.roleChoices?.wolf_hound)
  const actionComplete = dogChoiceComplete && (skipFirstNightAction || !currentRole || currentRole.narratorOnly || !callNeeds || callNeeds === 'confirm' || callNeeds === 'narrator-note' || callNeeds === 'witch' || (callNeeds === 'one-target' && targets.length === 1) || (callNeeds === 'two-targets' && targets.length === 2) || (callNeeds === 'three-neighbours' && targets.length === 1) || (callNeeds === 'wolves' && Boolean(game.night.wolfTargetId)))
  const canAdvance = discoveryComplete && actionComplete

  const eligibleTargets = currentRoleId === 'albino_wolf'
    ? aliveWolves(game).filter((player) => player.roleId !== 'albino_wolf')
    : currentRoleId === 'werewolf'
      ? alive.filter((player) => !aliveWolves(game).some((wolf) => wolf.id === player.id))
      : currentRoleId === 'protector' || currentRoleId === 'cupid'
        ? alive
        : alive.filter((player) => !roleOwners.some((owner) => owner.id === player.id))

  const chorusTargets = [
    ...targets,
    ...(currentRoleId === 'werewolf' && game.night.wolfTargetId ? [game.night.wolfTargetId] : []),
    ...(currentRoleId === 'witch' && game.night.witchPoisonTargetId ? [game.night.witchPoisonTargetId] : []),
  ]

  return <main className={`game-shell ${isDay ? 'day' : ''}`}><header className="game-header"><button className="icon-button" onClick={onExit} aria-label="Volver al inicio"><ArrowLeft size={20} /></button><div><span className="round-dot" /> {isDay ? 'Día' : 'Noche'} {game.round}</div><button className="roles-button" onClick={() => setShowRoles(!showRoles)}><Eye size={17} /> {showRoles ? 'Ocultar' : 'Ver roles'}</button></header>
    {showRoles && <RoleDrawer players={game.players} onClose={() => setShowRoles(false)} />}
    <section className="game-content"><div className="phase-icon">{phase.icon}</div><p className="eyebrow">{phase.kicker}</p><h2>{phase.title}</h2><p className="phase-copy">{phase.text}</p>
      {!isDay && game.phase !== 'game-over' && <SeatingCircle players={game.players} awakeIds={roleOwners.map((player) => player.id)} targetIds={chorusTargets} wolfVictimId={currentRoleId === 'witch' ? game.night.wolfTargetId : undefined} protectedId={game.night.protectedTargetId} round={game.round} />}
      {game.phase === 'role-call' && currentRole && <>
        {isDiscoveryCall && <div className="discovery-box"><div><Eye size={17} /><strong>Ubica el personaje</strong><small>Marca {expectedOwnerCount === 1 ? 'a la persona que ha abierto los ojos' : `a las ${expectedOwnerCount} personas que han abierto los ojos`}.</small></div><PlayerPicker players={alive.filter((player) => !player.roleId || player.roleId === currentRoleId)} selected={assignedOwners.map((player) => player.id)} onSelect={toggleOwner} compact /></div>}
        {discoveryComplete && <div className={`who-wakes ${currentRole.narratorOnly && !isDiscoveryCall ? 'narrator' : ''}`}>{currentRole.narratorOnly && !isDiscoveryCall ? <><Eye size={16} /> Solo recordatorio para ti: nadie abre los ojos</> : <><Moon size={16} /> {roleOwners.map((player) => player.name).join(' y ') || 'Grupo de los lobos'}</>}</div>}
        {discoveryComplete && currentRole.id === 'wolf_hound' && <div className="binary-choice"><h3>¿Qué bando elige?</h3><div><button className={game.roleChoices?.wolf_hound === 'village' ? 'selected' : ''} onClick={() => setGame({ ...game, roleChoices: { ...(game.roleChoices ?? {}), wolf_hound: 'village' } })}><span>🌾</span><strong>Aldeano</strong><small>Mantendrá los ojos cerrados durante la manada.</small></button><button className={game.roleChoices?.wolf_hound === 'wolves' ? 'selected' : ''} onClick={() => setGame({ ...game, roleChoices: { ...(game.roleChoices ?? {}), wolf_hound: 'wolves' } })}><span>🐺</span><strong>Hombre Lobo</strong><small>Despertará y atacará con los demás lobos.</small></button></div></div>}
        {discoveryComplete && !skipFirstNightAction && currentRole.callKind === 'wolves' && <PlayerPicker players={eligibleTargets} selected={game.night.wolfTargetId ? [game.night.wolfTargetId] : []} onSelect={(id) => updateNight({ wolfTargetId: id })} label="Víctima de la manada" />}
        {discoveryComplete && !skipFirstNightAction && currentRole.callKind === 'one-target' && <PlayerPicker players={eligibleTargets} selected={targets} onSelect={(id) => currentRole.id === 'protector' ? setGame({ ...game, night: { ...game.night, targets: { ...game.night.targets, protector: [id] }, protectedTargetId: id } }) : toggleTarget(currentRole.id, id, 1)} label={currentRole.id === 'protector' ? 'Persona protegida' : currentRole.id === 'seer' ? 'Persona investigada' : currentRole.id === 'wild_child' ? 'Mentor elegido' : 'Elige una persona'} />}
        {discoveryComplete && !skipFirstNightAction && currentRole.callKind === 'two-targets' && <PlayerPicker players={eligibleTargets} selected={targets} onSelect={(id) => toggleTarget(currentRole.id, id, 2)} label="Elige dos personas" />}
        {discoveryComplete && !skipFirstNightAction && currentRole.callKind === 'three-neighbours' && <PlayerPicker players={alive} selected={targets} onSelect={(id) => toggleTarget(currentRole.id, id, 1)} label="Persona central del grupo de tres" />}
        {discoveryComplete && currentRole.id === 'seer' && targets[0] && game.players.find((player) => player.id === targets[0])?.roleId && <div className="reveal-card"><span>{ROLES[game.players.find((player) => player.id === targets[0])!.roleId!].icon}</span><div><small>Su carta es</small><strong>{ROLES[game.players.find((player) => player.id === targets[0])!.roleId!].name}</strong></div></div>}
        {discoveryComplete && currentRole.id === 'fox' && targets[0] && <FoxResult game={game} centerId={targets[0]} />}
        {discoveryComplete && currentRole.callKind === 'witch' && <WitchActions game={game} updateNight={updateNight} selectedName={selectedName} />}
      </>}
      {game.phase === 'day-vote' && <PlayerPicker players={alive} selected={game.lastDeaths} onSelect={(id) => setGame({ ...game, lastDeaths: [id] })} label="Persona expulsada" />}
      <div className="game-action">
        {game.phase === 'night-intro' && <button className="button button-light button-large" onClick={() => setGame(game.nightSequence.length ? { ...game, phase: 'role-call', sequenceIndex: 0 } : { ...game, phase: 'night-result' })}>Empezar las llamadas <ArrowRight size={19} /></button>}
        {game.phase === 'role-call' && <button className="button button-light button-large" disabled={!canAdvance} onClick={advance}>{currentRole?.narratorOnly ? 'Recordado' : `${currentRole?.shortName} se duerme`} <ArrowRight size={19} /></button>}
        {game.phase === 'night-result' && <button className="button button-dark button-large" onClick={() => setGame({ ...game, phase: 'day-discussion' })}>Comenzar el día <Sun size={19} /></button>}
        {game.phase === 'day-discussion' && <button className="button button-dark button-large" onClick={() => setGame({ ...game, phase: 'day-vote', lastDeaths: [] })}>Abrir votación <Vote size={19} /></button>}
        {game.phase === 'day-vote' && <><button className="button button-dark button-large" disabled={!game.lastDeaths[0]} onClick={() => setGame(eliminateByVote(game, game.lastDeaths[0]))}><Skull size={19} /> Confirmar expulsión</button><button className="text-button" onClick={() => setGame(eliminateByVote(game))}>Nadie es expulsado</button></>}
        {game.phase === 'game-over' && <button className="button button-light button-large" onClick={onEnd}><RotateCcw size={19} /> Volver al inicio</button>}
      </div>
    </section><footer className="alive-strip"><span><span className="alive-dot" /> {alive.length} con vida</span><span>{game.players.length - alive.length} eliminados</span></footer>
  </main>
}

function SeatingCircle({ players, awakeIds, targetIds, wolfVictimId, protectedId, round }: { players: Player[]; awakeIds: string[]; targetIds: string[]; wolfVictimId?: string; protectedId?: string; round: number }) {
  return <div className="chorus-map" aria-label="Ubicación de las personas en el coro"><div className="chorus-center"><Moon size={18} /><strong>Coro</strong><small>Noche {round}</small></div>{players.map((player, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / players.length
    const style = { left: `${50 + Math.cos(angle) * 40}%`, top: `${50 + Math.sin(angle) * 40}%` }
    const classes = ['chorus-seat', awakeIds.includes(player.id) ? 'awake' : '', targetIds.includes(player.id) ? 'targeted' : '', wolfVictimId === player.id ? 'victim' : '', protectedId === player.id ? 'protected' : '', !player.alive ? 'dead' : ''].filter(Boolean).join(' ')
    return <div className={classes} style={style} key={player.id}><span>{player.name[0].toUpperCase()}</span><strong>{player.name}</strong>{player.roleId && <small>{ROLES[player.roleId].icon}</small>}</div>
  })}</div>
}

function WitchActions({ game, updateNight, selectedName }: { game: GameState; updateNight: (patch: Partial<GameState['night']>) => void; selectedName: (id?: string) => string | undefined }) {
  const alive = alivePlayers(game)
  return <div className="witch-actions"><button disabled={!game.healPotionAvailable || !game.night.wolfTargetId} className={`potion-card ${game.night.witchSaved ? 'selected' : ''}`} onClick={() => updateNight({ witchSaved: !game.night.witchSaved })}><span>💚</span><div><strong>Poción de curación</strong><small>{game.healPotionAvailable ? `Salvar a ${selectedName(game.night.wolfTargetId) ?? 'la víctima'}` : 'Ya utilizada'}</small></div>{game.night.witchSaved && <Check size={19} />}</button>
    <div className={`poison-box ${!game.poisonPotionAvailable ? 'disabled' : ''}`}><div><span>☠️</span><strong>Poción de veneno</strong><small>{game.poisonPotionAvailable ? 'Eliminar a otra persona' : 'Ya utilizada'}</small></div>{game.poisonPotionAvailable && <PlayerPicker players={alive.filter((player) => player.roleId !== 'witch')} selected={game.night.witchPoisonTargetId ? [game.night.witchPoisonTargetId] : []} onSelect={(id) => updateNight({ witchPoisonTargetId: game.night.witchPoisonTargetId === id ? undefined : id })} compact />}</div>
  </div>
}

function FoxResult({ game, centerId }: { game: GameState; centerId: string }) {
  const alive = alivePlayers(game); const center = alive.findIndex((player) => player.id === centerId)
  if (center < 0) return null
  const trio = [alive[(center - 1 + alive.length) % alive.length], alive[center], alive[(center + 1) % alive.length]]
  const hasWolf = trio.some((player) => isWolfRole(player.roleId))
  return <div className="reveal-card"><span>{hasWolf ? '🐺' : '🌾'}</span><div><small>{trio.map((player) => player.name).join(' · ')}</small><strong>{hasWolf ? 'Hay al menos un lobo' : 'No hay ningún lobo'}</strong></div></div>
}

function PlayerPicker({ players, selected, onSelect, label, compact = false }: { players: Player[]; selected: string[]; onSelect: (id: string) => void; label?: string; compact?: boolean }) {
  return <div className={`picker ${compact ? 'compact' : ''}`}>{label && <h3>{label}</h3>}<div className="picker-grid">{players.map((player) => <button className={selected.includes(player.id) ? 'selected' : ''} key={player.id} onClick={() => onSelect(player.id)}><span>{player.name[0].toUpperCase()}</span>{player.name}{selected.includes(player.id) && <Check size={16} />}</button>)}</div></div>
}

function RoleDrawer({ players, onClose }: { players: Player[]; onClose: () => void }) {
  return <div className="drawer-backdrop" onClick={onClose}><aside className="role-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><p className="eyebrow">Solo para el narrador</p><h3>Reparto de roles</h3></div><button className="icon-button" onClick={onClose}>×</button></div><div className="drawer-list">{players.map((player) => <div className={`drawer-player ${!player.alive ? 'dead' : ''}`} key={player.id}><span className="role-icon small">{player.roleId ? ROLES[player.roleId].icon : '❔'}</span><div><strong>{player.name}</strong><small>{player.roleId ? ROLES[player.roleId].name : 'Aún sin ubicar'}</small></div><b>{player.alive ? 'Con vida' : 'Eliminado'}</b></div>)}</div><button className="button button-primary" onClick={onClose}><Eye size={17} /> Ocultar reparto</button></aside></div>
}

function countRoles(roles: RoleId[]): Partial<Record<RoleId, number>> {
  return roles.reduce<Partial<Record<RoleId, number>>>((counts, roleId) => { counts[roleId] = (counts[roleId] ?? 0) + 1; return counts }, {})
}

export default App
