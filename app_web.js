(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _denque = _interopRequireDefault(require("denque"));

var _drawing = require("./drawing.js");

var _number_utils = require("./number_utils.js");

var _settings = require("./settings.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Runner {
  version = "0.0.1 alpha";
  main_canvas;
  size_adjust = new _settings.MinMaxKeyboardAdjuster(_settings.Settings.block_size, _settings.Key.of('z'), _settings.Key.of('x'));
  base_adjust = new _settings.MinMaxKeyboardAdjuster(_settings.Settings.base, _settings.Key.of('a'), _settings.Key.of('s'));
  pause = new _settings.BooleanKeyboardAdjuster(_settings.Settings.run, _settings.Key.of(' '));
  settings_panel = new _settings.SettingsPannel();

  constructor() {
    this.main_canvas = new MainCanvas(document.getElementById("main_canvas"));
    globalThis.main_canvas = this.main_canvas;
    globalThis.parsebigint = _number_utils.parsebigint;
    var restart_button = document.getElementById("restart");

    restart_button.onclick = function () {
      var seed_input = document.getElementById("initial_value");
      this.main_canvas.RestartWith(eval(seed_input.value));
    }.bind(this);

    var more_button = document.getElementById("more");

    more_button.onclick = function () {
      more_button.innerText = this.settings_panel.toggle() ? "Less" : "More";
    }.bind(this);

    console.log("Initialzed app, v. " + this.version);
  }

}

class HistoryElement {
  number;
  cached_string = null;
  op;
  bitmap;

  constructor(number, op) {
    this.number = number;
    this.op = op;
    this.bitmap = document.createElement("canvas");
    this.ReRender();
  }

  ReRender() {
    this.cached_string = this.number.toString(_settings.Settings.base.value);
    this.bitmap.width = window.innerWidth;
    this.bitmap.height = _settings.Settings.block_size.value;
    var render_context = this.bitmap.getContext("2d");

    for (var j = 0; j < this.cached_string.length; j++) {
      var x = j * _settings.Settings.block_size.value;

      if (x > this.bitmap.width) {
        break;
      }

      var number_color = _settings.Settings.baseColors.get(this.cached_string[j]);

      if (number_color == null) {
        console.log("Could not find color for: " + this.cached_string[j]);
        continue;
      }

      _drawing.Drawing.FillRect(render_context, x, 0, _settings.Settings.block_size.value, _settings.Settings.block_size.value, number_color);
    }
  }

}

class History {
  history;

  constructor() {
    this.history = new _denque.default();
  }

  Add(elem) {
    this.history.push(elem);
  }

  TrimDown(max_elems) {
    max_elems = Math.floor(max_elems);

    if (this.history.size() > max_elems) {
      this.history.remove(0, this.history.size() - max_elems);
    }
  }

  RestartAndSeed(seed) {
    this.history.clear();
    this.history.push(new HistoryElement(seed, -1));
  }

  get current() {
    return this.history.peekBack();
  }

  get all() {
    return this.history;
  }

  get length() {
    return this.history.length;
  }

}

class DataViewer {
  constructor() {}

  draw(x, y, width, height, render_context, history) {
    this.history_view(x, y, width, height, render_context, history);
  }

  history_view(x, y, width, height, render_context, history) {
    // background
    var redraw = (0, _settings.CheckIfRenderCacheInvalidatedAndReset)();

    if (redraw) {
      console.log("Cache invalidated!");
    }

    _drawing.Drawing.FillRect(render_context, x, y, width, height, _settings.Settings.bgColor);

    for (var i = -1; i >= -history.length; i--) {
      var history_element = history.all.peekAt(i);

      if (redraw) {
        history_element.ReRender();
      }

      var render_y = render_context.canvas.height + _settings.Settings.block_size.value * i;
      render_context.drawImage(history_element.bitmap, 0, render_y);
    }
  }

}

class StepOperator {
  static Next(current) {
    if (current.number % 2n == 0n) {
      return new HistoryElement(current.number / 2n, 0);
    } else if (current.number % 2n == 1n) {
      return new HistoryElement(current.number * 3n + 1n, 1);
    } else {
      console.log("This shouldn't happen");
      return new HistoryElement(0n, -1);
    }
  }

}

class MainCanvas {
  canvas;
  data_viewer;
  history;
  p_width;
  p_height;

  constructor(canvas) {
    this.canvas = canvas;
    this.data_viewer = new DataViewer();
    this.history = new History();
    window.requestAnimationFrame(this.Draw.bind(this));
  }

  RestartWith(starting_number) {
    this.history.RestartAndSeed(starting_number);
  }

  Draw() {
    var context = this.canvas.getContext("2d");
    this.p_height = this.canvas.height;
    this.p_width = this.canvas.width;
    this.canvas.height = window.innerHeight - 30;
    this.canvas.width = window.innerWidth;

    if (this.p_width != this.canvas.width) {
      (0, _settings.InvalidateRenderCache)();
    }

    this.data_viewer.draw(0, 0, this.canvas.width, this.canvas.height, context, this.history);

    if (_settings.Settings.run.value && this.history.length > 0) {
      this.history.Add(StepOperator.Next(this.history.current));
      this.history.TrimDown(this.canvas.height / _settings.Settings.block_size.value * 2);
    }

    window.requestAnimationFrame(this.Draw.bind(this));
  }

}

window.onload = function () {
  var runner = new Runner();
  globalThis.runner = runner;
};

},{"./drawing.js":2,"./number_utils.js":4,"./settings.js":5,"denque":3}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Drawing = void 0;

class Drawing {
  static rgb(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }

  static FillRect(ctx, x, y, width, height, fill) {
    ctx.fillStyle = Drawing.rgb(fill);
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fill();
  }

}

exports.Drawing = Drawing;

},{}],3:[function(require,module,exports){
'use strict';

/**
 * Custom implementation of a double ended queue.
 */
function Denque(array, options) {
  var options = options || {};

  this._head = 0;
  this._tail = 0;
  this._capacity = options.capacity;
  this._capacityMask = 0x3;
  this._list = new Array(4);
  if (Array.isArray(array)) {
    this._fromArray(array);
  }
}

/**
 * --------------
 *  PUBLIC API
 * -------------
 */

/**
 * Returns the item at the specified index from the list.
 * 0 is the first element, 1 is the second, and so on...
 * Elements at negative values are that many from the end: -1 is one before the end
 * (the last element), -2 is two before the end (one before last), etc.
 * @param index
 * @returns {*}
 */
Denque.prototype.peekAt = function peekAt(index) {
  var i = index;
  // expect a number or return undefined
  if ((i !== (i | 0))) {
    return void 0;
  }
  var len = this.size();
  if (i >= len || i < -len) return undefined;
  if (i < 0) i += len;
  i = (this._head + i) & this._capacityMask;
  return this._list[i];
};

/**
 * Alias for peekAt()
 * @param i
 * @returns {*}
 */
Denque.prototype.get = function get(i) {
  return this.peekAt(i);
};

/**
 * Returns the first item in the list without removing it.
 * @returns {*}
 */
Denque.prototype.peek = function peek() {
  if (this._head === this._tail) return undefined;
  return this._list[this._head];
};

/**
 * Alias for peek()
 * @returns {*}
 */
Denque.prototype.peekFront = function peekFront() {
  return this.peek();
};

/**
 * Returns the item that is at the back of the queue without removing it.
 * Uses peekAt(-1)
 */
Denque.prototype.peekBack = function peekBack() {
  return this.peekAt(-1);
};

/**
 * Returns the current length of the queue
 * @return {Number}
 */
Object.defineProperty(Denque.prototype, 'length', {
  get: function length() {
    return this.size();
  }
});

/**
 * Return the number of items on the list, or 0 if empty.
 * @returns {number}
 */
Denque.prototype.size = function size() {
  if (this._head === this._tail) return 0;
  if (this._head < this._tail) return this._tail - this._head;
  else return this._capacityMask + 1 - (this._head - this._tail);
};

/**
 * Add an item at the beginning of the list.
 * @param item
 */
Denque.prototype.unshift = function unshift(item) {
  if (arguments.length === 0) return this.size();
  var len = this._list.length;
  this._head = (this._head - 1 + len) & this._capacityMask;
  this._list[this._head] = item;
  if (this._tail === this._head) this._growArray();
  if (this._capacity && this.size() > this._capacity) this.pop();
  if (this._head < this._tail) return this._tail - this._head;
  else return this._capacityMask + 1 - (this._head - this._tail);
};

/**
 * Remove and return the first item on the list,
 * Returns undefined if the list is empty.
 * @returns {*}
 */
Denque.prototype.shift = function shift() {
  var head = this._head;
  if (head === this._tail) return undefined;
  var item = this._list[head];
  this._list[head] = undefined;
  this._head = (head + 1) & this._capacityMask;
  if (head < 2 && this._tail > 10000 && this._tail <= this._list.length >>> 2) this._shrinkArray();
  return item;
};

/**
 * Add an item to the bottom of the list.
 * @param item
 */
Denque.prototype.push = function push(item) {
  if (arguments.length === 0) return this.size();
  var tail = this._tail;
  this._list[tail] = item;
  this._tail = (tail + 1) & this._capacityMask;
  if (this._tail === this._head) {
    this._growArray();
  }
  if (this._capacity && this.size() > this._capacity) {
    this.shift();
  }
  if (this._head < this._tail) return this._tail - this._head;
  else return this._capacityMask + 1 - (this._head - this._tail);
};

/**
 * Remove and return the last item on the list.
 * Returns undefined if the list is empty.
 * @returns {*}
 */
Denque.prototype.pop = function pop() {
  var tail = this._tail;
  if (tail === this._head) return undefined;
  var len = this._list.length;
  this._tail = (tail - 1 + len) & this._capacityMask;
  var item = this._list[this._tail];
  this._list[this._tail] = undefined;
  if (this._head < 2 && tail > 10000 && tail <= len >>> 2) this._shrinkArray();
  return item;
};

/**
 * Remove and return the item at the specified index from the list.
 * Returns undefined if the list is empty.
 * @param index
 * @returns {*}
 */
Denque.prototype.removeOne = function removeOne(index) {
  var i = index;
  // expect a number or return undefined
  if ((i !== (i | 0))) {
    return void 0;
  }
  if (this._head === this._tail) return void 0;
  var size = this.size();
  var len = this._list.length;
  if (i >= size || i < -size) return void 0;
  if (i < 0) i += size;
  i = (this._head + i) & this._capacityMask;
  var item = this._list[i];
  var k;
  if (index < size / 2) {
    for (k = index; k > 0; k--) {
      this._list[i] = this._list[i = (i - 1 + len) & this._capacityMask];
    }
    this._list[i] = void 0;
    this._head = (this._head + 1 + len) & this._capacityMask;
  } else {
    for (k = size - 1 - index; k > 0; k--) {
      this._list[i] = this._list[i = (i + 1 + len) & this._capacityMask];
    }
    this._list[i] = void 0;
    this._tail = (this._tail - 1 + len) & this._capacityMask;
  }
  return item;
};

/**
 * Remove number of items from the specified index from the list.
 * Returns array of removed items.
 * Returns undefined if the list is empty.
 * @param index
 * @param count
 * @returns {array}
 */
Denque.prototype.remove = function remove(index, count) {
  var i = index;
  var removed;
  var del_count = count;
  // expect a number or return undefined
  if ((i !== (i | 0))) {
    return void 0;
  }
  if (this._head === this._tail) return void 0;
  var size = this.size();
  var len = this._list.length;
  if (i >= size || i < -size || count < 1) return void 0;
  if (i < 0) i += size;
  if (count === 1 || !count) {
    removed = new Array(1);
    removed[0] = this.removeOne(i);
    return removed;
  }
  if (i === 0 && i + count >= size) {
    removed = this.toArray();
    this.clear();
    return removed;
  }
  if (i + count > size) count = size - i;
  var k;
  removed = new Array(count);
  for (k = 0; k < count; k++) {
    removed[k] = this._list[(this._head + i + k) & this._capacityMask];
  }
  i = (this._head + i) & this._capacityMask;
  if (index + count === size) {
    this._tail = (this._tail - count + len) & this._capacityMask;
    for (k = count; k > 0; k--) {
      this._list[i = (i + 1 + len) & this._capacityMask] = void 0;
    }
    return removed;
  }
  if (index === 0) {
    this._head = (this._head + count + len) & this._capacityMask;
    for (k = count - 1; k > 0; k--) {
      this._list[i = (i + 1 + len) & this._capacityMask] = void 0;
    }
    return removed;
  }
  if (i < size / 2) {
    this._head = (this._head + index + count + len) & this._capacityMask;
    for (k = index; k > 0; k--) {
      this.unshift(this._list[i = (i - 1 + len) & this._capacityMask]);
    }
    i = (this._head - 1 + len) & this._capacityMask;
    while (del_count > 0) {
      this._list[i = (i - 1 + len) & this._capacityMask] = void 0;
      del_count--;
    }
    if (index < 0) this._tail = i;
  } else {
    this._tail = i;
    i = (i + count + len) & this._capacityMask;
    for (k = size - (count + index); k > 0; k--) {
      this.push(this._list[i++]);
    }
    i = this._tail;
    while (del_count > 0) {
      this._list[i = (i + 1 + len) & this._capacityMask] = void 0;
      del_count--;
    }
  }
  if (this._head < 2 && this._tail > 10000 && this._tail <= len >>> 2) this._shrinkArray();
  return removed;
};

/**
 * Native splice implementation.
 * Remove number of items from the specified index from the list and/or add new elements.
 * Returns array of removed items or empty array if count == 0.
 * Returns undefined if the list is empty.
 *
 * @param index
 * @param count
 * @param {...*} [elements]
 * @returns {array}
 */
Denque.prototype.splice = function splice(index, count) {
  var i = index;
  // expect a number or return undefined
  if ((i !== (i | 0))) {
    return void 0;
  }
  var size = this.size();
  if (i < 0) i += size;
  if (i > size) return void 0;
  if (arguments.length > 2) {
    var k;
    var temp;
    var removed;
    var arg_len = arguments.length;
    var len = this._list.length;
    var arguments_index = 2;
    if (!size || i < size / 2) {
      temp = new Array(i);
      for (k = 0; k < i; k++) {
        temp[k] = this._list[(this._head + k) & this._capacityMask];
      }
      if (count === 0) {
        removed = [];
        if (i > 0) {
          this._head = (this._head + i + len) & this._capacityMask;
        }
      } else {
        removed = this.remove(i, count);
        this._head = (this._head + i + len) & this._capacityMask;
      }
      while (arg_len > arguments_index) {
        this.unshift(arguments[--arg_len]);
      }
      for (k = i; k > 0; k--) {
        this.unshift(temp[k - 1]);
      }
    } else {
      temp = new Array(size - (i + count));
      var leng = temp.length;
      for (k = 0; k < leng; k++) {
        temp[k] = this._list[(this._head + i + count + k) & this._capacityMask];
      }
      if (count === 0) {
        removed = [];
        if (i != size) {
          this._tail = (this._head + i + len) & this._capacityMask;
        }
      } else {
        removed = this.remove(i, count);
        this._tail = (this._tail - leng + len) & this._capacityMask;
      }
      while (arguments_index < arg_len) {
        this.push(arguments[arguments_index++]);
      }
      for (k = 0; k < leng; k++) {
        this.push(temp[k]);
      }
    }
    return removed;
  } else {
    return this.remove(i, count);
  }
};

/**
 * Soft clear - does not reset capacity.
 */
Denque.prototype.clear = function clear() {
  this._head = 0;
  this._tail = 0;
};

/**
 * Returns true or false whether the list is empty.
 * @returns {boolean}
 */
Denque.prototype.isEmpty = function isEmpty() {
  return this._head === this._tail;
};

/**
 * Returns an array of all queue items.
 * @returns {Array}
 */
Denque.prototype.toArray = function toArray() {
  return this._copyArray(false);
};

/**
 * -------------
 *   INTERNALS
 * -------------
 */

/**
 * Fills the queue with items from an array
 * For use in the constructor
 * @param array
 * @private
 */
Denque.prototype._fromArray = function _fromArray(array) {
  for (var i = 0; i < array.length; i++) this.push(array[i]);
};

/**
 *
 * @param fullCopy
 * @returns {Array}
 * @private
 */
Denque.prototype._copyArray = function _copyArray(fullCopy) {
  var newArray = [];
  var list = this._list;
  var len = list.length;
  var i;
  if (fullCopy || this._head > this._tail) {
    for (i = this._head; i < len; i++) newArray.push(list[i]);
    for (i = 0; i < this._tail; i++) newArray.push(list[i]);
  } else {
    for (i = this._head; i < this._tail; i++) newArray.push(list[i]);
  }
  return newArray;
};

/**
 * Grows the internal list array.
 * @private
 */
Denque.prototype._growArray = function _growArray() {
  if (this._head) {
    // copy existing data, head to end, then beginning to tail.
    this._list = this._copyArray(true);
    this._head = 0;
  }

  // head is at 0 and array is now full, safe to extend
  this._tail = this._list.length;

  this._list.length <<= 1;
  this._capacityMask = (this._capacityMask << 1) | 1;
};

/**
 * Shrinks the internal list array.
 * @private
 */
Denque.prototype._shrinkArray = function _shrinkArray() {
  this._list.length >>>= 1;
  this._capacityMask >>>= 1;
};


module.exports = Denque;

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parsebigint = parsebigint;

function parsebigint(value, radix) {
  return [...value.toString()].reduce((r, v) => r * BigInt(radix) + BigInt(parseInt(v, radix)), 0n);
}

globalThis.parsebigint = parsebigint;

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BooleanSetting = exports.BooleanKeyboardAdjuster = void 0;
exports.CheckIfRenderCacheInvalidatedAndReset = CheckIfRenderCacheInvalidatedAndReset;
exports.InvalidateRenderCache = InvalidateRenderCache;
exports.SettingsPannel = exports.Settings = exports.MinMaxSetting = exports.MinMaxKeyboardAdjuster = exports.Key = void 0;

class BaseSetting {
  static INVALIDATE_RENDER_CACHE = true;
  static DO_NOT_INVALIDATE_CACHE = false;
  invalidate_render_cache;
  _value;
  static cache_invalidated = false;

  constructor(value, invalidate_render_cache) {
    this._value = value;
    this.invalidate_render_cache = invalidate_render_cache;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    if (this.invalidate_render_cache) {
      BaseSetting.cache_invalidated = true;
    }

    this._value = value;
  }

  static CheckCacheInvalidation() {
    if (this.cache_invalidated) {
      this.cache_invalidated = false;
      return true;
    }

    return false;
  }

}

function CheckIfRenderCacheInvalidatedAndReset() {
  return BaseSetting.CheckCacheInvalidation();
}

function InvalidateRenderCache() {
  BaseSetting.cache_invalidated = true;
}

class MinMaxSetting extends BaseSetting {
  min;
  max;
  delta = 1;

  constructor(min, max, default_value, invalidate_render_cache, delta = 1) {
    super(default_value, invalidate_render_cache);
    this.min = min;
    this.max = max;
    this.delta = delta;
  }

  increment() {
    if (this.value == this.max) {
      return;
    }

    this.value += this.delta;

    if (this.value > this.max) {
      this.value = this.max;
    }
  }

  decrement() {
    if (this.value == this.min) {
      return;
    }

    this.value -= this.delta;

    if (this.value < this.min) {
      this.value = this.min;
    }
  }

}

exports.MinMaxSetting = MinMaxSetting;

class BooleanSetting extends BaseSetting {
  constructor(value, invalidate_render_cache) {
    super(value, invalidate_render_cache);
  }

  on() {
    this.value = true;
  }

  off() {
    this.value = false;
  }

  toggle() {
    this.value = !this.value;
  }

}

exports.BooleanSetting = BooleanSetting;

class Settings {
  static bgColor = [10, 10, 10];
  static baseColors = new Map([["0", [0, 0, 0]], ["1", [128, 0, 0]], ["2", [0, 128, 0]], ["3", [128, 128, 0]], ["4", [0, 0, 128]], ["5", [128, 0, 128]], ["6", [0, 0, 128]], ["7", [128, 128, 128]], ["8", [200, 200, 200]], ["9", [200, 0, 0]], ["a", [0, 200, 0]], ["b", [200, 200, 0]], ["c", [0, 0, 200]], ["d", [200, 0, 200]], ["e", [0, 0, 200]], ["f", [255, 255, 255]] // F
  ]);
  static base = new MinMaxSetting(2, 16, 6, BaseSetting.INVALIDATE_RENDER_CACHE);
  static block_size = new MinMaxSetting(1, 20, 3, BaseSetting.INVALIDATE_RENDER_CACHE);
  static run = new BooleanSetting(true, BaseSetting.DO_NOT_INVALIDATE_CACHE);

  constructor() {}

}

exports.Settings = Settings;

class Key {
  ctrl = false;
  shift = false;
  key = null;

  constructor(key) {
    this.key = key;
  }

  static of(key) {
    return new Key(key);
  }

  andCtrl() {
    this.ctrl = true;
    return this;
  }

  andShift() {
    this.shift = true;
    return this;
  }

  matches(event) {
    if (this.ctrl && !event.ctrlKey) {
      return false;
    }

    if (this.shift && !event.shiftKey) {
      return false;
    }

    return event.key === this.key;
  }

}

exports.Key = Key;

class MinMaxKeyboardAdjuster {
  setting;
  decKey;
  incKey;

  constructor(setting, decKey, incKey) {
    this.setting = setting;
    this.decKey = decKey;
    this.incKey = incKey;
    document.addEventListener("keydown", function (event) {
      if (this.decKey.matches(event)) {
        this.setting.decrement();
      } else if (this.incKey.matches(event)) {
        this.setting.increment();
      }
    }.bind(this));
  }

}

exports.MinMaxKeyboardAdjuster = MinMaxKeyboardAdjuster;

class BooleanKeyboardAdjuster {
  setting;
  key;
  invalidate_render_cache;

  constructor(setting, key) {
    this.setting = setting;
    this.key = key;
    document.addEventListener("keydown", function (event) {
      if (this.key.matches(event)) {
        this.setting.toggle();
      }
    }.bind(this));
  }

}

exports.BooleanKeyboardAdjuster = BooleanKeyboardAdjuster;

class SettingsPannel {
  settings_div;

  constructor(hidden = true) {
    this.settings_div = document.createElement("div");
    this.settings_div.classList.add("popup_settings");
    document.body.append(this.settings_div);

    if (hidden) {
      this.settings_div.style.display = "none";
    }
  }

  hide() {
    this.settings_div.style.display = "none";
  }

  show() {
    this.settings_div.style.display = "block";
  }

  toggle() {
    if (this.settings_div.style.display == "none") {
      this.show();
      return true;
    } else {
      this.hide();
      return false;
    }
  }

}

exports.SettingsPannel = SettingsPannel;

},{}]},{},[2,1]);
