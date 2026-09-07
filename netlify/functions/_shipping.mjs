export const SHIPPING_COUNTRIES = {
  BE: { name: "Belgium", rates: [680, 685, 690, 930] },
  NL: { name: "the Netherlands", rates: [1010, 1090, 1170, 1385] },
  LU: { name: "Luxembourg", rates: [1010, 1090, 1170, 1385] },
  DE: { name: "Germany", rates: [1225, 1330, 1435, 1650] },
  FR: { name: "France", rates: [1490, 1730, 1965, 2445] }
};

export const PACKAGING = {
  apparel: { grams: 300, paddingCm: 0 },
  prints: { grams: 500, paddingCm: 6 },
  paintings: { grams: 1000, paddingCm: 10 },
  sculptures: { grams: 1500, paddingCm: 15 },
  other: { grams: 500, paddingCm: 6 }
};

const WEIGHT_LIMITS = [3000, 6000, 10000, 20000];

function automaticRate(weight, country) {
  const rates = SHIPPING_COUNTRIES[country].rates;
  if (weight <= 20000) return rates[WEIGHT_LIMITS.findIndex(limit => weight <= limit)];
  return Math.ceil(weight / 20000) * rates[3];
}

export function calculateShipping(items, country) {
  if (!SHIPPING_COUNTRIES[country]) throw new Error("Choose a supported delivery country");
  let automaticWeight = 0, packagingWeight = 0, customTotal = 0;

  for (const { product, quantity } of items) {
    const mode = product.shipping_mode || "automatic";
    if (mode === "custom") {
      const rate = Number(product.custom_shipping_prices?.[country]);
      if (!Number.isInteger(rate) || rate < 0) throw new Error(`Shipping is not configured for ${product.title}`);
      customTotal += rate * quantity;
      continue;
    }
    const weight = Number(product.shipping_weight_grams);
    if (!Number.isFinite(weight) || weight <= 0) throw new Error(`Shipping weight is missing for ${product.title}`);
    const packaging = PACKAGING[product.product_type] || PACKAGING.other;
    automaticWeight += weight * quantity;
    packagingWeight = Math.max(packagingWeight, packaging.grams);
  }

  const automaticTotal = automaticWeight ? automaticRate(automaticWeight + packagingWeight, country) : 0;
  return { amount: automaticTotal + customTotal, estimatedWeightGrams: automaticWeight ? automaticWeight + packagingWeight : 0 };
}

export function isStandardParcel(product) {
  const dimensions = [product.shipping_width_cm, product.shipping_height_cm, product.shipping_depth_cm].map(Number);
  if (dimensions.some(value => !Number.isFinite(value) || value <= 0)) return product.product_type === "apparel" || product.product_type === "other";
  const padding = (PACKAGING[product.product_type] || PACKAGING.other).paddingCm;
  const packed = dimensions.map(value => value + padding).sort((a, b) => b - a);
  return packed[0] <= 100 && packed[0] + 2 * (packed[1] + packed[2]) <= 250;
}
