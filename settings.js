import { RenderModes } from "./number_renderer";
class BaseSetting {
    static INVALIDATE_RENDER_CACHE = true;
    static DO_NOT_INVALIDATE_CACHE = false;
    parent_settings;
    invalidate_render_cache;
    _value;
    constructor(value, invalidate_render_cache, parent_settings) {
        this._value = value;
        this.parent_settings = parent_settings;
        this.invalidate_render_cache = invalidate_render_cache;
    }
    get value() {
        return this._value;
    }
    set value(value) {
        if (this.invalidate_render_cache) {
            this.parent_settings.InvalidateRenderCache();
        }
        this._value = value;
    }
}
export class MinMaxSetting extends BaseSetting {
    min;
    max;
    delta = 1;
    constructor(min, max, default_value, invalidate_render_cache, settings, delta = 1) {
        super(default_value, invalidate_render_cache, settings);
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
export class BooleanSetting extends BaseSetting {
    constructor(value, invalidate_render_cache, settings) {
        super(value, invalidate_render_cache, settings);
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
export class ArraySetting extends MinMaxSetting {
    values;
    constructor(default_index, values, invalidate_render_cache, settings) {
        super(0, values.length - 1, default_index, invalidate_render_cache, settings);
        this.values = values;
    }
    get t_value() {
        return this.values[this.value];
    }
}
export class Settings {
    render_cache_invalidated = false;
    parent_canvas_reference;
    bgColor = [0, 0, 0];
    baseColors = new Map([
        ["0", [50, 50, 50]],
        ["1", [128, 0, 0]],
        ["2", [0, 128, 0]],
        ["3", [128, 128, 0]],
        ["4", [0, 0, 128]],
        ["5", [128, 0, 128]],
        ["6", [0, 0, 128]],
        ["7", [128, 128, 128]],
        ["8", [200, 200, 200]],
        ["9", [200, 0, 0]],
        ["a", [0, 200, 0]],
        ["b", [200, 200, 0]],
        ["c", [0, 0, 200]],
        ["d", [200, 0, 200]],
        ["e", [0, 0, 200]],
        ["f", [255, 255, 255]], // F
    ]);
    base = new MinMaxSetting(2, 16, 6, BaseSetting.INVALIDATE_RENDER_CACHE, this);
    render_mode = new ArraySetting(0, RenderModes(), BaseSetting.INVALIDATE_RENDER_CACHE, this);
    block_size = new MinMaxSetting(1, 20, 3, BaseSetting.INVALIDATE_RENDER_CACHE, this);
    run = new BooleanSetting(true, BaseSetting.DO_NOT_INVALIDATE_CACHE, this);
    reverse = new BooleanSetting(true, BaseSetting.INVALIDATE_RENDER_CACHE, this);
    CheckCacheInvalidation() {
        if (this.render_cache_invalidated) {
            console.log("Render Cache Invalidated!");
            this.render_cache_invalidated = false;
            return true;
        }
        return false;
    }
    InvalidateRenderCache() {
        this.render_cache_invalidated = true;
    }
    constructor() { }
    // Add values to PreProcessCacheHash() if they affect the output of the number.
    // e.g. Reversing the number and it's base affects this, where as the view mode or size do not.
    PreProcessCacheHash() {
        return this.base.value.toString() + (this.reverse.value ? "r" : "n");
    }
}
export class Key {
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
export class MinMaxKeyboardAdjuster {
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
            }
            else if (this.incKey.matches(event)) {
                this.setting.increment();
            }
        }.bind(this));
    }
}
export class BooleanKeyboardAdjuster {
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
export class SettingsPannel {
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
        }
        else {
            this.hide();
            return false;
        }
    }
}
//# sourceMappingURL=settings.js.map