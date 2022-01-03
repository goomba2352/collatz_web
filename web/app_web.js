(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
"use strict";

var _denque = _interopRequireDefault(require("denque"));

var _drawing = require("./drawing.js");

var _number_utils = require("./number_utils.js");

var _settings = require("./settings.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Runner {
  version = "0.0.3 alpha";
  container;
  error_box;
  main_canvas;
  settings;
  settings_panel;
  keyboard_controls;

  constructor() {
    // Create container and canvas:
    this.container = document.createElement("div");
    this.container.classList.add("canvas-container");
    var canvas = document.createElement("canvas");
    this.container.appendChild(canvas);
    canvas.tabIndex = 1;
    this.settings = new _settings.Settings(canvas);
    this.error_box = document.createElement("div");
    this.error_box.classList.add("error-box");
    this.error_box.style.display = "none";
    this.container.appendChild(this.error_box);
    this.main_canvas = new MainCanvas(this.settings, this.error_box, canvas, this.container);
    document.body.appendChild(this.container);

    var recompile = function (t) {
      this.main_canvas.step_operator.Recompile(this.settings.GetStringOperations());
    }.bind(this); // Init settings and keyboard controls:


    this.settings_panel = new _settings.SettingsPanel(this.container);
    var renderer_tab = "Renderer";
    var render_settings = [];
    render_settings.push(this.settings.reverse);
    render_settings.push(this.settings.run);
    render_settings.push(this.settings.base);
    render_settings.push(this.settings.block_size);
    render_settings.push(this.settings.render_mode);
    this.settings_panel.AddSettings(renderer_tab, render_settings);
    var colors_tab = "Colors";
    var color_settings = [];
    this.settings_panel.AddGenericControl(colors_tab, new _settings.ColorPresetsControl().GetControl(this.settings));
    this.settings.baseColors.forEach(x => color_settings.push(x));
    color_settings.push(this.settings.bgColor);
    color_settings.push(this.settings.color_shift);
    this.settings_panel.AddSettings(colors_tab, color_settings);
    var x_mods_tab = "x Mods";
    var mod_settings = [];
    mod_settings.push(this.settings.mods);
    mod_settings.push(...this.settings.operations);
    this.settings_panel.AddSettings(x_mods_tab, mod_settings);
    var x_mods_div = this.settings_panel.tabs.get(x_mods_tab);
    this.settings.operations.forEach(x => x.AddListner(recompile));
    this.settings.mods.AddListner(function (value) {
      var value;
      var old_operations = this.settings.ConstructDefaultOperationsAndGetOldOperations(value);

      for (var i = 0; i < this.settings.operations.length; i++) {
        x_mods_div.insertBefore(this.settings.operations[i].controller, old_operations[0].controller);
        this.settings.operations[i].AddListner(recompile);
      }

      old_operations.forEach(x => x.destruct());
      recompile(value.toString());
    }.bind(this));
    this.settings.base.AddListner(function (value) {
      for (var i = 0; i < this.settings.baseColors.length; i++) {
        if (i < value) {
          this.settings.baseColors[i].controller.style.display = "block";
        } else {
          this.settings.baseColors[i].controller.style.display = "none";
        }
      }
    }.bind(this),
    /*call_immediately=*/
    true);
    this.keyboard_controls = new _settings.KeyboardControls(this.settings, canvas);
    globalThis.main_canvas = this.main_canvas;
    globalThis.parsebigint = _number_utils.parsebigint;
    var seed_input = document.getElementById("initial_value");
    seed_input.addEventListener("keyup", function (event) {
      if (event.keyCode === 13) {
        // Enter
        event.preventDefault();
        seed_button.click();
      }
    }.bind(this)); // Set up seed button

    var seed_button = document.getElementById("restart");

    seed_button.onclick = function () {
      try {
        this.main_canvas.RestartWith(eval(seed_input.value));
        this.main_canvas.ClearError("Seed Input");
      } catch (e) {
        this.main_canvas.ShowError("Seed Input", e.toString());
      }
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
  cache_hash = null;

  constructor(settings, number, op) {
    this.number = number;
    this.op = op;
    this.bitmap = document.createElement("canvas");
    this.Update(settings, true, settings.PreProcessCacheHash());
  }

  Update(settings, redraw, cache_hash) {
    var render_mode = settings.render_mode.t_value;

    if (this.cache_hash != cache_hash) {
      this.cached_string = this.number.toString(settings.base.value);

      if (settings.reverse.value) {
        this.cached_string = this.cached_string.split("").reverse().join("");
      }

      this.cache_hash = cache_hash;
    }

    if (redraw && render_mode.is_history_view_type) {
      this.bitmap.width = settings.main_canvas.width;
      this.bitmap.height = settings.block_size.value;
      render_mode.Render(this.cached_string, settings, this.bitmap.getContext("2d"));
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

  RestartAndSeed(settings, seed) {
    this.history.clear();
    this.history.push(new HistoryElement(settings, seed, -1));
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
  settings;

  constructor(settings) {
    this.settings = settings;
  }

  draw(x, y, width, height, render_context, history) {
    var redraw = this.settings.CheckCacheInvalidation(); // background

    _drawing.Drawing.FillRect(render_context, x, y, width, height, this.settings.bgColor.value);

    var cache_hash = this.settings.PreProcessCacheHash();

    for (var i = 0; i < history.all.length; i++) {
      var history_element = history.all.peekAt(i);
      history_element.Update(this.settings, redraw, cache_hash);
    }

    if (this.settings.render_mode.t_value.is_history_view_type) {
      this.HistoryView(render_context, history);
    } else {
      this.LatestNumberView(render_context, history);
    }
  }

  LatestNumberView(render_context, history) {
    if (history.length >= 1) {
      this.settings.render_mode.t_value.Render(history.current.cached_string, this.settings, render_context);
    }
  }

  HistoryView(render_context, history) {
    for (var i = -1; i >= -history.length; i--) {
      var history_element = history.all.peekAt(i);
      var render_y = render_context.canvas.height + this.settings.block_size.value * i;
      render_context.drawImage(history_element.bitmap, 0, render_y);
    }
  }

}

class StepOperator {
  operations;
  mod;
  main_canvas;
  static THIS_ERROR_SOURCE = "Operation Compiler";

  Recompile(operations) {
    var op = 0;

    try {
      var compiled = [];

      for (op = 0; op < operations.length; op++) {
        var c = new Function("x", '"use strict"; return ' + operations[op]);
        compiled.push(c);
      }
    } catch (e) {
      this.main_canvas.ShowError(StepOperator.THIS_ERROR_SOURCE, "Compilation for mod[" + op + "] failed: " + e.toString());
      return;
    }

    this.main_canvas.ClearError(StepOperator.THIS_ERROR_SOURCE);
    this.mod = BigInt(compiled.length);
    console.log("Compiled " + compiled.length + " operations");
    this.operations = compiled;
  }

  static Compile(operations, main_canvas) {
    var compiled = [];

    for (var op = 0; op < operations.length; op++) {
      var c = new Function("x", '"use strict"; return ' + operations[op]);
      compiled.push(c);
    }

    return new StepOperator(compiled, main_canvas);
  }

  constructor(operations, main_canvas) {
    this.main_canvas = main_canvas;
    this.operations = operations;
    this.mod = BigInt(operations.length);
  }

  Next(settings, current) {
    var mod_result = current.number % this.mod;
    var mod_result_n = Number(mod_result);
    var next = this.operations[Number(mod_result_n)](current.number);
    return new HistoryElement(settings, next, mod_result_n);
  }

}

class MainCanvas {
  container;
  error_box;
  canvas;
  data_viewer;
  history;
  p_width;
  p_height;
  settings;
  step_operator;
  errors = new Map();
  static THIS_ERROR_SOURCE = "Animation Runner";

  constructor(settings, error_box, canvas, container) {
    this.settings = settings;
    this.error_box = error_box;
    this.canvas = canvas;
    this.container = container;
    this.data_viewer = new DataViewer(settings);
    this.history = new History();
    this.step_operator = StepOperator.Compile(this.settings.GetStringOperations(), this);
    window.requestAnimationFrame(this.Draw.bind(this));
  }

  ShowError(source, message, stack = null) {
    console.error("Exception from [" + source + "]:\n" + message);

    if (stack != null) {
      console.error("Stack trace: ");
      console.error(stack);
    }

    this.errors.set(source, [message, stack]);
  }

  ClearError(source) {
    if (this.errors.has(source)) {
      this.errors.delete(source);
    }
  }

  RestartWith(starting_number) {
    this.history.RestartAndSeed(this.settings, starting_number);
  }

  Draw() {
    try {
      var new_error = false;
      var context = this.canvas.getContext("2d");
      this.p_height = this.canvas.height;
      this.p_width = this.canvas.width;
      this.canvas.height = this.container.clientHeight;
      this.canvas.width = this.container.clientWidth;

      if (this.p_width != this.canvas.width || this.p_height != this.canvas.height) {
        this.settings.InvalidateRenderCache();
      }

      this.data_viewer.draw(0, 0, this.canvas.width, this.canvas.height, context, this.history);

      if (this.settings.run.value && this.history.length > 0) {
        this.history.Add(this.step_operator.Next(this.settings, this.history.current));
        this.history.TrimDown(this.canvas.height / this.settings.block_size.value * 2);
      }

      this.ClearError(MainCanvas.THIS_ERROR_SOURCE);
    } catch (e) {
      if (!this.errors.has(MainCanvas.THIS_ERROR_SOURCE)) {
        this.ShowError(MainCanvas.THIS_ERROR_SOURCE, e.toString(), e.stack);
      }
    } finally {
      window.requestAnimationFrame(this.Draw.bind(this));
      var text = "";

      if (this.errors.size == 0) {
        this.error_box.style.display = "none";
      } else {
        this.error_box.style.display = "block";
        this.errors.forEach((message, source) => text += "Exception from [" + source + "]:\n" + message);
        this.error_box.innerText = text;
      }
    }
  }

}

window.onload = function () {
  try {
    var runner = new Runner();
  } catch (e) {
    var error = document.createElement("div");
    error.classList.add("perma-error-box");
    error.innerText = "A permenant error has occured:\n" + e.toString();
    document.body.appendChild(error);
    throw e;
  }

  globalThis.runner = runner;
};

},{"./drawing.js":3,"./number_utils.js":5,"./settings.js":6,"denque":1}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SpiralView = exports.RenderMode = void 0;

var _drawing = require("./drawing");

var number_map = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "a": 10,
  "b": 11,
  "c": 12,
  "d": 13,
  "e": 14,
  "f": 15,
  "g": 16,
  "h": 17,
  "i": 18,
  "j": 19,
  "k": 20,
  "l": 21,
  "m": 22,
  "n": 23,
  "o": 24,
  "p": 25,
  "q": 26,
  "r": 27,
  "s": 28,
  "t": 29,
  "u": 30,
  "v": 31,
  "w": 32,
  "x": 33,
  "y": 34,
  "z": 35
};

class SpiralView {
  static encoded_dirs = [[0, 1], [-1, 0], [0, -1], [1, 0]];
  static next_level_dir = [1, 0];
  rows = [];
  cursor;
  middle_pos;
  level;
  needed_for_next_level;
  inner_level_tracker;

  constructor(rows, cols) {
    for (var i = 0; i < rows; i++) {
      this.rows.push([]);

      for (var j = 0; j < cols; j++) {
        this.rows[i].push(null);
      }
    }

    this.cursor = [0, 0];
    this.middle_pos = [Math.floor(rows / 2), Math.floor(cols / 2)];
    this.level = 0;
    this.needed_for_next_level = 0;
    this.inner_level_tracker = 0;
  }

  AddOne(elem) {
    var result = false;
    var position = [this.middle_pos[0] + this.cursor[0], this.middle_pos[1] + this.cursor[1]];

    if (position[0] >= 0 && position[0] < this.rows.length && position[1] >= 0 && position[1] < this.rows[0].length) {
      result = true;
      this.rows[position[0]][position[1]] = elem;
    }

    this.inner_level_tracker++;

    if (this.inner_level_tracker >= this.needed_for_next_level) {
      this.level += 1;
      this.needed_for_next_level += 8;
      this.inner_level_tracker = 0;
      this.cursor = [this.cursor[0] + SpiralView.next_level_dir[0], this.cursor[1] + SpiralView.next_level_dir[1]];
      return result;
    }

    var dir = SpiralView.encoded_dirs[Math.floor(this.inner_level_tracker / Math.floor(this.needed_for_next_level / 4))];
    this.cursor = [this.cursor[0] + dir[0], this.cursor[1] + dir[1]];
    return result;
  }

}

exports.SpiralView = SpiralView;

class RenderMode {
  is_history_view_type = false;
  name;

  constructor(history_view_type, name) {
    this.is_history_view_type = history_view_type;
  }

  static RegisteredModes() {
    return [new HistoryViewMode(), new SpiralViewMode()];
  }

}

exports.RenderMode = RenderMode;

class HistoryViewMode extends RenderMode {
  constructor() {
    super(true, "History View");
  }

  Render(number_string, settings, render_context) {
    for (var j = 0; j < number_string.length; j++) {
      var x = j * settings.block_size.value;

      if (x > render_context.canvas.width) {
        break;
      }

      var number_color = settings.baseColors[(number_map[number_string[j]] + settings.color_shift.value) % settings.base.value].value;

      if (number_color == null) {
        continue;
      }

      _drawing.Drawing.FillRect(render_context, x, 0, settings.block_size.value, settings.block_size.value, number_color);
    }
  }

}

class SpiralViewMode extends RenderMode {
  constructor() {
    super(false, "Spiral View");
  }

  Render(number_string, settings, render_context) {
    var sp = new SpiralView(Math.floor(render_context.canvas.height / settings.block_size.value), Math.floor(render_context.canvas.width / settings.block_size.value));

    for (var i = 0; i < number_string.length; i++) {
      sp.AddOne(number_string[i]);
    }

    for (var i = 0; i < sp.rows.length; i++) {
      for (var j = 0; j < sp.rows[i].length; j++) {
        var val = sp.rows[i][j];

        if (val == null) {
          continue;
        }

        var number_color = settings.baseColors[(number_map[val] + settings.color_shift.value) % settings.base.value].value;
        var x = j * settings.block_size.value;
        var y = i * settings.block_size.value;

        _drawing.Drawing.FillRect(render_context, x, y, settings.block_size.value, settings.block_size.value, number_color);
      }
    }
  }

}

},{"./drawing":3}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parsebigint = parsebigint;
var master = "0123456789abcdefghijklmnopqrstuvwxyz";

function parsebigint(value, radix) {
  value = value.toLowerCase();

  if (radix < 2 || radix > master.length) {
    throw new RangeError("radix out of range, valid range: [2, " + master.length + "]");
  }

  for (var i = 0; i < value.length; i++) {
    var c = value[i];
    var pos = master.indexOf(c);

    if (pos == -1) {
      throw new TypeError("Character [" + c + "] cannot be parsed. Valid characters for radix=" + radix + ": [" + master.substring(0, radix).split("").join(",") + "]");
    } else if (pos >= radix) {
      throw new RangeError("Character [" + c + "] cannot be parsed, as it is out of range. Valid characters for radix=" + radix + ": [" + master.substring(0, radix).split("").join(",") + "]");
    }
  }

  return [...value.toString()].reduce((r, v) => r * BigInt(radix) + BigInt(parseInt(v, radix)), 0n);
}

globalThis.parsebigint = parsebigint;

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SettingsPanel = exports.Settings = exports.KeyboardControls = exports.ColorPresetsControl = exports.BaseSetting = void 0;

var _number_renderer = require("./number_renderer");

var globalId = -1;

function NewGlobalId() {
  globalId++;
  return "gId" + globalId;
}

class BaseSetting {
  name;
  static INVALIDATE_RENDER_CACHE = true;
  static DO_NOT_INVALIDATE_CACHE = false;
  parent_settings;
  _controller = null;
  invalidate_render_cache;
  _value;
  listeners = [];

  constructor(name, value, invalidate_render_cache, parent_settings) {
    this.name = name;
    this._value = value;
    this.parent_settings = parent_settings;
    this.invalidate_render_cache = invalidate_render_cache;
  }

  AddListner(f, call_immediately = false) {
    this.listeners.push(f);

    if (call_immediately) {
      f(this.value);
    }
  }

  get value() {
    return this._value;
  }

  get controller() {
    if (this._controller == null) {
      this._controller = this.ControllerConstructor();
    }

    return this._controller;
  }

  set value(value) {
    if (this.invalidate_render_cache) {
      this.parent_settings.InvalidateRenderCache();
    }

    this._value = value;
    this.UpdateController();

    for (var i = 0; i < this.listeners.length; i++) {
      this.listeners[i](value);
    }
  }

  destruct() {
    if (this.controller != null) {
      this.controller.remove();
    }
  }

}

exports.BaseSetting = BaseSetting;

class MinMaxSetting extends BaseSetting {
  min;
  max;
  delta = 1;

  constructor(name, min, max, default_value, invalidate_render_cache, settings, delta = 1) {
    super(name, default_value, invalidate_render_cache, settings);
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

  ControllerConstructor() {
    var div = document.createElement("div");
    var minus_button = document.createElement("button");
    minus_button.innerText = "-";

    minus_button.onclick = function () {
      this.decrement();
    }.bind(this);

    div.appendChild(minus_button);
    var plus_button = document.createElement("button");
    plus_button.innerText = "+";
    div.appendChild(plus_button);

    plus_button.onclick = function () {
      this.increment();
    }.bind(this);

    var input = document.createElement("input");
    input.type = "range";
    input.id = NewGlobalId();
    input.min = this.min.toString();
    input.max = this.max.toString();
    input.step = this.delta.toString();
    input.value = this.value.toString();
    input.addEventListener("change", function () {
      this.value = parseInt(input.value);
    }.bind(this));
    div.appendChild(input);
    var label = document.createElement("label");
    label.innerText = this.name + "=" + this.value;
    label.htmlFor = input.id;
    div.appendChild(label);
    return div;
  }

  UpdateController() {
    var input = this.controller.childNodes[2];
    input.value = this.value.toString();
    var label = this.controller.childNodes[3];
    label.innerText = this.name + "=" + this.value;
  }

}

class BooleanSetting extends BaseSetting {
  constructor(name, value, invalidate_render_cache, settings) {
    super(name, value, invalidate_render_cache, settings);
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

  ControllerConstructor() {
    var div = document.createElement("div");
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.name = this.name;
    cb.id = NewGlobalId();
    cb.classList.add("checkbox");
    cb.checked = this.value;
    cb.addEventListener("change", function () {
      this.value = cb.checked;
    }.bind(this));
    div.appendChild(cb);
    var label = document.createElement("label");
    label.innerText = this.name;
    label.htmlFor = cb.id;
    div.appendChild(label);
    return div;
  }

  UpdateController() {
    var div = this.controller;
    var cb = div.childNodes[0];
    cb.checked = this.value;
  }

}

class ArraySetting extends MinMaxSetting {
  values;

  constructor(name, default_index, values, invalidate_render_cache, settings) {
    super(name, 0, values.length - 1, default_index, invalidate_render_cache, settings);
    this.values = values;
  }

  get t_value() {
    return this.values[this.value];
  }

}

class StringSetting extends BaseSetting {
  constructor(name, value, invalidate_render_cache, settings) {
    super(name, value, invalidate_render_cache, settings);
  }

  UpdateController() {
    var input = this.controller.childNodes[0];
    input.value = this.value;
  }

  ControllerConstructor() {
    var div = document.createElement("div");
    var text = document.createElement("input");
    text.name = this.name;
    text.value = this.value;
    text.id = NewGlobalId();
    div.appendChild(text);
    var button = document.createElement("button");
    button.innerText = "Set";

    button.onclick = function () {
      this.value = text.value;
    }.bind(this);

    div.appendChild(button);
    var label = document.createElement("label");
    label.innerText = this.name;
    label.htmlFor = text.id;
    div.appendChild(label);
    return div;
  }

}

class ColorSetting extends BaseSetting {
  constructor(name, value, invalidate_render_cache, settings) {
    super(name, value, invalidate_render_cache, settings);
  }

  RgbToHex(rgb) {
    return "#" + rgb[0].toString(16).padStart(2, "0") + rgb[1].toString(16).padStart(2, "0") + rgb[2].toString(16).padStart(2, "0");
  }

  HexToRgb(hex) {
    var r, g, b;

    if (hex.startsWith("#")) {
      hex = hex.substring(1);
    }

    if (hex.length == 3) {
      r = parseInt(hex[0], 16);
      g = parseInt(hex[1], 16);
      b = parseInt(hex[2], 16);
    } else if (hex.length == 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      throw TypeError("Cannot convert hex to rgb: " + hex);
    }

    return [r, g, b];
  }

  UpdateController() {
    var color = this.controller.childNodes[0];
    color.value = this.RgbToHex(this.value);
  }

  ControllerConstructor() {
    var div = document.createElement("div");
    var color = document.createElement("input");
    color.id = NewGlobalId();
    color.type = "color";
    color.value = this.RgbToHex(this.value);

    color.onchange = function () {
      this.value = this.HexToRgb(color.value);
    }.bind(this);

    div.appendChild(color);
    var label = document.createElement("label");
    label.innerText = this.name;
    label.htmlFor = color.id;
    div.appendChild(label);
    return div;
  }

}

class ColorPresetsControl {
  // H: 0-360, S: 0-1, L: 0-1
  // Credit: https://www.30secondsofcode.org/js/s/hsl-to-rgb, modified slightly.
  HSLToRGB(h, s, l) {
    if (h < 0 || h > 360) {
      throw RangeError("h must be between 0-360, got h=" + h);
    }

    if (s < 0 || s > 1) {
      throw RangeError("s must be between 0-1, got s=" + s);
    }

    if (l < 0 || l > 1) {
      throw RangeError("l must be between 0-1, got l=" + l);
    }

    const k = n => (n + h / 30) % 12;

    const a = s * Math.min(l, 1 - l);

    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    return [Math.floor(255 * f(0)), Math.floor(255 * f(8)), Math.floor(255 * f(4))];
  }

  GetControl(settings) {
    var div = document.createElement("div");
    var gray_button = document.createElement("button");
    gray_button.innerText = "Grayscale";

    gray_button.onclick = function () {
      var base = settings.base.value;

      for (var i = 0; i < base; i++) {
        var color = [Math.floor(255 * (i / (base - 1))), Math.floor(255 * (i / (base - 1))), Math.floor(255 * (i / (base - 1)))];
        settings.baseColors[i].value = color;
      }
    }.bind(this);

    var chrom_button = document.createElement("button");
    chrom_button.innerText = "Chromatic";

    chrom_button.onclick = function () {
      var base = settings.base.value;

      for (var i = 0; i < base; i++) {
        if (i < base) {
          var color = this.HSLToRGB(360 * (i / base), 0.8, 0.62);
          settings.baseColors[i].value = color;
        } else {
          break;
        }
      }
    }.bind(this);

    var random_button = document.createElement("button");
    random_button.innerText = "Random";

    random_button.onclick = function () {
      var base = settings.base.value;

      for (var i = 0; i < base; i++) {
        if (i < base) {
          var color = [Math.floor(255 * Math.random()), Math.floor(255 * Math.random()), Math.floor(255 * Math.random())];
          settings.baseColors[i].value = color;
        } else {
          break;
        }
      }
    }.bind(this);

    div.appendChild(gray_button);
    div.appendChild(chrom_button);
    div.appendChild(random_button);
    return div;
  }

}

exports.ColorPresetsControl = ColorPresetsControl;

class Settings {
  render_cache_invalidated = false;
  _main_canvas;

  get main_canvas() {
    return this._main_canvas;
  }

  GetStringOperations() {
    var res = [];
    this.operations.forEach(x => res.push(x.value));
    return res;
  }

  ConstructDefaultOperationsAndGetOldOperations(value) {
    var new_operations = [];
    var old_operations = this.operations;

    for (var i = 0; i < value; i++) {
      var name = "x ≡ " + value + " % " + i;
      var op_string = "";

      if (i == 0) {
        op_string = "x / " + value + "n";
      } else {
        var n_1 = BigInt(value) + 1n;
        op_string = "(" + n_1 + "n * x + " + (value - i) + "n) / " + value + "n";
      }

      var op = new StringSetting(name, op_string, BaseSetting.DO_NOT_INVALIDATE_CACHE, this);
      new_operations.push(op);
    }

    this.operations = new_operations;
    return old_operations;
  }

  constructor(main_canvas) {
    this._main_canvas = main_canvas;
    this.ConstructDefaultOperationsAndGetOldOperations(2); // Extended support for base 36, random colors

    for (var i = 0; i < 20; i++) {
      var high_color = new ColorSetting("x ≡ n mod " + (16 + i), [Math.floor(255 * Math.random()), Math.floor(255 * Math.random()), Math.floor(255 * Math.random())], BaseSetting.INVALIDATE_RENDER_CACHE, this);
      this.baseColors.push(high_color);
    }
  } // Actual settings:


  bgColor = new ColorSetting("Background Color", [0, 0, 0], BaseSetting.DO_NOT_INVALIDATE_CACHE, this);
  color_shift = new MinMaxSetting("Color Shift", 0, 36, 0, BaseSetting.INVALIDATE_RENDER_CACHE, this); // prettier-ignore

  baseColors = [new ColorSetting("x ≡ n mod 0 ", [50, 50, 50], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 1 ", [128, 0, 0], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 2 ", [0, 128, 0], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 3 ", [128, 128, 0], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 4 ", [0, 0, 128], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 5 ", [128, 0, 128], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 6 ", [0, 0, 128], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 7 ", [128, 128, 128], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 8 ", [200, 200, 200], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 9 ", [200, 0, 0], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 10", [0, 200, 0], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 11", [200, 200, 0], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 12", [0, 0, 200], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 13", [200, 0, 200], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 14", [0, 0, 200], BaseSetting.INVALIDATE_RENDER_CACHE, this), new ColorSetting("x ≡ n mod 15", [255, 255, 255], BaseSetting.INVALIDATE_RENDER_CACHE, this) // F
  ];
  base = new MinMaxSetting("base", 2, 36, 6, BaseSetting.INVALIDATE_RENDER_CACHE, this);
  render_mode = new ArraySetting("renderer", 1, _number_renderer.RenderMode.RegisteredModes(), BaseSetting.INVALIDATE_RENDER_CACHE, this);
  block_size = new MinMaxSetting("scale", 1, 20, 3, BaseSetting.INVALIDATE_RENDER_CACHE, this);
  run = new BooleanSetting("Run/pause", true, BaseSetting.DO_NOT_INVALIDATE_CACHE, this);
  reverse = new BooleanSetting("Reverse", true, BaseSetting.INVALIDATE_RENDER_CACHE, this);
  operations = [];
  mods = new MinMaxSetting("mods", 2, 36, 2, BaseSetting.DO_NOT_INVALIDATE_CACHE, this);

  CheckCacheInvalidation() {
    if (this.render_cache_invalidated) {
      this.render_cache_invalidated = false;
      return true;
    }

    return false;
  }

  InvalidateRenderCache() {
    this.render_cache_invalidated = true;
  } // Add values to PreProcessCacheHash() if they affect the output of the number.
  // e.g. Reversing the number and it's base affects this, where as the view mode or size do not.


  PreProcessCacheHash() {
    return this.base.value.toString() + (this.reverse.value ? "r" : "n");
  }

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

class MinMaxKeyboardAdjuster {
  setting;
  decKey;
  incKey;

  constructor(setting, decKey, incKey, parent) {
    this.setting = setting;
    this.decKey = decKey;
    this.incKey = incKey;
    parent.addEventListener("keydown", function (event) {
      if (this.decKey.matches(event)) {
        this.setting.decrement();
      } else if (this.incKey.matches(event)) {
        this.setting.increment();
      }
    }.bind(this));
  }

}

class BooleanKeyboardAdjuster {
  setting;
  key;
  invalidate_render_cache;

  constructor(setting, key, parent) {
    this.setting = setting;
    this.key = key;
    parent.addEventListener("keydown", function (event) {
      if (this.key.matches(event)) {
        this.setting.toggle();
      }
    }.bind(this));
  }

}

class KeyboardControls {
  block_size;
  base;
  render_mode;
  pause;
  reverse;

  constructor(settings, parent) {
    this.block_size = new MinMaxKeyboardAdjuster(settings.block_size, Key.of("z"), Key.of("x"), parent);
    this.base = new MinMaxKeyboardAdjuster(settings.base, Key.of("a"), Key.of("s"), parent);
    this.render_mode = new MinMaxKeyboardAdjuster(settings.render_mode, Key.of(","), Key.of("."), parent);
    this.pause = new BooleanKeyboardAdjuster(settings.run, Key.of(" "), parent);
    this.reverse = new BooleanKeyboardAdjuster(settings.reverse, Key.of("r"), parent);
  }

}

exports.KeyboardControls = KeyboardControls;

class SettingsPanel {
  tab_selector;
  container_div;
  tabs;
  selected;

  constructor(parent, hidden = true) {
    this.tab_selector = document.createElement("div");
    this.tab_selector.classList.add("tab-selector");
    this.container_div = document.createElement("div");
    this.container_div.classList.add("container_popup");
    this.tabs = new Map();
    document.createElement("div");
    this.container_div.appendChild(this.tab_selector);

    if (hidden) {
      this.container_div.style.display = "none";
    }

    parent.appendChild(this.container_div);
  }

  AddTab(tab) {
    var first_tab = false;

    if (this.tabs.size == 0) {
      first_tab = true;
      this.selected = tab;
    }

    if (this.tabs.has(tab)) {
      throw Error("Tab already exists: " + tab);
    }

    var settings_div = document.createElement("div");
    settings_div.classList.add("popup_settings");
    this.tabs.set(tab, settings_div);

    if (!first_tab) {
      settings_div.style.display = "none";
    }

    var tab_selector = document.createElement("button");
    tab_selector.innerText = tab;

    tab_selector.onclick = function () {
      this.tabs.get(this.selected).style.display = "none";
      this.tabs.get(tab).style.display = "block";
      this.selected = tab;
    }.bind(this);

    this.tab_selector.appendChild(tab_selector);
    this.container_div.appendChild(settings_div);
  }

  AddSetting(tab, setting) {
    if (!this.tabs.has(tab)) {
      this.AddTab(tab);
    }

    this.tabs.get(tab).append(setting.controller);
  }

  AddSettings(tab, settings) {
    settings.forEach(x => this.AddSetting(tab, x));
  }

  AddGenericControl(tab, control) {
    if (!this.tabs.has(tab)) {
      this.AddTab(tab);
    }

    this.tabs.get(tab).append(control);
  }

  hide() {
    this.container_div.style.display = "none";
  }

  show() {
    this.container_div.style.display = "block";
  }

  toggle() {
    if (this.container_div.style.display == "none") {
      this.show();
      return true;
    } else {
      this.hide();
      return false;
    }
  }

}

exports.SettingsPanel = SettingsPanel;

},{"./number_renderer":4}]},{},[2]);
