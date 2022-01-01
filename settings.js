import { RenderModes } from "./number_renderer";
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
    constructor(name, value, invalidate_render_cache, parent_settings) {
        this.name = name;
        this._value = value;
        this.parent_settings = parent_settings;
        this.invalidate_render_cache = invalidate_render_cache;
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
    }
}
export class MinMaxSetting extends BaseSetting {
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
        var input = document.createElement("input");
        input.type = "range";
        input.id = NewGlobalId();
        input.min = this.min.toString();
        input.max = this.max.toString();
        input.step = this.delta.toString();
        input.value = this.value.toString();
        input.addEventListener("change", function () {
            this.value = input.value;
        }.bind(this));
        div.appendChild(input);
        var label = document.createElement("label");
        label.innerText = this.name;
        label.htmlFor = input.id;
        div.appendChild(label);
        return div;
    }
    UpdateController() {
        var input = this.controller.childNodes[0];
        input.value = this.value.toString();
    }
}
export class BooleanSetting extends BaseSetting {
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
export class ArraySetting extends MinMaxSetting {
    values;
    constructor(name, default_index, values, invalidate_render_cache, settings) {
        super(name, 0, values.length - 1, default_index, invalidate_render_cache, settings);
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
    base = new MinMaxSetting("base", 2, 16, 6, BaseSetting.INVALIDATE_RENDER_CACHE, this);
    render_mode = new ArraySetting("renderer", 1, RenderModes(), BaseSetting.INVALIDATE_RENDER_CACHE, this);
    block_size = new MinMaxSetting("scale", 1, 20, 3, BaseSetting.INVALIDATE_RENDER_CACHE, this);
    run = new BooleanSetting("Run/pause", true, BaseSetting.DO_NOT_INVALIDATE_CACHE, this);
    reverse = new BooleanSetting("Reverse", true, BaseSetting.INVALIDATE_RENDER_CACHE, this);
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
export class SettingsPanel {
    settings_div;
    constructor(settings, hidden = true) {
        this.settings_div = document.createElement("div");
        this.settings_div.classList.add("popup_settings");
        document.body.append(this.settings_div);
        if (hidden) {
            this.settings_div.style.display = "none";
        }
        this.settings_div.appendChild(settings.reverse.controller);
        this.settings_div.appendChild(settings.run.controller);
        this.settings_div.appendChild(settings.base.controller);
        this.settings_div.appendChild(settings.block_size.controller);
        this.settings_div.appendChild(settings.render_mode.controller);
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