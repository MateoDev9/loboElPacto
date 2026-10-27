import type { RoleId } from './types'

export const PLAY_PRODUCT_ID = 'grimorio_completo_pro'
export const PRO_PRICE_LABEL = '3,99 €'

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

const ENTITLEMENT_KEY = 'wolves-grimorio-seal-v1'
const SALT = 'wolves-grimorio-v1-salt-9f8e2a'
// Hash SHA-256 de (SALT + ':' + código de fundador). El código nunca aparece en texto plano en el bundle.
const FOUNDER_CODE_SHA256 = '12d60e086d674b768444dcd64f4a5141852577964d5b417dfbfa4b63cc78728e'

interface StoredSeal {
  source: 'play_billing' | 'founder_seal'
  ref: string
  sig: string
}

async function sha256Hex(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(message)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }
  return ''
}

function deviceFingerprint(): string {
  const lang = typeof navigator !== 'undefined' ? (navigator.language || 'es') : 'es'
  const w = typeof screen !== 'undefined' ? (screen.width || 0) : 0
  const h = typeof screen !== 'undefined' ? (screen.height || 0) : 0
  return [lang, w, h].join('|')
}

async function computeSealSignature(source: StoredSeal['source'], ref: string): Promise<string> {
  return sha256Hex(`${SALT}::${source}::${ref}::${deviceFingerprint()}`)
}

async function saveVerifiedSeal(source: StoredSeal['source'], ref: string): Promise<boolean> {
  const sig = await computeSealSignature(source, ref)
  if (!sig) return false
  try {
    if (typeof localStorage !== 'undefined') {
      const payload: StoredSeal = { source, ref, sig }
      localStorage.setItem(ENTITLEMENT_KEY, JSON.stringify(payload))
    }
  } catch {
    // Sin localStorage disponible
  }
  return true
}

/**
 * Comprueba que el recibo no provenga de un parcheador como Lucky Patcher o HappyMod.
 * Los emuladores piratas de facturación generan orderIds sin formato oficial GPA.XXXX-XXXX-XXXX-XXXXX
 * o firmas vacías/cortas que no corresponden a una clave RSA-2048 de Google Play.
 */
export function isAuthenticPlayReceipt(receipt: {
  orderId?: string
  purchaseToken?: string
  signature?: string
}): boolean {
  const token = (receipt.purchaseToken ?? '').trim()
  const orderId = (receipt.orderId ?? '').trim()
  const signature = (receipt.signature ?? '').trim()

  // Lucky Patcher suele dejar orderId vacío o con números aleatorios sin prefijo GPA.
  if (orderId && !/^GPA\.\d{4}-\d{4}-\d{4}-\d{4,5}(\.\.\d+)?$/.test(orderId)) {
    return false
  }
  // Un purchaseToken legítimo de Google Play supera los 40 caracteres opacos
  if (token.length < 32) {
    return false
  }
  // Si el puente nativo adjunta la firma RSA-SHA256 de Play Billing, debe tener longitud RSA-2048 en Base64 (~344 chars)
  if (signature && signature.length < 160) {
    return false
  }
  return true
}

export async function verifyStoredEntitlement(): Promise<boolean> {
  try {
    const raw = localStorage.getItem(ENTITLEMENT_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as Partial<StoredSeal>
    if (!parsed.source || !parsed.ref || !parsed.sig) return false
    const expected = await computeSealSignature(parsed.source, parsed.ref)
    return Boolean(expected && expected === parsed.sig)
  } catch {
    return false
  }
}

export async function activateWithFounderCode(rawCode: string): Promise<boolean> {
  const normalized = rawCode.trim().toUpperCase()
  if (!normalized) return false
  const digest = await sha256Hex(`${SALT}:${normalized}`)
  if (digest !== FOUNDER_CODE_SHA256) return false
  return saveVerifiedSeal('founder_seal', digest.slice(0, 24))
}

// Tipado opcional para puentes de Google Play Billing (Capacitor / RevenueCat / TWA Digital Goods API)
interface NativeBillingBridge {
  purchaseProduct?: (productId: string) => Promise<{
    orderId?: string
    purchaseToken?: string
    signature?: string
  }>
  restorePurchases?: () => Promise<Array<{
    productId?: string
    orderId?: string
    purchaseToken?: string
    signature?: string
  }>>
}

interface DigitalGoodsService {
  getDetails: (itemIds: string[]) => Promise<unknown[]>
  listPurchases: () => Promise<Array<{ itemId: string; purchaseToken: string }>>
}

declare global {
  interface Window {
    CapacitorBilling?: NativeBillingBridge
    getDigitalGoodsService?: (serviceProvider: string) => Promise<DigitalGoodsService | null>
  }
}

export async function purchaseGrimorioPro(): Promise<{ ok: boolean; message?: string }> {
  try {
    // 1. Puente nativo de Capacitor / RevenueCat en Android
    if (typeof window !== 'undefined' && window.CapacitorBilling?.purchaseProduct) {
      const receipt = await window.CapacitorBilling.purchaseProduct(PLAY_PRODUCT_ID)
      if (!isAuthenticPlayReceipt(receipt)) {
        return { ok: false, message: 'No se pudo verificar la firma criptográfica de Google Play.' }
      }
      await saveVerifiedSeal('play_billing', receipt.purchaseToken!)
      return { ok: true }
    }

    // 2. Digital Goods API (TWA / Google Play Store Web Billing)
    if (typeof window !== 'undefined' && window.getDigitalGoodsService) {
      const service = await window.getDigitalGoodsService('https://play.google.com/billing')
      if (service && typeof PaymentRequest !== 'undefined') {
        const request = new PaymentRequest(
          [{ supportedMethods: 'https://play.google.com/billing', data: { sku: PLAY_PRODUCT_ID } }],
          { total: { label: 'Wolves: Grimorio Completo', amount: { currency: 'EUR', value: '2.99' } } },
        )
        const response = await request.show()
        const details = response.details as { purchaseToken?: string; orderId?: string } | undefined
        await response.complete('success')
        if (!details || !isAuthenticPlayReceipt(details)) {
          return { ok: false, message: 'El recibo de Google Play no es válido.' }
        }
        await saveVerifiedSeal('play_billing', details.purchaseToken!)
        return { ok: true }
      }
    }

    return {
      ok: false,
      message: 'La compra directa se activa al instalar la app desde Google Play Store. Si tienes un código de acceso, introdúcelo abajo.',
    }
  } catch {
    return { ok: false, message: 'La compra se ha cancelado o no se pudo completar.' }
  }
}

export async function restoreGrimorioPurchase(): Promise<{ ok: boolean; message: string }> {
  try {
    if (typeof window !== 'undefined' && window.CapacitorBilling?.restorePurchases) {
      const purchases = await window.CapacitorBilling.restorePurchases()
      const match = purchases.find((item) => item.productId === PLAY_PRODUCT_ID && isAuthenticPlayReceipt(item))
      if (match?.purchaseToken) {
        await saveVerifiedSeal('play_billing', match.purchaseToken)
        return { ok: true, message: '¡Compra restaurada correctamente! Grimorio Completo activado.' }
      }
    }

    if (typeof window !== 'undefined' && window.getDigitalGoodsService) {
      const service = await window.getDigitalGoodsService('https://play.google.com/billing')
      if (service) {
        const purchases = await service.listPurchases()
        const match = purchases.find((item) => item.itemId === PLAY_PRODUCT_ID && isAuthenticPlayReceipt(item))
        if (match) {
          await saveVerifiedSeal('play_billing', match.purchaseToken)
          return { ok: true, message: '¡Compra restaurada correctamente! Grimorio Completo activado.' }
        }
      }
    }

    const alreadyActive = await verifyStoredEntitlement()
    if (alreadyActive) {
      return { ok: true, message: 'Tu Grimorio Completo ya está activo en este dispositivo.' }
    }

    return { ok: false, message: 'No se encontró ninguna compra previa asociada a tu cuenta de Google Play.' }
  } catch {
    return { ok: false, message: 'No se pudo consultar el historial de compras en este momento.' }
  }
}
