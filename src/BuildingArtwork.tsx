import { useEffect, useRef } from 'react'
import { Moon, X } from 'lucide-react'
import { BUILDINGS } from './buildings'
import { ROLES } from './roles'
import type { BuildingDefinition, BuildingId, MarkerId, RoleDefinition, RoleId } from './types'

export const MARKERS: Record<MarkerId, { name: string; owner: string; description: string }> = {
  fire: { name: 'Marcador de Fuego', owner: 'Pirómano', description: 'Se coloca sobre el edificio que el Pirómano incendia. A la mañana siguiente el edificio se retira del juego.' },
  raven: { name: 'Marcador de Cuervo (nota anónima)', owner: 'Cuervo', description: 'Se coloca sobre el edificio del sospechoso. Ese jugador empieza la siguiente votación con 2 votos en contra.' },
  sheriff: { name: 'Marcador de Alguacil', owner: 'Alguacil', description: 'Lo lleva delante quien ostenta el cargo de Alguacil. Si muere, lo entrega a su sucesor.' },
  guard: { name: 'Ficha del Guardia', owner: 'El Guardia (Luna Nueva)', description: 'El Alguacil nombra a un Guardia en la aldea para tocar el tambor e imponer el silencio matutino para leer los eventos de Luna Nueva.' },
}

/** Marcadores romboidales y fichas de la caja (Fuego, Cuervo, Alguacil y Guardia) con el mismo estilo de grabado */
export function MarkerArtwork({ marker, className = '' }: { marker: MarkerId; className?: string }) {
  return (
    <span className={`role-artwork marker-artwork ${className}`.trim()} role="img" aria-label={MARKERS[marker].name}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="100" height="100" rx="14" fill="#181310" />
        <path d="M50 8L92 50L50 92L8 50Z" fill="#221a15" stroke="#e3c383" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M50 15L85 50L50 85L15 50Z" stroke="#e3c383" strokeOpacity="0.35" strokeWidth="1.1" strokeLinejoin="round" />
        {marker === 'fire' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M50 26C55 36 66 42 66 56C66 66 59 73 50 73C41 73 34 66 34 56C34 48 39 43 42 38C43 45 46 48 49 49C47 41 47 33 50 26Z" fill="#c84b3b" fillOpacity="0.55" stroke="#e3c383" strokeWidth="2.4" />
            <path d="M50 49C53 54 58 57 58 63C58 68 54 71 50 71C46 71 42 68 42 63C42 59 45 57 46 54C47 57 48 58 50 58C49 55 49 52 50 49Z" fill="#e3c383" fillOpacity="0.8" />
            <path d="M28 45L31 48M72 45L69 48M30 60L26 61M70 60L74 61" stroke="#e3c383" strokeWidth="1.8" />
          </g>
        )}
        {marker === 'raven' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M36 34H62L66 38V68H36V34Z" fill="#181310" stroke="#e3c383" strokeWidth="2.2" />
            <path d="M41 44H60M41 51H60M41 58H54" stroke="#e3c383" strokeOpacity="0.55" strokeWidth="1.6" />
            <path d="M30 74L66 30" stroke="#c84b3b" strokeWidth="2.8" />
            <path d="M66 30C72 26 76 28 74 34C70 38 64 40 58 40L66 30Z" fill="#c84b3b" fillOpacity="0.6" stroke="#e3c383" strokeWidth="1.8" />
            <circle cx="50" cy="26" r="2.6" fill="#e3c383" />
            <circle cx="50" cy="74" r="2.6" fill="#e3c383" />
          </g>
        )}
        {marker === 'sheriff' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M40 24H60L56 42H44L40 24Z" fill="#c84b3b" fillOpacity="0.55" stroke="#e3c383" strokeWidth="2" />
            <path d="M50 24V42" stroke="#e3c383" strokeOpacity="0.5" strokeWidth="1.5" />
            <circle cx="50" cy="57" r="15" fill="#181310" stroke="#e3c383" strokeWidth="2.4" />
            <path d="M50 46L53 53.5L61 54L55 59L57 67L50 62.5L43 67L45 59L39 54L47 53.5L50 46Z" fill="#e3c383" fillOpacity="0.85" />
          </g>
        )}
        {marker === 'guard' && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M30 36C30 36 50 30 70 36V56C70 68 50 78 50 78C50 78 30 68 30 56V36Z" fill="#20344d" fillOpacity="0.55" stroke="#e3c383" strokeWidth="2" />
            <ellipse cx="50" cy="48" rx="14" ry="5" fill="#181310" stroke="#e3c383" strokeWidth="1.8" />
            <path d="M36 48V60C36 63 42 66 50 66C58 66 64 63 64 60V48" fill="#181310" stroke="#e3c383" strokeWidth="1.8" />
            <path d="M40 50L45 64M50 53V66M60 50L55 64" stroke="#e3c383" strokeOpacity="0.6" strokeWidth="1.3" />
            <path d="M32 36L68 64M68 36L32 64" stroke="#e3c383" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="32" cy="36" r="2.2" fill="#e3c383" />
            <circle cx="68" cy="36" r="2.2" fill="#e3c383" />
          </g>
        )}
      </svg>
    </span>
  )
}

export function RoleArtwork({ roleId, className = '', onClick }: { roleId?: RoleId; className?: string; onClick?: () => void }) {
  const role = roleId ? ROLES[roleId] : undefined
  // Cada personaje tiene su propia carta; el Aldeano Puro ya no reutiliza la del Aldeano Común
  const cardUrl = role ? `${import.meta.env.BASE_URL}cards/${role.id}.webp?v=7` : undefined
  const variantClass = ''
  return (
    <span
      className={`role-artwork ${variantClass} ${className}`.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {role ? (
        <>
          <span aria-hidden="true" className="role-fallback-glyph">{role.shortName[0]}</span>
          <img src={cardUrl} alt={`Carta de ${role.name}`} onError={(event) => { event.currentTarget.hidden = true }} />
        </>
      ) : (
        <Moon size={16} aria-hidden="true" />
      )}
    </span>
  )
}

export function BuildingArtwork({ buildingId, className = '' }: { buildingId?: BuildingId; className?: string }) {
  const id = buildingId ?? 'vagrant'
  const def = BUILDINGS[id]
  return (
    <span className={`role-artwork building-artwork ${className}`.trim()} role="img" aria-label={`${def.buildingName} (${def.name})`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="100" height="100" rx="14" fill="#181310" />
        <rect x="5.5" y="5.5" width="89" height="89" rx="10" stroke="#e3c383" strokeOpacity="0.28" strokeWidth="1.2" />
        <path d="M12 12H20M12 12V20M88 12H80M88 12V20M12 88H20M12 88V80M88 88H80M88 88V80" stroke="#e3c383" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
        {renderBuildingGlyph(id)}
      </svg>
    </span>
  )
}

function renderBuildingGlyph(id: BuildingId) {
  switch (id) {
    case 'farmer':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Luna creciente y tejado de granja */}
          <path d="M74 17C70.5 18.8 69 23.2 71 27C73 30.8 77.5 32 81 30C76.8 33.2 70.5 32 67.8 27.5C65 23 66.8 17.5 74 17Z" fill="#c84b3b" opacity="0.85" />
          <path d="M18 46L50 22L82 46" stroke="#e3c383" strokeWidth="2.6" />
          <path d="M25 41V66H75V41" stroke="#e3c383" strokeWidth="2.2" />
          <path d="M25 52H75M50 22V41" stroke="#e3c383" strokeOpacity="0.45" strokeWidth="1.5" />
          {/* Emblema de Vaca cornuda y espigas */}
          <path d="M31 53C26 48 25 42 29 39C30 44 33 47 38 48" stroke="#c84b3b" strokeWidth="2.5" />
          <path d="M69 53C74 48 75 42 71 39C70 44 67 47 62 48" stroke="#c84b3b" strokeWidth="2.5" />
          <path d="M37 49H63L59 69C58 74 54.5 77 50 77C45.5 77 42 74 41 69L37 49Z" fill="#181310" stroke="#e3c383" strokeWidth="2.5" />
          <ellipse cx="50" cy="71" rx="8" ry="5" fill="#c84b3b" fillOpacity="0.3" stroke="#e3c383" strokeWidth="1.8" />
          <circle cx="44" cy="58" r="1.8" fill="#e3c383" />
          <circle cx="56" cy="58" r="1.8" fill="#e3c383" />
          <circle cx="47" cy="71" r="1.2" fill="#e3c383" />
          <circle cx="53" cy="71" r="1.2" fill="#e3c383" />
          <path d="M20 82C30 79 40 81 50 81C60 81 70 79 80 82" stroke="#e3c383" strokeWidth="1.8" />
        </g>
      )
    case 'confessor':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Campanario gótico de la Iglesia */}
          <path d="M50 13V23M46 17H54" stroke="#c84b3b" strokeWidth="2.4" />
          <path d="M34 44L50 23L66 44V76H34V44Z" fill="#181310" stroke="#e3c383" strokeWidth="2.4" />
          <circle cx="50" cy="39" r="5.5" fill="#c84b3b" fillOpacity="0.35" stroke="#e3c383" strokeWidth="1.8" />
          <path d="M43 76V59C43 55 46 52 50 52C54 52 57 55 57 59V76" stroke="#e3c383" strokeWidth="2" />
          {/* Rosario colgante en primer plano */}
          <path d="M24 52C24 67 36 78 50 78C64 78 76 67 76 52" stroke="#e3c383" strokeWidth="2" strokeDasharray="2 5" />
          <path d="M50 64V85M44 77H56" stroke="#c84b3b" strokeWidth="3" />
          <circle cx="50" cy="77" r="2.2" fill="#e3c383" />
        </g>
      )
    case 'apothecary':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Tejado de la Choza y vapores alquímicos */}
          <path d="M18 42L50 22L82 42" stroke="#e3c383" strokeWidth="2.3" />
          <path d="M43 29C41 33 45 36 43 40M57 29C55 33 59 36 57 40" stroke="#c84b3b" strokeWidth="2" />
          {/* Maja (pistilo) y Mortero */}
          <path d="M60 32L47 54" stroke="#e3c383" strokeWidth="4.2" />
          <path d="M29 52H71L66 68C64 75 58 79 50 79C42 79 36 75 34 68L29 52Z" fill="#181310" stroke="#e3c383" strokeWidth="2.6" />
          <path d="M26 52H74" stroke="#e3c383" strokeWidth="3" />
          <path d="M38 83H62" stroke="#e3c383" strokeWidth="2.6" />
          {/* Gota carmesí de elixir */}
          <path d="M50 59C50 59 45 65 45 68.5C45 71.3 47.2 73.5 50 73.5C52.8 73.5 55 71.3 55 68.5C55 65 50 59 50 59Z" fill="#c84b3b" stroke="#e3c383" strokeWidth="1.4" />
        </g>
      )
    case 'headmistress':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Espadaña de la Escuela */}
          <path d="M22 40L50 20L78 40" stroke="#e3c383" strokeWidth="2.4" />
          <path d="M45 20V14M55 20V14" stroke="#e3c383" strokeWidth="1.8" />
          {/* Campana de la Institutriz */}
          <path d="M50 25V33" stroke="#e3c383" strokeWidth="2.6" />
          <path d="M36 66C36 50 40 35 50 35C60 35 64 50 64 66L71 72H29L36 66Z" fill="#181310" stroke="#e3c383" strokeWidth="2.6" />
          <path d="M36 60H64" stroke="#c84b3b" strokeWidth="2.4" />
          <circle cx="50" cy="76" r="4.5" fill="#c84b3b" stroke="#e3c383" strokeWidth="1.8" />
          {/* Ondas de sonido */}
          <path d="M23 52C20 56 20 62 23 66M77 52C80 56 80 62 77 66" stroke="#c84b3b" strokeWidth="2.2" />
        </g>
      )
    case 'baker':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Horno de piedra de la Panadería */}
          <path d="M24 54V38C24 25 35 18 50 18C65 18 76 25 76 38V54" stroke="#e3c383" strokeWidth="2.3" />
          <path d="M34 52C34 42 41 35 50 35C59 35 66 42 66 52" fill="#c84b3b" fillOpacity="0.32" stroke="#c84b3b" strokeWidth="2" />
          {/* Hogaza de pan recién horneada con cortes */}
          <path d="M24 68C24 56 35 49 50 49C65 49 76 56 76 68C76 74 70 78 50 78C30 78 24 74 24 68Z" fill="#181310" stroke="#e3c383" strokeWidth="2.6" />
          <path d="M38 55L43 65M48 53L53 64M58 55L63 65" stroke="#c84b3b" strokeWidth="2.4" />
          <path d="M20 83H80" stroke="#e3c383" strokeWidth="2" />
        </g>
      )
    case 'barber':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Fachada de la Barbería */}
          <path d="M24 34L50 17L76 34" stroke="#e3c383" strokeWidth="2.2" />
          {/* Navaja de Barbero abierta con destello carmesí */}
          <path d="M24 66L58 32L66 40L32 74L24 66Z" fill="#181310" stroke="#e3c383" strokeWidth="2.5" />
          <path d="M30 70L61 39" stroke="#c84b3b" strokeWidth="2.2" />
          <path d="M58 32L77 56C80 60 79 66 75 69C71 72 65 70 62 66L50 48" fill="#181310" stroke="#e3c383" strokeWidth="2.5" />
          <circle cx="59" cy="39" r="2.3" fill="#e3c383" />
          <path d="M34 45L37 39L40 45L46 48L40 51L37 57L34 51L28 48L34 45Z" fill="#c84b3b" />
        </g>
      )
    case 'innkeeper':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Entramado de la Taberna */}
          <path d="M20 36L50 17L80 36" stroke="#e3c383" strokeWidth="2.3" />
          {/* Copa / Jarra rebosante de la Taberna */}
          <path d="M33 38H67L63 58C61 65 56 69 50 69C44 69 39 65 37 58L33 38Z" fill="#181310" stroke="#e3c383" strokeWidth="2.6" />
          <path d="M65 42H73C76 42 78 45 78 49C78 54 75 57 71 57H63" stroke="#e3c383" strokeWidth="2.4" />
          <path d="M36 46C43 49 57 49 64 46L61 58C59 63 55 66 50 66C45 66 41 63 39 58L36 46Z" fill="#c84b3b" fillOpacity="0.65" />
          <path d="M50 69V81M37 81H63" stroke="#e3c383" strokeWidth="2.8" />
          <path d="M31 38C31 34 36 32 41 34C44 30 53 30 57 34C62 32 68 34 68 38" stroke="#e3c383" strokeWidth="2.2" />
        </g>
      )
    case 'mayor':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Frontón del Ayuntamiento */}
          <path d="M18 36L50 16L82 36H18Z" fill="#181310" stroke="#e3c383" strokeWidth="2.3" />
          <circle cx="50" cy="28" r="4" fill="#c84b3b" stroke="#e3c383" strokeWidth="1.5" />
          {/* Dos Llaves cruzadas del Alcalde */}
          <circle cx="34" cy="48" r="9" fill="#181310" stroke="#e3c383" strokeWidth="2.5" />
          <circle cx="34" cy="48" r="3.5" fill="#c84b3b" />
          <path d="M41 54L72 80M66 75L61 81M71 79L66 85" stroke="#e3c383" strokeWidth="2.6" />
          <circle cx="66" cy="48" r="9" fill="#181310" stroke="#e3c383" strokeWidth="2.5" />
          <circle cx="66" cy="48" r="3.5" fill="#c84b3b" />
          <path d="M59 54L28 80M34 75L39 81M29 79L34 85" stroke="#e3c383" strokeWidth="2.6" />
        </g>
      )
    case 'noble':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Corona noble sobre el Blasón */}
          <path d="M31 34L36 20L50 29L64 20L69 34H31Z" fill="#c84b3b" fillOpacity="0.45" stroke="#e3c383" strokeWidth="2.4" />
          <circle cx="36" cy="18" r="2" fill="#e3c383" />
          <circle cx="50" cy="16" r="2.4" fill="#e3c383" />
          <circle cx="64" cy="18" r="2" fill="#e3c383" />
          {/* Escudo de Blasón del Palacete */}
          <path d="M29 39H71V56C71 70 61 79 50 84C39 79 29 70 29 56V39Z" fill="#181310" stroke="#e3c383" strokeWidth="2.6" />
          <path d="M50 39V83M29 56H71" stroke="#e3c383" strokeOpacity="0.55" strokeWidth="1.8" />
          <path d="M50 47L55 56L50 65L45 56L50 47Z" fill="#c84b3b" stroke="#e3c383" strokeWidth="1.6" />
        </g>
      )
    case 'vagrant':
    default:
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Luna del camino */}
          <path d="M28 20C24 22 22 27 24 31C26 35 31 37 35 35C30 38 23 36 20 31C17 26 20 20 28 20Z" fill="#e3c383" opacity="0.75" />
          {/* Vara de caminante */}
          <path d="M20 78L78 22" stroke="#e3c383" strokeWidth="3.2" />
          {/* Hatillo atado al bastón */}
          <path d="M58 36L66 28M62 40L70 32" stroke="#e3c383" strokeWidth="2.2" />
          <path d="M56 38C46 44 43 56 49 65C55 74 68 74 75 66C81 58 77 45 66 39L56 38Z" fill="#c84b3b" fillOpacity="0.5" stroke="#e3c383" strokeWidth="2.5" />
          <path d="M54 53L67 60M63 48L58 64" stroke="#e3c383" strokeOpacity="0.65" strokeWidth="1.6" />
        </g>
      )
  }
}

export function BuildingInfoModal({ building, onClose }: { building: BuildingDefinition; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); opener?.focus() }
  }, [onClose])

  const powerBadge = building.powerKind === 'unique'
    ? 'Poder único (1 vez por partida)'
    : building.powerKind === 'permanent'
      ? 'Poder permanente'
      : 'Sin edificio'

  return (
    <div className="drawer-backdrop role-modal-backdrop" onClick={onClose}>
      <aside className="role-modal" role="dialog" aria-modal="true" aria-labelledby="building-modal-title" onClick={(event) => event.stopPropagation()}>
        <button ref={closeRef} type="button" className="icon-button role-modal-close" onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
        <div className="role-modal-card-frame">
          <BuildingArtwork buildingId={building.id} className="role-modal-art" />
        </div>
        <div className="role-modal-body">
          <span className="role-team-pill team-village">{building.buildingName} · {powerBadge}</span>
          <h3 id="building-modal-title">{building.name}</h3>
          <p className="role-modal-description">{building.description}</p>
          <div className="role-modal-meta">
            <div>
              <small>Ficha física</small>
              <p>{building.tokenName} (máx. {building.maxCount} en la caja)</p>
            </div>
            <div>
              <small>Cuándo interviene</small>
              <p>{building.whenToUse}</p>
            </div>
            <div>
              <small>Reglas detalladas del oficio</small>
              <ul className="building-rules-list">
                {building.rules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export function RoleInfoModal({ role, onClose }: { role: RoleDefinition; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); opener?.focus() }
  }, [onClose])

  const teamLabel = role.team === 'wolves'
    ? 'Bando de los Hombres Lobo'
    : role.team === 'village'
      ? 'Bando de la Aldea'
      : 'Bando Solitario / Neutral'

  const teamClass = `team-${role.team}`

  return (
    <div className="drawer-backdrop role-modal-backdrop" onClick={onClose}>
      <aside className="role-modal" role="dialog" aria-modal="true" aria-labelledby="role-modal-title" onClick={(event) => event.stopPropagation()}>
        <button ref={closeRef} type="button" className="icon-button role-modal-close" onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
        <div className="role-modal-card-frame">
          <RoleArtwork roleId={role.id} className="role-modal-art" />
        </div>
        <div className="role-modal-body">
          <span className={`role-team-pill ${teamClass}`}>{teamLabel}</span>
          <h3 id="role-modal-title">{role.name}</h3>
          <p className="role-modal-description">{role.description}</p>

          {role.spokenPrompt && (
            <div className="role-modal-prompt">
              <small>Llamada del narrador</small>
              <p>{role.spokenPrompt}</p>
            </div>
          )}

          {role.marker && MARKERS[role.marker] && (
            <div className="role-modal-marker">
              <MarkerArtwork marker={role.marker} />
              <div>
                <small>Ficha física incluida en la caja</small>
                <strong>{MARKERS[role.marker].name}</strong>
                <p>{MARKERS[role.marker].description}</p>
              </div>
            </div>
          )}

          <div className="role-modal-meta">
            <div>
              <small>Composición y llamada</small>
              <p>
                {role.maxCards === 1 ? '1 carta única en la caja' : `Hasta ${role.maxCards} cartas en la caja`}
                {role.nightOrder !== undefined ? ` · Llamada nocturna #${role.nightOrder}` : ' · No actúa durante la noche'}
                {role.requiresBuildings ? ' · Requiere jugar con Edificaciones' : ''}
              </p>
            </div>
            {role.details && role.details.length > 0 && (
              <div>
                <small>Reglas y funcionamiento detallado</small>
                <ul className="building-rules-list">
                  {role.details.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
