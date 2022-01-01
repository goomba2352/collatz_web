# What on earth is this?

This is an animated view of the collatz conjecture, with support for very large numbers (e.g. >10^10000) (backed by javascript bigints). This is a web app, and should be compatible with modern browsers.

I was inspired by the fact the collatz conjecture has interesting patterns when represented as different bases (see [1][2] below). I wanted to see what these patterns looked like with really large numbers in different bases.

**Research**
- [1] https://math.stackexchange.com/questions/1225170/binary-representation-of-the-collatz-conjecture
- [2] https://demonstrations.wolfram.com/CollatzProblemAsACellularAutomaton/

## Views
Two views are currently available. Numbers are not rendered as numbers, but rather colored squares. A mapping of colors may be found in `settings.ts`.

### Spiral View (default)
Views the current number as a spiral, e.g. the number "1234567890" is printed as

```
.....
.765.
.814.
.923.
.0...
.....
```

- Values which don't fit the screen are chopped off. 
- This view has an interesting effect in base 2, where n/2 simply removes zeros at the end, and 3n+1 causes noise+rotation effects.

### History View
This view is similar to a 1d cellular automata, where each step of the collatz sequence is printed line-by-line. E.g.

```
5
16
8
4
2
1
4
2
1
```

# Controls
You can simply press "More" to see all settings, or use keyboard controls:

Current supported controls:
- [R]: Reverse the number string in all views
- [Space]: Pause animation
- [Z/X]: Change size of block (in pixels)
- [A/S]: Change base (bases 2-16 currently supported).
- [,/.]: Cycle through render modes (currently supports: history view, spiral view)

# Usage
You can visit the preview below:

https://htmlpreview.github.io/?https://github.com/goomba2352/collatz_web/blob/master/web/index.html

## Starting seeds
Starting seeds are simply javascript expressions which evaluate to a bigint. A `parsebigint(number_string : string, base : number)` convenience function has been provided with support up to base 36. Valid supported characters are [0-9] and [a-z] (lowercase)!

e.g. `parsebigint('10', 2) = bigint(2)` or `parsebigint('11', 3) = bigint(4)`
### Interesting seeds
- Base 2
  - `parsebigint("1".repeat(300),2);`
  - `parsebigint('11100001'.repeat(2000), 2);`
  

# Dev guide
- Source is at `src/*.ts` and `web/{index.html, main.css}`
- You can use `cd src` and then `npm install` to get dependencies
- `tools/build`.bat is the script used to compile ts to browser-compatible js.
  - `*.js` is compiled from `*.ts` with `tsc`
  - Browserify links node modules and js together into a browser compatible `app_web.js`
  - Run from main directory, i.e., invoke with `./tools/build.bat`
- run.bat simply starts a local http-server (https://www.npmjs.com/package/http-server). You can also just preview
  - Run from main directory, i.e., invoke with `./tools/run.bat` directly from github.io (See [Usage](#Usage)), as this is a web app.

# Future work
- Always improve UX
- Stepping backward/forward
- Cycle detection
- Arbitrary step sequences and mods (change (3n+1/2) and (n/2))
- Multiple views at once