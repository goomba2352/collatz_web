let BaseSetting = /** @class */ (() => {
    class BaseSetting {
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
                console.log("Render Cache Invalidated!");
                this.cache_invalidated = false;
                return true;
            }
            return false;
        }
    }
    BaseSetting.INVALIDATE_RENDER_CACHE = true;
    BaseSetting.DO_NOT_INVALIDATE_CACHE = false;
    BaseSetting.cache_invalidated = false;
    return BaseSetting;
})();
export function CheckIfRenderCacheInvalidatedAndReset() {
    return BaseSetting.CheckCacheInvalidation();
}
export function InvalidateRenderCache() {
    BaseSetting.cache_invalidated = true;
}
export class MinMaxSetting extends BaseSetting {
    constructor(min, max, default_value, invalidate_render_cache, delta = 1) {
        super(default_value, invalidate_render_cache);
        this.delta = 1;
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
let Settings = /** @class */ (() => {
    class Settings {
        constructor() { }
        static CacheHash() {
            return Settings.base.value.toString() + (Settings.reverse.value ? "r" : "n");
        }
    }
    Settings.bgColor = [0, 0, 0];
    Settings.baseColors = new Map([
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
        ["f", [255, 255, 255]],
    ]);
    Settings.base = new MinMaxSetting(2, 16, 6, BaseSetting.INVALIDATE_RENDER_CACHE);
    Settings.render_mode = new MinMaxSetting(0, 1, 1, true);
    Settings.block_size = new MinMaxSetting(1, 20, 3, BaseSetting.INVALIDATE_RENDER_CACHE);
    Settings.run = new BooleanSetting(true, BaseSetting.DO_NOT_INVALIDATE_CACHE);
    Settings.reverse = new BooleanSetting(true, BaseSetting.INVALIDATE_RENDER_CACHE);
    return Settings;
})();
export { Settings };
export class Key {
    constructor(key) {
        this.ctrl = false;
        this.shift = false;
        this.key = null;
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