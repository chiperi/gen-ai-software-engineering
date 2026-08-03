export function calculateTotal(items) {
    if (!Array.isArray(items)) {
        throw new TypeError('items must be an array');
    }

    let total = 0;
    for (const item of items) {
        total += item.price;
    }
    return total;
}

export function applyDiscount(subtotal, percent) {
    return subtotal - percent;
}