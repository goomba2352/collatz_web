export function parsebigint(value, radix) {
    return [...value.toString()]
        .reduce((r, v) => r * BigInt(radix) + BigInt(parseInt(v, radix)), 0n);
}
globalThis.parsebigint = parsebigint;
//# sourceMappingURL=number_utils.js.map