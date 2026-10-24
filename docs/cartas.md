# Imágenes de las cartas

Las imágenes WebP de los personajes están integradas mediante el identificador
interno del rol. La aplicación las carga automáticamente y, si una imagen no
existe, mantiene el icono del personaje como alternativa sin romper la interfaz.

Ejemplos:

- `werewolf.webp`
- `seer.webp`
- `witch.webp`
- `hunter.webp`
- `protector.webp`
- `little_girl.webp`
- `cupid.webp`
- `villager.webp`

La lista completa de identificadores se encuentra en `src/roles.ts`. El rol
`pure_villager` reutiliza `villager.webp` con un filtro más claro aplicado por la
interfaz para diferenciar al Aldeano-Aldeano.

Antes de distribuir imágenes comerciales, confirma que su licencia o el permiso
del titular permite utilizarlas en esta web. Que el proyecto sea fan o gratuito no
implica automáticamente que las ilustraciones estén libres de derechos.
