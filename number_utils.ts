export function parsebigint(value : string, radix : number) {
  return [...value.toString()]
      .reduce((r, v) => r * BigInt(radix) + BigInt(parseInt(v, radix)), 0n);
}

globalThis.parsebigint = parsebigint;