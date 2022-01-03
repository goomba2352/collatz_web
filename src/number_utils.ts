var master: string = "0123456789abcdefghijklmnopqrstuvwxyz";
export function parsebigint(value : string, radix : number) {
  value = value.toLowerCase();
  if (radix < 2 || radix > master.length) {
    throw new RangeError("radix out of range, valid range: [2, " + master.length + "]");
  }
  for (var i = 0; i < value.length; i++) {
    var c: string = value[i];
    var pos: number = master.indexOf(c);
    if (pos == -1) {
      throw new TypeError(
        "Character [" +
          c +
          "] cannot be parsed. Valid characters for radix=" +
          radix +
          ": [" +
          master.substring(0, radix).split("").join(",") +
          "]"
      );
    } else if (pos >= radix) {
      throw new RangeError(
        "Character [" +
          c +
          "] cannot be parsed, as it is out of range. Valid characters for radix=" +
          radix +
          ": [" +
          master.substring(0, radix).split("").join(",") +
          "]"
      );
    }
  }
  return [...value.toString()].reduce((r, v) => r * BigInt(radix) + BigInt(parseInt(v, radix)), 0n);
}

globalThis.parsebigint = parsebigint;