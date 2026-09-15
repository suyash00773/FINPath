export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  return (isNegative ? '-₹' : '₹') + absAmount.toLocaleString('en-IN');
}

export function formatLakh(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)} K`;
  }
  return formatINR(amount);
}

export function formatPercent(decimal: number): string {
  return `${(decimal * 100).toFixed(1)}%`;
}

export function formatDate(isoString?: string): string {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
