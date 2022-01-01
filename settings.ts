class BaseSetting<T> {
  static INVALIDATE_RENDER_CACHE: boolean = true;
  static DO_NOT_INVALIDATE_CACHE: boolean = false;

  private invalidate_render_cache: boolean;
  private _value: T;
  static cache_invalidated: boolean = false;

  constructor(value: T, invalidate_render_cache: boolean) {
    this._value = value;
    this.invalidate_render_cache = invalidate_render_cache;
  }

  get value(): T {
    return this._value;
  }

  set value(value: T) {
    if (this.invalidate_render_cache) {
      BaseSetting.cache_invalidated = true;
    }
    this._value = value;
  }

  static CheckCacheInvalidation(): boolean {
    if (this.cache_invalidated) {
      console.log("Render Cache Invalidated!");
      this.cache_invalidated = false;
      return true;
    }
    return false;
  }
}

export function CheckIfRenderCacheInvalidatedAndReset(): boolean {
  return BaseSetting.CheckCacheInvalidation();
}

export function InvalidateRenderCache(): void {
  BaseSetting.cache_invalidated = true;
}

export class MinMaxSetting extends BaseSetting<number> {
  private min: number;
  private max: number;
  private delta: number = 1;

  constructor(
    min: number,
    max: number,
    default_value: number,
    invalidate_render_cache: boolean,
    delta: number = 1
  ) {
    super(default_value, invalidate_render_cache);
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
}

export class BooleanSetting extends BaseSetting<boolean> {
  constructor(value: boolean, invalidate_render_cache: boolean) {
    super(value, invalidate_render_cache);
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
}

export class Settings {
  static bgColor: [number, number, number] = [0, 0, 0];
  static baseColors: Map<String, [number, number, number]> = new Map([
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
  static base: MinMaxSetting = new MinMaxSetting(2, 16, 6, BaseSetting.INVALIDATE_RENDER_CACHE);
  static render_mode: MinMaxSetting = new MinMaxSetting(0, 1, 1, true);
  static block_size: MinMaxSetting = new MinMaxSetting(
    1,
    20,
    3,
    BaseSetting.INVALIDATE_RENDER_CACHE
  );
  static run: BooleanSetting = new BooleanSetting(true, BaseSetting.DO_NOT_INVALIDATE_CACHE);
  static reverse : BooleanSetting = new BooleanSetting(true, BaseSetting.INVALIDATE_RENDER_CACHE);

  private constructor() {}

  static CacheHash() : string {
    return Settings.base.value.toString() + (Settings.reverse.value ? "r" : "n");
  }
}

export class Key {
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

export class MinMaxKeyboardAdjuster {
  setting: MinMaxSetting;
  decKey: Key;
  incKey: Key;

  constructor(setting: MinMaxSetting, decKey: Key, incKey: Key) {
    this.setting = setting;
    this.decKey = decKey;
    this.incKey = incKey;
    document.addEventListener(
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

export class BooleanKeyboardAdjuster {
  setting: BooleanSetting;
  key: Key;
  invalidate_render_cache: boolean;

  constructor(setting: BooleanSetting, key: Key) {
    this.setting = setting;
    this.key = key;
    document.addEventListener(
      "keydown",
      function (event: KeyboardEvent) {
        if (this.key.matches(event)) {
          this.setting.toggle();
        }
      }.bind(this)
    );
  }
}

export class SettingsPannel {
  settings_div: HTMLDivElement;
  constructor(hidden: boolean = true) {
    this.settings_div = document.createElement("div");
    this.settings_div.classList.add("popup_settings");
    document.body.append(this.settings_div);
    if (hidden) {
      this.settings_div.style.display = "none";
    }
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
