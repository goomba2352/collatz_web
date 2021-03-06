import { RenderMode } from "./number_renderer";

var globalId = -1;
function NewGlobalId(): string {
  globalId++;
  return "gId" + globalId;
}

export abstract class BaseSetting<T> {
  name: string;
  static INVALIDATE_RENDER_CACHE: boolean = true;
  static DO_NOT_INVALIDATE_CACHE: boolean = false;
  parent_settings: Settings;
  private _controller: HTMLElement = null;

  private invalidate_render_cache: boolean;
  private _value: T;
  private listeners: ((T) => void)[] = [];

  constructor(name: string, value: T, invalidate_render_cache: boolean, parent_settings: Settings) {
    this.name = name;
    this._value = value;
    this.parent_settings = parent_settings;
    this.invalidate_render_cache = invalidate_render_cache;
  }

  AddListner(f: (T) => void, call_immediately: boolean = false) {
    this.listeners.push(f);
    if (call_immediately) {
      f(this.value);
    }
  }

  get value(): T {
    return this._value;
  }

  get controller(): HTMLElement {
    if (this._controller == null) {
      this._controller = this.ControllerConstructor();
    }
    return this._controller;
  }

  set value(value: T) {
    if (this.invalidate_render_cache) {
      this.parent_settings.InvalidateRenderCache();
    }
    this._value = value;
    this.UpdateController();
    for (var i = 0; i < this.listeners.length; i++) {
      this.listeners[i](value);
    }
  }

  destruct(): void {
    if (this.controller != null) {
      this.controller.remove();
    }
  }

  protected abstract UpdateController(): void;

  protected abstract ControllerConstructor(): HTMLElement;
}

class MinMaxSetting extends BaseSetting<number> {
  private min: number;
  private max: number;
  private delta: number = 1;

  constructor(
    name: string,
    min: number,
    max: number,
    default_value: number,
    invalidate_render_cache: boolean,
    settings: Settings,
    delta: number = 1
  ) {
    super(name, default_value, invalidate_render_cache, settings);
    this.min = min;
    this.max = max;
    this.delta = delta;
  }

  increment(): void {
    if (this.value == this.max) {
      return;
    }
    this.value += this.delta;
    if (this.value > this.max) {
      this.value = this.max;
    }
  }

  decrement(): void {
    if (this.value == this.min) {
      return;
    }
    this.value -= this.delta;
    if (this.value < this.min) {
      this.value = this.min;
    }
  }

  ControllerConstructor(): HTMLElement {
    var div: HTMLDivElement = document.createElement("div");
    var minus_button: HTMLButtonElement = document.createElement("button");
    minus_button.innerText = "-";
    minus_button.onclick = function () {
      this.decrement();
    }.bind(this);
    div.appendChild(minus_button);
    var plus_button: HTMLButtonElement = document.createElement("button");
    plus_button.innerText = "+";
    div.appendChild(plus_button);
    plus_button.onclick = function () {
      this.increment();
    }.bind(this);
    var input: HTMLInputElement = document.createElement("input");
    input.type = "range";
    input.id = NewGlobalId();
    input.min = this.min.toString();
    input.max = this.max.toString();
    input.step = this.delta.toString();
    input.value = this.value.toString();
    input.addEventListener(
      "change",
      function () {
        this.value = parseInt(input.value);
      }.bind(this)
    );
    div.appendChild(input);
    var label: HTMLLabelElement = document.createElement("label");
    label.innerText = this.name + "=" + this.value;
    label.htmlFor = input.id;
    div.appendChild(label);
    return div;
  }

  UpdateController(): void {
    var input: HTMLInputElement = this.controller.childNodes[2] as HTMLInputElement;
    input.value = this.value.toString();
    var label: HTMLLabelElement = this.controller.childNodes[3] as HTMLLabelElement;
    label.innerText = this.name + "=" + this.value;
  }
}

class BooleanSetting extends BaseSetting<boolean> {
  constructor(name: string, value: boolean, invalidate_render_cache: boolean, settings: Settings) {
    super(name, value, invalidate_render_cache, settings);
  }

  on(): void {
    this.value = true;
  }

  off(): void {
    this.value = false;
  }

  toggle(): void {
    this.value = !this.value;
  }

  ControllerConstructor(): HTMLElement {
    var div: HTMLDivElement = document.createElement("div");
    var cb: HTMLInputElement = document.createElement("input");
    cb.type = "checkbox";
    cb.name = this.name;
    cb.id = NewGlobalId();
    cb.classList.add("checkbox");
    cb.checked = this.value;
    cb.addEventListener(
      "change",
      function () {
        this.value = cb.checked;
      }.bind(this)
    );
    div.appendChild(cb);
    var label: HTMLLabelElement = document.createElement("label");
    label.innerText = this.name;
    label.htmlFor = cb.id;
    div.appendChild(label);
    return div;
  }

  protected UpdateController(): void {
    var div = this.controller as HTMLDivElement;
    var cb = div.childNodes[0] as HTMLInputElement;
    cb.checked = this.value;
  }
}

class ArraySetting<T> extends MinMaxSetting {
  values: T[];
  constructor(
    name: string,
    default_index: number,
    values: T[],
    invalidate_render_cache: boolean,
    settings: Settings
  ) {
    super(name, 0, values.length - 1, default_index, invalidate_render_cache, settings);
    this.values = values;
  }

  get t_value(): T {
    return this.values[this.value];
  }
}

class StringSetting extends BaseSetting<string> {
  constructor(name: string, value: string, invalidate_render_cache: boolean, settings: Settings) {
    super(name, value, invalidate_render_cache, settings);
  }

  protected UpdateController(): void {
    var input: HTMLInputElement = this.controller.childNodes[0] as HTMLInputElement;
    input.value = this.value;
  }

  protected ControllerConstructor(): HTMLElement {
    var div: HTMLDivElement = document.createElement("div");
    var text: HTMLInputElement = document.createElement("input");
    text.name = this.name;
    text.value = this.value;
    text.id = NewGlobalId();
    div.appendChild(text);
    var button: HTMLButtonElement = document.createElement("button");
    button.innerText = "Set";
    button.onclick = function () {
      this.value = text.value;
    }.bind(this);
    div.appendChild(button);
    var label: HTMLLabelElement = document.createElement("label");
    label.innerText = this.name;
    label.htmlFor = text.id;
    div.appendChild(label);
    return div;
  }
}

class ColorSetting extends BaseSetting<[number, number, number]> {
  constructor(
    name: string,
    value: [number, number, number],
    invalidate_render_cache: boolean,
    settings: Settings
  ) {
    super(name, value, invalidate_render_cache, settings);
  }

  private RgbToHex(rgb: [number, number, number]) {
    return (
      "#" +
      rgb[0].toString(16).padStart(2, "0") +
      rgb[1].toString(16).padStart(2, "0") +
      rgb[2].toString(16).padStart(2, "0")
    );
  }

  private HexToRgb(hex: string): [number, number, number] {
    var r: number, g: number, b: number;
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
  protected UpdateController(): void {
    var color: HTMLInputElement = this.controller.childNodes[0] as HTMLInputElement;
    color.value = this.RgbToHex(this.value);
  }

  protected ControllerConstructor(): HTMLElement {
    var div: HTMLDivElement = document.createElement("div");
    var color: HTMLInputElement = document.createElement("input");
    color.id = NewGlobalId();
    color.type = "color";
    color.value = this.RgbToHex(this.value);
    color.onchange = function () {
      this.value = this.HexToRgb(color.value);
    }.bind(this);
    div.appendChild(color);

    var label: HTMLLabelElement = document.createElement("label");
    label.innerText = this.name;
    label.htmlFor = color.id;
    div.appendChild(label);

    return div;
  }
}

export class ColorPresetsControl {
  // H: 0-360, S: 0-1, L: 0-1
  // Credit: https://www.30secondsofcode.org/js/s/hsl-to-rgb, modified slightly.
  HSLToRGB(hsl_color: [number,number,number]): [number, number, number] {
    var h: number = hsl_color[0];
    var s: number = hsl_color[1];
    var l: number = hsl_color[2];

    if (h < 0 || h > 360) {
      throw RangeError("h must be between 0-360, got h=" + h);
    }
    if (s < 0 || s > 1) {
      throw RangeError("s must be between 0-1, got s=" + s);
    }
    if (l < 0 || l > 1) {
      throw RangeError("l must be between 0-1, got l=" + l);
    }
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.floor(255 * f(0)), Math.floor(255 * f(8)), Math.floor(255 * f(4))];
  }

  // Credit: https://www.30secondsofcode.org/js/s/rgb-to-hsl, modified slightly
  RGBToHSL(rgb_color: [number, number, number]): [number, number, number] {
    var r:number = rgb_color[0];
    var g: number = rgb_color[1];
    var b: number = rgb_color[2];
    if (r < 0 || r > 255) {
      throw RangeError("r must be between 0-360, got h=" + r);
    }
    if (g < 0 || g > 255) {
      throw RangeError("g must be between 0-1, got s=" + g);
    }
    if (b < b || b > 255) {
      throw RangeError("b must be between 0-1, got l=" + b);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    const h = s ? (l === r ? (g - b) / s : l === g ? 2 + (b - r) / s : 4 + (r - g) / s) : 0;
    return [
      60 * h < 0 ? 60 * h + 360 : 60 * h,
      s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0,
      (2 * l - s) / 2,
    ];
  };

  GetControls(settings: Settings): HTMLElement[] {
    var row1: HTMLDivElement = document.createElement("div");
    var row2: HTMLDivElement = document.createElement("div");
    var gray_button: HTMLButtonElement = document.createElement("button");
    gray_button.innerText = "Grayscale";
    gray_button.onclick = function () {
      var base: number = settings.base.value;

      for (var i = 0; i < base; i++) {
        var color: [number, number, number] = [
          Math.floor(255 * (i / (base - 1))),
          Math.floor(255 * (i / (base - 1))),
          Math.floor(255 * (i / (base - 1))),
        ];
        settings.baseColors[i].value = color;
      }
    }.bind(this);

    var chrom_button: HTMLButtonElement = document.createElement("button");
    chrom_button.innerText = "Chromatic";
    chrom_button.onclick = function () {
      var base: number = settings.base.value;
      for (var i = 0; i < base; i++) {
        if (i < base) {
          var color = this.HSLToRGB([360 * (i / base), 0.9, 0.52]);
          settings.baseColors[i].value = color;
        } else {
          break;
        }
      }
    }.bind(this);

    var same_button: HTMLButtonElement = document.createElement("button");
    same_button.innerText = "Same";
    same_button.onclick = function () {
      var base: number = settings.base.value;
      for (var i = 1; i < base; i++) {
        if (i < base) {
          settings.baseColors[i].value = settings.baseColors[0].value;
        }
      }
    }

    var random_button: HTMLButtonElement = document.createElement("button");
    random_button.innerText = "Random";
    random_button.onclick = function () {
      var base: number = settings.base.value;
      for (var i = 0; i < base; i++) {
        if (i < base) {
          var color: [number, number, number] = [
            Math.floor(255 * Math.random()),
            Math.floor(255 * Math.random()),
            Math.floor(255 * Math.random()),
          ];
          settings.baseColors[i].value = color;
        } else {
          break;
        }
      }
    }.bind(this);

    var near_button: HTMLButtonElement = document.createElement("button");
    near_button.innerText = "Magic Gradient";
    near_button.onclick = function () {
      var base: number = settings.base.value;
      var seed_color_hsl: [number, number, number] = this.RGBToHSL(settings.baseColors[0].value);
      var h_drift: number = (Math.random()*360 - seed_color_hsl[0]) / (settings.base.value - 1);
      var s_drift: number = (Math.random() - seed_color_hsl[1]) / (settings.base.value - 1);
      var l_drift: number = (Math.random() - seed_color_hsl[2]) / (settings.base.value - 1);
      for (var i = 1; i < base; i++) {
        if (i < base) {
          var next_hsl: [number, number, number] = [
            seed_color_hsl[0] + h_drift * i,
            seed_color_hsl[1] + s_drift * i,
            seed_color_hsl[2] + l_drift * i 
          ];
          settings.baseColors[i].value = this.HSLToRGB(next_hsl);
        } else {
          break;
        }
      }
    }.bind(this);

    var near_button_circle: HTMLButtonElement = document.createElement("button");
    near_button_circle.innerText = "Magic Gradient (repeat)";
    near_button_circle.onclick = function () {
      var base: number = settings.base.value;
      var seed_color_hsl: [number, number, number] = this.RGBToHSL(settings.baseColors[0].value);
      var h_drift: number = (Math.random()*360 - seed_color_hsl[0]) / (settings.base.value - 1);
      var s_drift: number = (Math.random() - seed_color_hsl[1]) / (settings.base.value - 1);
      var l_drift: number = (Math.random() - seed_color_hsl[2]) / (settings.base.value - 1);
      for (var i = 1; i < base; i++) {
        var next_hsl: [number, number, number];
        if (i < base) {
          if (i < base / 2) {
            next_hsl = [
              seed_color_hsl[0] + h_drift * i * 2,
              seed_color_hsl[1] + s_drift * i * 2,
              seed_color_hsl[2] + l_drift * i * 2,
            ];
          } else {
            next_hsl = [
              seed_color_hsl[0] + h_drift * 2 * (base - i - 1),
              seed_color_hsl[1] + s_drift * 2 * (base - i - 1),
              seed_color_hsl[2] + l_drift * 2 * (base - i - 1),
            ];
          }
          settings.baseColors[i].value = this.HSLToRGB(next_hsl);
        } else {
          break;
        }
      }
    }.bind(this);

    row1.appendChild(gray_button);
    row1.appendChild(chrom_button);
    row1.appendChild(random_button);
    row1.appendChild(same_button);
    row2.appendChild(near_button);
    row2.appendChild(near_button_circle);
    return [row1, row2];
  }
}

export class Settings {
  private render_cache_invalidated: boolean = false;
  private _main_canvas: HTMLCanvasElement;

  get main_canvas(): HTMLCanvasElement {
    return this._main_canvas;
  }

  GetStringOperations(): string[] {
    var res: string[] = [];
    this.operations.forEach((x) => res.push(x.value));
    return res;
  }

  ConstructDefaultOperationsAndGetOldOperations(value: number): StringSetting[] {
    var new_operations: StringSetting[] = [];
    var old_operations: StringSetting[] = this.operations;
    for (var i = 0; i < value; i++) {
      var name: string = "x ??? " + value + " % " + i;

      var op_string = "";
      if (i == 0) {
        op_string = "x / " + value + "n";
      } else {
        var n_1: bigint = BigInt(value) + 1n;
        op_string = "(" + n_1 + "n * x + " + (value - i) + "n) / " + value + "n";
      }
      var op = new StringSetting(name, op_string, BaseSetting.DO_NOT_INVALIDATE_CACHE, this);
      new_operations.push(op);
    }
    this.operations = new_operations;
    return old_operations;
  }

  constructor(main_canvas: HTMLCanvasElement) {
    this._main_canvas = main_canvas;
    this.ConstructDefaultOperationsAndGetOldOperations(2);
    // Extended support for base 36, random colors
    for (var i = 0; i < 20; i++) {
      var high_color: ColorSetting = new ColorSetting(
        "x ??? n mod " + (16 + i),
        [
          Math.floor(255 * Math.random()),
          Math.floor(255 * Math.random()),
          Math.floor(255 * Math.random()),
        ],
        BaseSetting.INVALIDATE_RENDER_CACHE,
        this
      );
      this.baseColors.push(high_color);
    }
  }

  // Actual settings:
  bgColor: ColorSetting = new ColorSetting(
    "Background Color",
    [0, 0, 0],
    BaseSetting.DO_NOT_INVALIDATE_CACHE,
    this
  );
  color_shift_animator: BooleanSetting = new BooleanSetting(
    "Color Shift Animation",
    false,
    BaseSetting.INVALIDATE_RENDER_CACHE,
    this
  );
  color_shift: MinMaxSetting = new MinMaxSetting(
    "Color Shift",
    0,
    36,
    0,
    BaseSetting.INVALIDATE_RENDER_CACHE,
    this
  );

  // prettier-ignore
  baseColors: ColorSetting[]= [
    new ColorSetting("x ??? n mod 0 ", [50, 50, 50], BaseSetting.INVALIDATE_RENDER_CACHE, this),    // 0
    new ColorSetting("x ??? n mod 1 ", [128, 0, 0], BaseSetting.INVALIDATE_RENDER_CACHE, this),     // 1
    new ColorSetting("x ??? n mod 2 ", [0, 128, 0], BaseSetting.INVALIDATE_RENDER_CACHE, this),     // 2
    new ColorSetting("x ??? n mod 3 ",[128, 128, 0], BaseSetting.INVALIDATE_RENDER_CACHE, this),    // 3
    new ColorSetting("x ??? n mod 4 ",[0, 0, 128], BaseSetting.INVALIDATE_RENDER_CACHE, this),      // 4
    new ColorSetting("x ??? n mod 5 ",[128, 0, 128], BaseSetting.INVALIDATE_RENDER_CACHE, this),    // 5
    new ColorSetting("x ??? n mod 6 ",[0, 0, 128], BaseSetting.INVALIDATE_RENDER_CACHE, this),      // 6
    new ColorSetting("x ??? n mod 7 ",[128, 128, 128], BaseSetting.INVALIDATE_RENDER_CACHE, this),  // 7
    new ColorSetting("x ??? n mod 8 ", [200, 200, 200], BaseSetting.INVALIDATE_RENDER_CACHE, this), // 8
    new ColorSetting("x ??? n mod 9 ", [200, 0, 0], BaseSetting.INVALIDATE_RENDER_CACHE, this),     // 9
    new ColorSetting("x ??? n mod 10",[0, 200, 0], BaseSetting.INVALIDATE_RENDER_CACHE, this),      // A
    new ColorSetting("x ??? n mod 11",[200, 200, 0], BaseSetting.INVALIDATE_RENDER_CACHE, this),    // B
    new ColorSetting("x ??? n mod 12",[0, 0, 200], BaseSetting.INVALIDATE_RENDER_CACHE, this),      // C
    new ColorSetting("x ??? n mod 13",[200, 0, 200], BaseSetting.INVALIDATE_RENDER_CACHE, this),    // D
    new ColorSetting("x ??? n mod 14",[0, 0, 200], BaseSetting.INVALIDATE_RENDER_CACHE, this),      // E
    new ColorSetting("x ??? n mod 15",[255, 255, 255], BaseSetting.INVALIDATE_RENDER_CACHE, this),  // F
  ];
  base: MinMaxSetting = new MinMaxSetting(
    "base",
    2,
    36,
    6,
    BaseSetting.INVALIDATE_RENDER_CACHE,
    this
  );
  render_mode: ArraySetting<RenderMode> = new ArraySetting(
    "renderer",
    1,
    RenderMode.RegisteredModes(),
    BaseSetting.INVALIDATE_RENDER_CACHE,
    this
  );
  block_size: MinMaxSetting = new MinMaxSetting(
    "scale",
    1,
    20,
    3,
    BaseSetting.INVALIDATE_RENDER_CACHE,
    this
  );
  run: BooleanSetting = new BooleanSetting(
    "Run/pause",
    true,
    BaseSetting.DO_NOT_INVALIDATE_CACHE,
    this
  );
  reverse: BooleanSetting = new BooleanSetting(
    "Reverse",
    true,
    BaseSetting.INVALIDATE_RENDER_CACHE,
    this
  );
  operations: StringSetting[] = [];
  mods: MinMaxSetting = new MinMaxSetting(
    "mods",
    2,
    36,
    2,
    BaseSetting.DO_NOT_INVALIDATE_CACHE,
    this
  );

  CheckCacheInvalidation(): boolean {
    if (this.render_cache_invalidated) {
      this.render_cache_invalidated = false;
      return true;
    }
    return false;
  }

  InvalidateRenderCache(): void {
    this.render_cache_invalidated = true;
  }

  // Add values to PreProcessCacheHash() if they affect the output of the number.
  // e.g. Reversing the number and it's base affects this, where as the view mode or size do not.
  PreProcessCacheHash(): string {
    return this.base.value.toString() + (this.reverse.value ? "r" : "n");
  }
}

class Key {
  ctrl: boolean = false;
  shift: boolean = false;
  key: string = null;

  private constructor(key: string) {
    this.key = key;
  }

  static of(key: string): Key {
    return new Key(key);
  }

  andCtrl(): Key {
    this.ctrl = true;
    return this;
  }

  andShift(): Key {
    this.shift = true;
    return this;
  }

  matches(event: KeyboardEvent): boolean {
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
  setting: MinMaxSetting;
  decKey: Key;
  incKey: Key;

  constructor(setting: MinMaxSetting, decKey: Key, incKey: Key, parent: HTMLElement) {
    this.setting = setting;
    this.decKey = decKey;
    this.incKey = incKey;
    parent.addEventListener(
      "keydown",
      function (event: KeyboardEvent) {
        if (this.decKey.matches(event)) {
          this.setting.decrement();
        } else if (this.incKey.matches(event)) {
          this.setting.increment();
        }
      }.bind(this)
    );
  }
}

class BooleanKeyboardAdjuster {
  setting: BooleanSetting;
  key: Key;
  invalidate_render_cache: boolean;

  constructor(setting: BooleanSetting, key: Key, parent: HTMLElement) {
    this.setting = setting;
    this.key = key;
    parent.addEventListener(
      "keydown",
      function (event: KeyboardEvent) {
        if (this.key.matches(event)) {
          this.setting.toggle();
        }
      }.bind(this)
    );
  }
}

export class KeyboardControls {
  block_size: MinMaxKeyboardAdjuster;
  base: MinMaxKeyboardAdjuster;
  render_mode: MinMaxKeyboardAdjuster;
  pause: BooleanKeyboardAdjuster;
  reverse: BooleanKeyboardAdjuster;

  constructor(settings: Settings, parent: HTMLElement) {
    this.block_size = new MinMaxKeyboardAdjuster(
      settings.block_size,
      Key.of("z"),
      Key.of("x"),
      parent
    );
    this.base = new MinMaxKeyboardAdjuster(settings.base, Key.of("a"), Key.of("s"), parent);
    this.render_mode = new MinMaxKeyboardAdjuster(
      settings.render_mode,
      Key.of(","),
      Key.of("."),
      parent
    );
    this.pause = new BooleanKeyboardAdjuster(settings.run, Key.of(" "), parent);
    this.reverse = new BooleanKeyboardAdjuster(settings.reverse, Key.of("r"), parent);
  }
}

export class SettingsPanel {
  tab_selector: HTMLDivElement;
  container_div: HTMLDivElement;
  tabs: Map<string, HTMLDivElement>;
  selected: string;

  constructor(parent: HTMLElement, hidden: boolean = true) {
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

  private AddTab(tab: string): void {
    var first_tab: boolean = false;
    if (this.tabs.size == 0) {
      first_tab = true;
      this.selected = tab;
    }
    if (this.tabs.has(tab)) {
      throw Error("Tab already exists: " + tab);
    }
    var settings_div: HTMLDivElement = document.createElement("div");
    settings_div.classList.add("popup_settings");
    this.tabs.set(tab, settings_div);
    if (!first_tab) {
      settings_div.style.display = "none";
    }
    var tab_selector: HTMLButtonElement = document.createElement("button");
    tab_selector.innerText = tab;
    tab_selector.onclick = function () {
      this.tabs.get(this.selected).style.display = "none";
      this.tabs.get(tab).style.display = "block";
      this.selected = tab;
    }.bind(this);
    this.tab_selector.appendChild(tab_selector);
    this.container_div.appendChild(settings_div);
  }

  AddSetting(tab: string, setting: BaseSetting<any>) {
    if (!this.tabs.has(tab)) {
      this.AddTab(tab);
    }
    this.tabs.get(tab).append(setting.controller);
  }

  AddSettings(tab: string, settings: BaseSetting<any>[]): void {
    settings.forEach((x) => this.AddSetting(tab, x));
  }

  AddGenericControl(tab: string, controls: HTMLElement[]) {
    if (!this.tabs.has(tab)) {
      this.AddTab(tab);
    }
    controls.forEach(x => this.tabs.get(tab).append(x));
  }

  hide(): void {
    this.container_div.style.display = "none";
  }

  show(): void {
    this.container_div.style.display = "block";
  }

  toggle(): boolean {
    if (this.container_div.style.display == "none") {
      this.show();
      return true;
    } else {
      this.hide();
      return false;
    }
  }
}
