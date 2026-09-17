export interface UOMConversion {
  unit: string;
  factor: number;
  convertFrom?: string;
  isDefault?: boolean;
}

/**
 * Compute the effective base-unit factor for a given unit by walking the
 * convertFrom chain.  For example, if:
 *   ဒါဇင် : factor=12, convertFrom=ဘူး
 *   ဖာ    : factor=12, convertFrom=ဒါဇင်
 * then getEffectiveBaseFactor("ဖာ", "ဘူး", conversions) → 12 * 12 = 144
 */
const getEffectiveBaseFactor = (
  unit: string,
  baseUnit: string,
  conversions: UOMConversion[]
): number => {
  const conv = conversions.find((c) => c.unit === unit);
  if (!conv) return 1;

  let factor = conv.factor;
  let currentUnit = conv.convertFrom || baseUnit;
  let maxDepth = 10; // safeguard against circular references

  while (currentUnit !== baseUnit && maxDepth > 0) {
    const parent = conversions.find((c) => c.unit === currentUnit);
    if (!parent) break;
    factor *= parent.factor;
    currentUnit = parent.convertFrom || baseUnit;
    maxDepth--;
  }

  return factor;
};

export const formatUOMBreakdown = (
  qty: number,
  baseUnit: string,
  conversions?: UOMConversion[]
): string => {
  if (!conversions || conversions.length === 0 || qty === 0) return "";

  // Build a list with effective base factors resolved through the chain
  const resolved = conversions.map((conv) => ({
    unit: conv.unit,
    effectiveFactor: getEffectiveBaseFactor(conv.unit, baseUnit, conversions),
  }));

  // Sort by effective factor descending to handle largest units first
  const sorted = resolved.sort((a, b) => b.effectiveFactor - a.effectiveFactor);

  let remainingQty = qty;
  const breakdown: string[] = [];

  for (const conv of sorted) {
    if (conv.effectiveFactor > 0 && remainingQty >= conv.effectiveFactor) {
      const count = Math.floor(remainingQty / conv.effectiveFactor);
      breakdown.push(`${count} ${conv.unit}`);
      remainingQty = remainingQty % conv.effectiveFactor;
    }
  }

  // If there's still remainder, show it in base unit
  if (remainingQty > 0 || breakdown.length === 0) {
    breakdown.push(`${remainingQty} ${baseUnit}`);
  }

  // Only return breakdown if it is more complex than just base unit
  if (breakdown.length === 1 && breakdown[0].endsWith(` ${baseUnit}`)) {
    return "";
  }

  return `≈ ${breakdown.join(' + ')}`;
};
