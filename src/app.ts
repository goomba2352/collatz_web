import Denque from "denque";
import { Drawing } from "./drawing.js";
import { parsebigint } from "./number_utils.js";
import { BaseSetting, KeyboardControls, Settings, SettingsPanel } from "./settings.js";
import { RenderMode, SpiralView } from "./number_renderer.js";

class Runner {
  version: String = "0.0.3 alpha";
  container: HTMLDivElement;
  error_box: HTMLDivElement;
  main_canvas: MainCanvas;
  settings: Settings;
  settings_panel: SettingsPanel;
  keyboard_controls: KeyboardControls;

  constructor() {
    // Create container and canvas:
    this.container = document.createElement("div");
    this.container.classList.add("canvas-container");
    var canvas: HTMLCanvasElement = document.createElement("canvas");
    this.container.appendChild(canvas);
    canvas.tabIndex = 1;
    this.settings = new Settings(canvas);

    this.error_box = document.createElement("div");
    this.error_box.classList.add("error-box");
    this.error_box.style.display = "none";
    this.container.appendChild(this.error_box);

    this.main_canvas = new MainCanvas(this.settings, this.error_box, canvas, this.container);
    document.body.appendChild(this.container);
    var recompile: (string) => void = function (t: string) {
      this.main_canvas.step_operator.Recompile(this.settings.GetStringOperations());
    }.bind(this);

    // Init settings and keyboard controls:
    this.settings_panel = new SettingsPanel(this.container);
    var renderer_tab : string = "Renderer";
    var render_settings: BaseSetting<any>[] = [];
    render_settings.push(this.settings.reverse);
    render_settings.push(this.settings.run);
    render_settings.push(this.settings.base);
    render_settings.push(this.settings.block_size);
    render_settings.push(this.settings.render_mode);
    this.settings_panel.AddSettings(renderer_tab, render_settings);

    var colors_tab: string = "Colors";
    var color_settings: BaseSetting<any>[] = [];
    color_settings.push(...this.settings.baseColors.values());
    color_settings.push(this.settings.bgColor);
    this.settings_panel.AddSettings(colors_tab, color_settings);
    
    var x_mods_tab: string = "x Mods"
    var mod_settings : BaseSetting<any>[] = []
    mod_settings.push(this.settings.mods);
    mod_settings.push(...this.settings.operations);
    this.settings_panel.AddSettings(x_mods_tab, mod_settings);
    var x_mods_div = this.settings_panel.tabs.get(x_mods_tab);

    this.settings.operations.forEach((x) => x.AddListner(recompile));
    this.settings.mods.AddListner(
      function (value: number): void {
        var value: number;
        var old_operations: BaseSetting<string>[] =
          this.settings.ConstructDefaultOperationsAndGetOldOperations(value);
        for (var i = 0; i < this.settings.operations.length; i++) {
            x_mods_div.insertBefore(
            this.settings.operations[i].controller,
            old_operations[0].controller
          );
          this.settings.operations[i].AddListner(recompile);
        }
        old_operations.forEach((x) => x.destruct());
        recompile(value.toString());
      }.bind(this)
    );

    this.keyboard_controls = new KeyboardControls(this.settings, canvas);

    globalThis.main_canvas = this.main_canvas;
    globalThis.parsebigint = parsebigint;

    var seed_input: HTMLInputElement = document.getElementById("initial_value") as HTMLInputElement;
    seed_input.addEventListener(
      "keyup",
      function (event) {
        if (event.keyCode === 13) {
          // Enter
          event.preventDefault();
          seed_button.click();
        }
      }.bind(this)
    );

    // Set up seed button
    var seed_button: HTMLButtonElement = document.getElementById("restart") as HTMLButtonElement;
    seed_button.onclick = function () {
      try {
        this.main_canvas.RestartWith(eval(seed_input.value) as bigint);
        this.main_canvas.ClearError("Seed Input");
      } catch (e) {
        this.main_canvas.ShowError("Seed Input", e.toString());
      }
    }.bind(this);
    var more_button: HTMLButtonElement = document.getElementById("more") as HTMLButtonElement;
    more_button.onclick = function () {
      more_button.innerText = this.settings_panel.toggle() ? "Less" : "More";
    }.bind(this);
    console.log("Initialzed app, v. " + this.version);
  }
}

class HistoryElement {
  number: bigint;
  cached_string: string = null;
  op: number;
  bitmap: HTMLCanvasElement;
  cache_hash: string = null;

  constructor(settings: Settings, number: bigint, op: number) {
    this.number = number;
    this.op = op;
    this.bitmap = document.createElement("canvas");
    this.Update(settings, true, settings.PreProcessCacheHash());
  }

  Update(settings: Settings, redraw: boolean, cache_hash: string): void {
    var render_mode: RenderMode = settings.render_mode.t_value;
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
  history: Denque<HistoryElement>;

  constructor() {
    this.history = new Denque<HistoryElement>();
  }

  Add(elem: HistoryElement): void {
    this.history.push(elem);
  }

  TrimDown(max_elems: number): void {
    max_elems = Math.floor(max_elems);
    if (this.history.size() > max_elems) {
      this.history.remove(0, this.history.size() - max_elems);
    }
  }

  RestartAndSeed(settings: Settings, seed: bigint) {
    this.history.clear();
    this.history.push(new HistoryElement(settings, seed, -1));
  }

  get current(): HistoryElement {
    return this.history.peekBack();
  }

  get all(): Denque<HistoryElement> {
    return this.history;
  }

  get length(): number {
    return this.history.length;
  }
}

class DataViewer {
  settings: Settings;
  constructor(settings: Settings) {
    this.settings = settings;
  }

  draw(
    x: number,
    y: number,
    width: number,
    height: number,
    render_context: CanvasRenderingContext2D,
    history: History
  ) {
    var redraw: boolean = this.settings.CheckCacheInvalidation();
    // background
    Drawing.FillRect(render_context, x, y, width, height, this.settings.bgColor.value);
    var cache_hash: string = this.settings.PreProcessCacheHash();
    for (var i = 0; i < history.all.length; i++) {
      var history_element: HistoryElement = history.all.peekAt(i);
      history_element.Update(this.settings, redraw, cache_hash);
    }
    if (this.settings.render_mode.t_value.is_history_view_type) {
      this.HistoryView(render_context, history);
    } else {
      this.LatestNumberView(render_context, history);
    }
  }

  LatestNumberView(render_context: CanvasRenderingContext2D, history: History): void {
    if (history.length >= 1) {
      this.settings.render_mode.t_value.Render(
        history.current.cached_string,
        this.settings,
        render_context
      );
    }
  }

  HistoryView(render_context: CanvasRenderingContext2D, history: History): void {
    for (var i: number = -1; i >= -history.length; i--) {
      var history_element: HistoryElement = history.all.peekAt(i);
      var render_y: number = render_context.canvas.height + this.settings.block_size.value * i;
      render_context.drawImage(history_element.bitmap, 0, render_y);
    }
  }
}

class StepOperator {
  operations: ((x: bigint) => bigint)[];
  mod: bigint;
  main_canvas: MainCanvas;

  static THIS_ERROR_SOURCE: string = "Operation Compiler";

  Recompile(operations: string[]): void {
    var op = 0;
    try {
      var compiled: ((x: bigint) => bigint)[] = [];
      for (op = 0; op < operations.length; op++) {
        var c = new Function("x", '"use strict"; return ' + operations[op]) as (
          x: bigint
        ) => bigint;
        compiled.push(c);
      }
    } catch (e) {
      this.main_canvas.ShowError(
        StepOperator.THIS_ERROR_SOURCE,
        "Compilation for mod[" + op + "] failed: " + e.toString()
      );
      return;
    }
    this.main_canvas.ClearError(StepOperator.THIS_ERROR_SOURCE);
    this.mod = BigInt(compiled.length);
    console.log("Compiled " + compiled.length + " operations");
    this.operations = compiled;
  }

  static Compile(operations: string[], main_canvas: MainCanvas): StepOperator {
    var compiled: ((x: bigint) => bigint)[] = [];
    for (var op = 0; op < operations.length; op++) {
      var c = new Function("x", '"use strict"; return ' + operations[op]) as (x: bigint) => bigint;
      compiled.push(c);
    }
    return new StepOperator(compiled, main_canvas);
  }

  constructor(operations: ((x: bigint) => bigint)[], main_canvas: MainCanvas) {
    this.main_canvas = main_canvas;
    this.operations = operations;
    this.mod = BigInt(operations.length);
  }
  Next(settings: Settings, current: HistoryElement): HistoryElement {
    var mod_result: bigint = current.number % this.mod;
    var mod_result_n: number = Number(mod_result);
    var next: bigint = this.operations[Number(mod_result_n)](current.number);
    return new HistoryElement(settings, next, mod_result_n);
  }
}

class MainCanvas {
  container: HTMLDivElement;
  error_box: HTMLDivElement;
  canvas: HTMLCanvasElement;
  data_viewer: DataViewer;
  history: History;
  p_width: number;
  p_height: number;
  settings: Settings;
  step_operator: StepOperator;
  errors: Map<String, [String, any]> = new Map();

  static THIS_ERROR_SOURCE: string = "Animation Runner";

  constructor(
    settings: Settings,
    error_box: HTMLDivElement,
    canvas: HTMLCanvasElement,
    container: HTMLDivElement
  ) {
    this.settings = settings;
    this.error_box = error_box;
    this.canvas = canvas;
    this.container = container;
    this.data_viewer = new DataViewer(settings);
    this.history = new History();
    this.step_operator = StepOperator.Compile(this.settings.GetStringOperations(), this);
    window.requestAnimationFrame(this.Draw.bind(this));
  }

  ShowError(source: string, message: string, stack: any = null): void {
    console.error("Exception from [" + source + "]:\n" + message);
    if (stack != null) {
      console.error("Stack trace: ");
      console.error(stack);
    }
      
    this.errors.set(source, [message, stack]);
  }

  ClearError(source: string): void {
    if (this.errors.has(source)) {
      this.errors.delete(source);
    }
  }

  RestartWith(starting_number: bigint): void {
    this.history.RestartAndSeed(this.settings, starting_number);
  }

  Draw() {
    try {
      var new_error: boolean = false;
      var context: CanvasRenderingContext2D = this.canvas.getContext("2d");
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
        this.history.TrimDown((this.canvas.height / this.settings.block_size.value) * 2);
      }
      this.ClearError(MainCanvas.THIS_ERROR_SOURCE);
    } catch (e) {
      if (!this.errors.has(MainCanvas.THIS_ERROR_SOURCE)) {
        this.ShowError(MainCanvas.THIS_ERROR_SOURCE, e.toString(), e.stack);
      }
    } finally {
      window.requestAnimationFrame(this.Draw.bind(this));
      var text: string = "";
      if (this.errors.size == 0) {
        this.error_box.style.display = "none";
      } else {
        this.error_box.style.display = "block";
        this.errors.forEach(
          (message, source) => (text += "Exception from [" + source + "]:\n" + message)
        );
        this.error_box.innerText = text;
      }
    }
  }
}

window.onload = function () {
  try {
    var runner: Runner = new Runner();
  } catch (e) {
    var error: HTMLDivElement = document.createElement("div");
    error.classList.add("perma-error-box");
    error.innerText = "A permenant error has occured:\n" + e.toString();
    document.body.appendChild(error);
    throw e;
  }
  globalThis.runner = runner;
};
