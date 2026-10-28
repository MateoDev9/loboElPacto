import { describe, expect, it, vi } from 'vitest'
import { createBilling, PLAY_STORE_URL, PRO_PRICE_FALLBACK, type BillingBridge } from './billing'

// Sustituto del SDK de RevenueCat: cada prueba decide qué devuelve Google Play
const withPro = (active: boolean) => ({ customerInfo: { entitlements: { active: active ? { pro: {} } : {} } } })
const lifetime = { product: { priceString: '4,49 €' } }
const fakeBridge = (overrides: Partial<BillingBridge> = {}): BillingBridge => ({
  configure: vi.fn(async () => undefined),
  getCustomerInfo: vi.fn(async () => withPro(false)),
  getOfferings: vi.fn(async () => ({ current: { lifetime } })),
  purchasePackage: vi.fn(async () => withPro(true)),
  restorePurchases: vi.fn(async () => withPro(false)),
  addCustomerInfoUpdateListener: vi.fn(async () => 'listener'),
  ...overrides,
})

describe('pago con Google Play y RevenueCat', () => {
  it('el PRO depende del derecho de uso «pro» que da RevenueCat', async () => {
    expect(await createBilling(fakeBridge(), 'goog_test').getProStatus()).toBe(false)
    const paid = fakeBridge({ getCustomerInfo: vi.fn(async () => withPro(true)) })
    expect(await createBilling(paid, 'goog_test').getProStatus()).toBe(true)
  })

  it('configura el SDK una sola vez con la clave pública', async () => {
    const bridge = fakeBridge()
    const billing = createBilling(bridge, 'goog_test')
    await billing.getProStatus()
    await billing.getProPrice()
    expect(bridge.configure).toHaveBeenCalledTimes(1)
    expect(bridge.configure).toHaveBeenCalledWith({ apiKey: 'goog_test' })
  })

  it('muestra el precio de la tienda y, si falla, el de respaldo', async () => {
    expect(await createBilling(fakeBridge(), 'goog_test').getProPrice()).toBe('4,49 €')
    const offline = fakeBridge({ getOfferings: vi.fn(async () => { throw new Error('sin red') }) })
    expect(await createBilling(offline, 'goog_test').getProPrice()).toBe(PRO_PRICE_FALLBACK)
  })

  it('compra el paquete de pago único y desbloquea el PRO', async () => {
    const bridge = fakeBridge()
    expect(await createBilling(bridge, 'goog_test').purchasePro()).toEqual({ ok: true })
    expect(bridge.purchasePackage).toHaveBeenCalledWith({ aPackage: lifetime })
  })

  it('una compra cancelada por el usuario no es un error', async () => {
    const bridge = fakeBridge({ purchasePackage: vi.fn(async () => { throw { code: '1', userCancelled: true } }) })
    expect(await createBilling(bridge, 'goog_test').purchasePro()).toEqual({ ok: false, cancelled: true })
  })

  it('un fallo de la compra da un mensaje y no desbloquea nada', async () => {
    const bridge = fakeBridge({ purchasePackage: vi.fn(async () => { throw { code: '2' } }) })
    const result = await createBilling(bridge, 'goog_test').purchasePro()
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.message).toBeTruthy()
  })

  it('restaura la compra si la cuenta de Google Play ya la tiene', async () => {
    const owned = fakeBridge({ restorePurchases: vi.fn(async () => withPro(true)) })
    expect(await createBilling(owned, 'goog_test').restorePro()).toEqual({ ok: true })
    expect((await createBilling(fakeBridge(), 'goog_test').restorePro()).ok).toBe(false)
  })

  it('avisa de los cambios del PRO (por ejemplo, un reembolso)', async () => {
    let notify: ((info: ReturnType<typeof withPro>['customerInfo']) => void) | undefined
    const bridge = fakeBridge({ addCustomerInfoUpdateListener: vi.fn(async (listener) => { notify = listener; return 'id' }) })
    const changes: boolean[] = []
    await createBilling(bridge, 'goog_test').onProChange((value) => changes.push(value))
    notify?.(withPro(true).customerInfo)
    notify?.(withPro(false).customerInfo)
    expect(changes).toEqual([true, false])
  })

  it('en la web no hay PRO y la compra lleva a Google Play', async () => {
    const web = createBilling(null)
    expect(web.available).toBe(false)
    expect(await web.getProStatus()).toBe(false)
    expect(await web.getProPrice()).toBe(PRO_PRICE_FALLBACK)
    const result = await web.purchasePro()
    expect(result.ok === false && result.storeUrl).toBe(PLAY_STORE_URL)
  })

  it('sin clave de RevenueCat se comporta como la web y no configura nada', async () => {
    const bridge = fakeBridge()
    const billing = createBilling(bridge)
    expect(billing.available).toBe(false)
    expect(await billing.getProStatus()).toBe(false)
    expect(bridge.configure).not.toHaveBeenCalled()
  })
})
