export function calculateTotal(items) {
    if (!Array.isArray(items)) {
        throw new TypeError('items must be an array');
    }

    let total = 0;
    for (const item of items) {
        total += item.price * item.quantity;
    }
    return total;
}

export function applyDiscount(subtotal, percent) {
    if (typeof percent !== 'number' || Number.isNaN(percent) || percent < 0 || percent > 100) {
        throw new RangeError('percent must be between 0 and 100');
    }
    return subtotal * (1 - percent / 100);
}