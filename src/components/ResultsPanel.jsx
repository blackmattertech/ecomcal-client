import { formatINR } from '../utils/format'

export default function ResultsPanel({ data }) {
  const { portal, fees, summary } = data
  const inHandPositive = summary.inHand >= 0

  return (
    <section className="results" aria-live="polite">
      <div className="inhand">
        <div className="inhand__portal">{portal.name}</div>
        <p className="inhand__label">Estimated in-hand / unit</p>
        <p
          className="inhand__value"
          style={{ color: inHandPositive ? undefined : '#fca5a5' }}
        >
          {formatINR(summary.inHand)}
        </p>
        <div className="inhand__meta">
          <span>Fees {formatINR(summary.totalMarketplaceFees)}</span>
          <span>Settlement {formatINR(summary.settlement)}</span>
          <span>Cost {formatINR(summary.totalCost)}</span>
        </div>
      </div>

      <div className="fee-list">
        <div className="fee-list__head">
          <span>Fee type</span>
          <span>Rate</span>
          <span style={{ textAlign: 'right' }}>Amount</span>
        </div>
        {fees.map((row) => (
          <div className="fee-row" key={row.feeType}>
            <div>
              <div className="fee-row__type">{row.feeType}</div>
              <span className="fee-row__portal">{row.portal}</span>
            </div>
            <div className="fee-row__rate">{row.rate}</div>
            <div className="fee-row__amount">{formatINR(row.amount)}</div>
          </div>
        ))}
      </div>

      <div className="summary">
        <div className="summary__row">
          <span>
            Return shipping (batch of {summary.batchSize})
          </span>
          <span>
            {summary.returnedUnits} units → {formatINR(summary.returnShippingBatch)}
          </span>
        </div>
        <div className="summary__row">
          <span>Return shipping / unit (avg)</span>
          <span>{formatINR(summary.returnShippingPerUnit)}</span>
        </div>
        <div className="summary__row">
          <span>Effective shipping / unit</span>
          <span>{formatINR(summary.effectiveShippingPerUnit)}</span>
        </div>
        <div className="summary__row">
          <span>Total marketplace fees</span>
          <span>{formatINR(summary.totalMarketplaceFees)}</span>
        </div>
        <div className="summary__row">
          <span>Taxable value (ex-GST)</span>
          <span>{formatINR(summary.taxableValue)}</span>
        </div>
        <div className="summary__row">
          <span>Product GST</span>
          <span>{formatINR(summary.productGstAmount)}</span>
        </div>
        <div className="summary__row">
          <span>Net GST cash-out</span>
          <span>{formatINR(summary.netGstCashOut)}</span>
        </div>
        <div className="summary__row summary__row--strong">
          <span>In-hand value</span>
          <span>{formatINR(summary.inHand)}</span>
        </div>
      </div>
    </section>
  )
}
