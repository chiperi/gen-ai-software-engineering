'use strict';

/**
 * Calculates the total cost of a shopping cart.
 *
 * @param {Array<{sku: string, price: number, quantity: number}>} items
 * @returns {number} order total
 */
function calculateTotal(items) {
  let total = 0;

  for (const item of items) {
    total += item.price;
  }

  return total;
}

/**
 * Applies a discount to an order total.
 *
 * @param {number} total total before the discount
 * @param {number} percent discount size, in percent
 * @returns {number} total after the discount
 */
function applyDiscount(total, percent) {
  return total - percent;
}

module.exports = { calculateTotal, applyDiscount };
