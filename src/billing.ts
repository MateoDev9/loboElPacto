import { Capacitor } from '@capacitor/core'
import type { RoleId } from './types'

export const PLAY_PRODUCT_ID = 'grimorio_completo_pro'
export const PRO_ENTITLEMENT = 'pro'
// Precio de respaldo hasta que Google Play devuelve el de cada país
export const PRO_PRICE_FALLBACK = '3,99 €'
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mateodev.wolves'

/**
 * Los 7 roles clásicos incluidos gratis para cualquier mesa (coinciden con el mazo recomendado).
 * Los otros 24 personajes forman parte del Grimorio Completo PRO.
 */
export const FREE_ROLES: ReadonlySet<RoleId> = new Set<RoleId>([
  'werewolf',
  'villager',
  'seer',
  'witch',
  'hunter',
  'cupid',
  'protector',
])

export function isProRole(roleId: RoleId): boolean {
  return !FREE_ROLES.has(roleId)
}

// Lo mínimo del SDK de RevenueCat que usa la app; así se puede probar con un sustituto
interface CustomerInfoLike { entitlements: { active: Record<string, unknown> } }
interface PackageLike { product: { priceString: string } }
export interface BillingBridge {
  configure(options: { apiKey: string }): Promise<void>
  getCustomerInfo(): Promise<{ customerInfo: CustomerInfoLike }>
  getOfferings(): Promise<{ current: { lifetime: PackageLike | null } | null }>
  purchasePackage(options: { aPackage: PackageLike }): Promise<{ customerInfo: CustomerInfoLike }>
  restorePurchases(): Promise<{ customerInfo: CustomerInfoLike }>
  addCustomerInfoUpdateListener(listener: (customerInfo: CustomerInfoLike) => void): Promise<unknown>
}

export type BillingResult =
  | { ok: true }
  | { ok: false; cancelled?: boolean; message?: string; storeUrl?: string }

const WEB_MESSAGE = 'El Grimorio Completo se compra desde la app de Android en Google Play.'

const hasPro = (customerInfo: CustomerInfoLike) => PRO_ENTITLEMENT in customerInfo.entitlements.active

// RevenueCat marca la compra cancelada por el usuario con el código "1"
const isCancelled = (error: unknown) => typeof error === 'object' && error !== null
  && ((error as { code?: unknown }).code === '1' || (error as { userCancelled?: unknown }).userCancelled === true)

/**
 * Derechos de uso del Grimorio Completo. Google Play cobra y RevenueCat valida el recibo con Google,
 * confirma la compra y guarda el estado en caché, así que la app nunca decide por sí sola quién ha pagado.
 * Sin puente nativo (la web) el PRO no está disponible y la compra lleva a la ficha de Google Play.
 */
export function createBilling(bridge: BillingBridge | null, apiKey?: string) {
  let ready: Promise<boolean> | undefined
  const init = () => {
    if (!bridge || !apiKey) return Promise.resolve(false)
    ready ??= bridge.configure({ apiKey }).then(() => true, () => false)
    return ready
  }

  return {
    available: Boolean(bridge && apiKey),

    async getProStatus(): Promise<boolean> {
      if (!(await init())) return false
      try {
        return hasPro((await bridge!.getCustomerInfo()).customerInfo)
      } catch {
        return false
      }
    },

    async getProPrice(): Promise<string> {
      if (!(await init())) return PRO_PRICE_FALLBACK
      try {
        return (await bridge!.getOfferings()).current?.lifetime?.product.priceString ?? PRO_PRICE_FALLBACK
      } catch {
        return PRO_PRICE_FALLBACK
      }
    },

    async purchasePro(): Promise<BillingResult> {
      if (!(await init())) return { ok: false, message: WEB_MESSAGE, storeUrl: PLAY_STORE_URL }
      try {
        const lifetime = (await bridge!.getOfferings()).current?.lifetime
        if (!lifetime) return { ok: false, message: 'El Grimorio Completo no está disponible ahora mismo. Inténtalo más tarde.' }
        const { customerInfo } = await bridge!.purchasePackage({ aPackage: lifetime })
        return hasPro(customerInfo)
          ? { ok: true }
          : { ok: false, message: 'La compra no se ha completado. Si te han cobrado, pulsa «Restaurar compra».' }
      } catch (error) {
        if (isCancelled(error)) return { ok: false, cancelled: true }
        return { ok: false, message: 'No se pudo completar la compra. Comprueba la conexión e inténtalo de nuevo.' }
      }
    },

    async restorePro(): Promise<BillingResult> {
      if (!(await init())) return { ok: false, message: WEB_MESSAGE, storeUrl: PLAY_STORE_URL }
      try {
        return hasPro((await bridge!.restorePurchases()).customerInfo)
          ? { ok: true }
          : { ok: false, message: 'No hay ninguna compra del Grimorio Completo en tu cuenta de Google Play.' }
      } catch {
        return { ok: false, message: 'No se pudo consultar tus compras. Comprueba la conexión e inténtalo de nuevo.' }
      }
    },

    async onProChange(listener: (isPro: boolean) => void): Promise<void> {
      if (!(await init())) return
      try {
        await bridge!.addCustomerInfoUpdateListener((customerInfo) => listener(hasPro(customerInfo)))
      } catch {
        // Sin avisos de cambios: el estado se vuelve a leer al abrir la app
      }
    },
  }
}

export type Billing = ReturnType<typeof createBilling>

let billing: Promise<Billing> | undefined

export function getBilling(): Promise<Billing> {
  billing ??= (async () => {
    // El sello de la versión anterior se podía falsificar desde la consola: ya no da acceso
    try { localStorage.removeItem('wolves-grimorio-seal-v1') } catch { /* Sin almacenamiento */ }
    if (!Capacitor.isNativePlatform()) return createBilling(null)
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    return createBilling(Purchases as unknown as BillingBridge, import.meta.env.VITE_REVENUECAT_ANDROID_KEY)
  })()
  return billing
}
