export function formatINR(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatNumber(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(n);
}
