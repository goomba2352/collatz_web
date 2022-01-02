import { RenderMode } from "./number_renderer";

var globalId = -1;
function NewGlobalId(): string {
  globalId++;
  return "gId" + globalId;
}

abstract class BaseSetting<T> {
  name: string;
  static INVALIDATE_RENDER_CACHE: boolean = true;
  static DO_NOT_INVALIDATE_CACHE: boolean = false;
  parent_settings: Settings;
  private _controller: HTMLElement = null;

  private invalidate_render_cache: boolean;
  private _value: T;

  constructor(name: string, value: T, invalidate_render_cache: boolean, parent_settings: Settings) {
    this.name = name;
    this._value = value;
    this.parent_settings = parent_settings;
    this.invalidate_render_cache = invalidate_render_cache;
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
        this.value = input.value;
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
    var input: HTMLInputElement = this.controller.childNodes[0] as HTMLInputElement;
    input.value = this.value.toString();
    var label : HTMLLabelElement = this.controller.childNodes[1] as HTMLLabelElement;
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

export class Settings {
  private render_cache_invalidated: boolean = false;
  private _main_canvas: HTMLCanvasElement;
  
  get main_canvas() : HTMLCanvasElement {
    return this._main_canvas;
  }

  
  constructor(main_canvas: HTMLCanvasElement) {
    this._main_canvas = main_canvas;
  }

  // Actual settings:
  bgColor: [number, number, number] = [0, 0, 0];
  baseColors: Map<String, [number, number, number]> = new Map([
    ["0", [50, 50, 50]], //    0
    ["1", [128, 0, 0]], //     1
    ["2", [0, 128, 0]], //     2
    ["3", [128, 128, 0]], //   3
    ["4", [0, 0, 128]], //     4
    ["5", [128, 0, 128]], //   5
    ["6", [0, 0, 128]], //     6
    ["7", [128, 128, 128]], // 7
    ["8", [200, 200, 200]], // 8
    ["9", [200, 0, 0]], //     9
    ["a", [0, 200, 0]], //     A
    ["b", [200, 200, 0]], //   B
    ["c", [0, 0, 200]], //     C
    ["d", [200, 0, 200]], //   D
    ["e", [0, 0, 200]], //     E
    ["f", [255, 255, 255]], // F
  ]);
  base: MinMaxSetting = new MinMaxSetting(
    "base",
    2,
    16,
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
  settings_div: HTMLDivElement;
  constructor(settings: Settings, parent: HTMLElement, hidden: boolean = true) {
    this.settings_div = document.createElement("div");
    this.settings_div.classList.add("popup_settings");
    parent.appendChild(this.settings_div);
    if (hidden) {
      this.settings_div.style.display = "none";
    }
    this.settings_div.appendChild(settings.reverse.controller);
    this.settings_div.appendChild(settings.run.controller);
    this.settings_div.appendChild(settings.base.controller);
    this.settings_div.appendChild(settings.block_size.controller);
    this.settings_div.appendChild(settings.render_mode.controller);
  }

  hide(): void {
    this.settings_div.style.display = "none";
  }

  show(): void {
    this.settings_div.style.display = "block";
  }

  toggle(): boolean {
    if (this.settings_div.style.display == "none") {
      this.show();
      return true;
    } else {
      this.hide();
      return false;
    }
  }
}
