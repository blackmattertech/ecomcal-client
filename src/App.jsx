import { useEffect, useState } from 'react'
import { calculateFees, fetchMeta } from './api'
import ResultsPanel from './components/ResultsPanel'

const INITIAL_FORM = {
  category: '',
  sellingPrice: '',
  costOfMaking: '',
  additionalCost: '',
  returnPercent: '',
  productGstPercent: '18',
  weightKg: '0.5',
  stepLevel: 'standard',
}

export default function App() {
  const [meta, setMeta] = useState(null)
  const [activePortal, setActivePortal] = useState('amazon')
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [metaError, setMetaError] = useState('')
  const [calcError, setCalcError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchMeta()
        if (cancelled) return
        setMeta(data)
        const first = data.portals?.[0]
        if (first) {
          setActivePortal(first.id)
          setForm((f) => ({
            ...f,
            category: first.categories?.[0] || '',
          }))
        }
      } catch (err) {
        if (!cancelled) setMetaError(err.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const activeMeta = meta?.portals?.find((p) => p.id === activePortal)
  const categories = activeMeta?.categories || []

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function resetForm() {
    setForm({
      ...INITIAL_FORM,
      category: categories[0] || '',
      productGstPercent: '18',
      weightKg: '0.5',
      stepLevel: 'standard',
    })
    setResult(null)
    setCalcError('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    setCalcError('')
    setLoading(true)
    try {
      const data = await calculateFees({
        category: form.category,
        sellingPrice: Number(form.sellingPrice),
        costOfMaking: Number(form.costOfMaking) || 0,
        additionalCost: Number(form.additionalCost) || 0,
        returnPercent: Number(form.returnPercent) || 0,
        productGstPercent: Number(form.productGstPercent) || 0,
        weightKg: Number(form.weightKg) || 0.5,
        stepLevel: form.stepLevel,
      })
      setResult(data)
    } catch (err) {
      setResult(null)
      setCalcError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="brand">
        <div className="brand__mark">
          <div className="brand__logo">T</div>
          <span className="brand__name">Tag Fees</span>
        </div>
        <h1 className="brand__title">Fee Calculator</h1>
        <p className="brand__sub">
          See marketplace fees and your in-hand amount before you list.
        </p>
      </header>

      <div className="portal-pills" role="tablist" aria-label="Marketplaces">
        {(meta?.portals || [{ id: 'amazon', name: 'Amazon' }]).map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            className={`pill ${activePortal === p.id ? 'pill--active' : ''}`}
            aria-selected={activePortal === p.id}
            onClick={() => {
              setActivePortal(p.id)
              setForm((f) => ({
                ...f,
                category: p.categories?.[0] || f.category,
              }))
              setResult(null)
            }}
          >
            {p.name}
          </button>
        ))}
        <button type="button" className="pill" disabled title="Coming soon">
          Flipkart
        </button>
        <button type="button" className="pill" disabled title="Coming soon">
          Myntra
        </button>
      </div>

      <section className="card">
        <div className="card__head">
          <h2 className="card__title">Product details</h2>
          <span className="card__hint">Per unit</span>
        </div>

        {metaError && <p className="error">{metaError}. Is the API running?</p>}

        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span className="field__label">Product category</span>
            <select
              required
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Selling price</span>
            <div className="prefix-input">
              <span className="prefix-input__affix">₹</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                required
                placeholder="1499"
                value={form.sellingPrice}
                onChange={(e) => updateField('sellingPrice', e.target.value)}
              />
            </div>
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Cost of making</span>
              <div className="prefix-input">
                <span className="prefix-input__affix">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="400"
                  value={form.costOfMaking}
                  onChange={(e) => updateField('costOfMaking', e.target.value)}
                />
              </div>
            </label>
            <label className="field">
              <span className="field__label">Additional cost</span>
              <div className="prefix-input">
                <span className="prefix-input__affix">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="50"
                  value={form.additionalCost}
                  onChange={(e) => updateField('additionalCost', e.target.value)}
                />
              </div>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Return %</span>
              <div className="suffix-input">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="15"
                  value={form.returnPercent}
                  onChange={(e) => updateField('returnPercent', e.target.value)}
                />
                <span className="suffix-input__affix">%</span>
              </div>
            </label>
            <label className="field">
              <span className="field__label">Product GST %</span>
              <div className="suffix-input">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="28"
                  step="0.01"
                  list="gst-presets"
                  placeholder="18"
                  value={form.productGstPercent}
                  onChange={(e) => updateField('productGstPercent', e.target.value)}
                />
                <span className="suffix-input__affix">%</span>
              </div>
              <datalist id="gst-presets">
                {(meta?.gstPresets || [0, 5, 12, 18, 28]).map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Weight (kg)</span>
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
                value={form.weightKg}
                onChange={(e) => updateField('weightKg', e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">STEP level</span>
              <select
                value={form.stepLevel}
                onChange={(e) => updateField('stepLevel', e.target.value)}
              >
                {(meta?.stepLevels || [
                  { id: 'premium_advanced', label: 'Premium & Advanced' },
                  { id: 'standard', label: 'Standard' },
                  { id: 'basic', label: 'Basic' },
                ]).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {calcError && <p className="error">{calcError}</p>}

          <div className="actions">
            <button className="btn btn--primary" type="submit" disabled={loading || !form.category}>
              {loading ? 'Calculating…' : 'Calculate fees'}
            </button>
            <button className="btn btn--ghost" type="button" onClick={resetForm}>
              Reset
            </button>
          </div>
        </form>
      </section>

      {result?.results?.map((portalResult) => (
        <ResultsPanel key={portalResult.portal.id} data={portalResult} />
      ))}

      {result?.errors?.length > 0 && (
        <div className="card">
          {result.errors.map((err) => (
            <p key={err.portal} className="error" style={{ marginBottom: 8 }}>
              {err.portal}: {err.message}
            </p>
          ))}
        </div>
      )}

      <p className="footer-note">
        Fees use your Amazon rate cards. GST on fees is 18%. Return % doubles shipping
        on that share of a 100-unit set (spread per unit). Product GST remittance and
        ITC on fee GST are included.
        {result?.source === 'local' || result?.source === 'local-fallback'
          ? ' Data: local seed.'
          : result?.source === 'supabase'
            ? ' Data: Supabase.'
            : ''}
      </p>
    </div>
  )
}
