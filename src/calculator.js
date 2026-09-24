import feesData from './data/fees.json'

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function findTier(tiers, price) {
  return tiers.find((t) => price >= t.price_from && price <= t.price_to) || null
}

function calcWeightHandlingFee(bands, weightKg) {
  const w = Number(weightKg)
  if (!Number.isFinite(w) || w <= 0) {
    return { amount: 0, detail: 'Weight not provided' }
  }

  if (w <= 0.5) {
    return { amount: bands.first_500g, detail: 'First 500 g' }
  }
  if (w <= 1) {
    return { amount: bands['500g_1kg'], detail: '500g - 1kg' }
  }
  if (w <= 2) {
    return { amount: bands['1kg_2kg'], detail: '1kg - 2kg' }
  }

  const base2kg = bands['1kg_2kg']
  if (w <= 5) {
    const extraKg = Math.ceil(w - 2)
    const amount = base2kg + extraKg * bands.after_2kg
    return {
      amount,
      detail: `1kg-2kg (${base2kg}) + ${extraKg}kg × ₹${bands.after_2kg}`,
    }
  }

  const kg2to5 = 3
  const kgAfter5 = Math.ceil(w - 5)
  const amount =
    base2kg + kg2to5 * bands.after_2kg + kgAfter5 * bands.after_5kg
  return {
    amount,
    detail: `2kg base + ${kg2to5}×₹${bands.after_2kg} + ${kgAfter5}×₹${bands.after_5kg}`,
  }
}

export function getLocalFeeStore() {
  return feesData
}

export function listPortals(store = feesData) {
  return store.portals.filter((p) => p.is_active)
}

export function listCategories(store, portalId) {
  return store.categories[portalId] || []
}

export function getMeta(store = feesData) {
  return {
    source: 'local',
    portals: listPortals(store).map((p) => ({
      id: p.id,
      name: p.name,
      categories: listCategories(store, p.id),
    })),
    stepLevels: [
      { id: 'premium_advanced', label: 'Premium & Advanced' },
      { id: 'standard', label: 'Standard' },
      { id: 'basic', label: 'Basic' },
    ],
    gstPresets: [0, 5, 12, 18, 28],
  }
}

export function calculatePortalFees(store, input) {
  const {
    portalId = 'amazon',
    category,
    sellingPrice,
    costOfMaking = 0,
    additionalCost = 0,
    returnPercent = 0,
    productGstPercent = 0,
    weightKg = 0.5,
    stepLevel = 'standard',
  } = input

  const portal = store.portals.find((p) => p.id === portalId)
  if (!portal) throw new Error(`Portal not found: ${portalId}`)

  const price = Number(sellingPrice)
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Valid selling price is required')
  }

  const settings = store.portal_settings[portalId] || { fee_gst_percent: 18 }
  const feeGstPercent = Number(settings.fee_gst_percent)

  const referralTiers = store.referral_fees[portalId]?.[category] || null
  if (!referralTiers) {
    throw new Error(`Category not found for ${portal.name}: ${category}`)
  }
  const referralTierMatch = findTier(referralTiers, price)
  if (!referralTierMatch) {
    throw new Error(
      `No referral fee tier for ₹${price} in category "${category}"`
    )
  }
  const referralRate = Number(referralTierMatch.fee_percent)
  const referralAmount = round2((price * referralRate) / 100)

  const closingTiers = store.closing_fees[portalId] || []
  const closingMatch = findTier(closingTiers, price)
  if (!closingMatch) {
    throw new Error(`No closing fee tier for ₹${price}`)
  }
  const closingAmount = round2(Number(closingMatch.fee_inr))

  const weightBands = store.weight_handling_fees[portalId]?.[stepLevel] || null
  if (!weightBands) throw new Error(`Invalid STEP level: ${stepLevel}`)

  const weightResult = calcWeightHandlingFee(weightBands, weightKg)
  const weightAmount = round2(weightResult.amount)

  const BATCH_SIZE = 100
  const returnPct = Number(returnPercent || 0)
  const returnedUnits = round2((BATCH_SIZE * returnPct) / 100)
  const returnShippingPerUnit = round2((weightAmount * returnPct) / 100)
  const returnShippingBatch = round2(weightAmount * returnedUnits)
  const effectiveShippingPerUnit = round2(weightAmount + returnShippingPerUnit)

  const feesBeforeGst = round2(
    referralAmount + closingAmount + weightAmount + returnShippingPerUnit
  )
  const gstOnFees = round2((feesBeforeGst * feeGstPercent) / 100)
  const totalMarketplaceFees = round2(feesBeforeGst + gstOnFees)

  const gst = Number(productGstPercent) || 0
  const taxableValue = gst > 0 ? round2(price / (1 + gst / 100)) : price
  const productGstAmount = round2(price - taxableValue)

  const settlement = round2(price - totalMarketplaceFees)
  const totalCost = round2(
    Number(costOfMaking || 0) + Number(additionalCost || 0)
  )
  const netGstCashOut = round2(productGstAmount - gstOnFees)
  const inHand = round2(settlement - netGstCashOut - totalCost)

  return {
    portal: { id: portal.id, name: portal.name },
    inputs: {
      category,
      sellingPrice: price,
      costOfMaking: Number(costOfMaking || 0),
      additionalCost: Number(additionalCost || 0),
      returnPercent: returnPct,
      productGstPercent: gst,
      weightKg: Number(weightKg),
      stepLevel,
    },
    fees: [
      {
        feeType: 'Referral Fee',
        portal: portal.name,
        rate: `${referralRate}%`,
        amount: referralAmount,
      },
      {
        feeType: 'Closing Fee',
        portal: portal.name,
        rate: `₹${closingAmount}`,
        amount: closingAmount,
      },
      {
        feeType: 'Weight Handling Fee',
        portal: portal.name,
        rate: weightResult.detail,
        amount: weightAmount,
      },
      {
        feeType: 'Return Shipping (extra)',
        portal: portal.name,
        rate: `${returnPct}% of 100 → ${returnedUnits} units × ₹${weightAmount}`,
        amount: returnShippingPerUnit,
      },
      {
        feeType: `GST on Fees (${feeGstPercent}%)`,
        portal: portal.name,
        rate: `${feeGstPercent}%`,
        amount: gstOnFees,
      },
    ],
    summary: {
      batchSize: BATCH_SIZE,
      returnedUnits,
      outboundShippingPerUnit: weightAmount,
      returnShippingPerUnit,
      returnShippingBatch,
      effectiveShippingPerUnit,
      feesBeforeGst,
      gstOnFees,
      totalMarketplaceFees,
      taxableValue,
      productGstAmount,
      settlement,
      totalCost,
      netGstCashOut,
      inHand,
    },
  }
}

export function calculateAllPortals(input, store = feesData) {
  const results = []
  const errors = []

  for (const portal of listPortals(store)) {
    try {
      const cats = listCategories(store, portal.id)
      if (!cats.includes(input.category)) {
        errors.push({
          portal: portal.name,
          message: `Category not available on ${portal.name} yet`,
        })
        continue
      }
      results.push(
        calculatePortalFees(store, { ...input, portalId: portal.id })
      )
    } catch (err) {
      errors.push({ portal: portal.name, message: err.message })
    }
  }

  return { source: 'local', results, errors }
}
