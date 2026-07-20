export function formatPriceNPR(price: number): string {
  if (price >= 10000000) return `NPR ${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `NPR ${(price / 100000).toFixed(1)} Lakh`;
  return `NPR ${price.toLocaleString()}`;
}