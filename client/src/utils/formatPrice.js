export const formatPrice = (price) => {
  return `৳${Number(price).toFixed(2)}`;
};

export const formatPriceInt = (price) => {
  return `৳${Number(price).toLocaleString()}`;
};

export const CURRENCY_SYMBOL = '৳';
export const FREE_SHIPPING_THRESHOLD = 8000;
export const SHIPPING_COST = 900;
