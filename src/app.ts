import Denque from "denque";
import { Drawing } from "./drawing.js";
import { parsebigint } from "./number_utils.js";
import { KeyboardControls, Settings, SettingsPanel } from "./settings.js";
import {RenderMode, SpiralView} from "./number_renderer.js";

class Runner {
  version: String = "0.0.3 alpha";
  container: HTMLDivElement;
  main_canvas: MainCanvas;
  settings: Settings;
  settings_panel: SettingsPanel;
  keyboard_controls: KeyboardControls;
 
  constructor() {
    // Create container and canvas:
    this.container = document.createElement("div");
    this.container.classList.add("canvas-container");
    var canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.tabIndex = 1;
    this.settings = new Settings(canvas);
    this.main_canvas = new MainCanvas(
      this.settings,
      canvas,
      this.container
    );
    this.container.appendChild(this.main_canvas.canvas);
    document.body.appendChild(this.container);
    
    // Init settings and keyboard controls:
    this.settings_panel = new SettingsPanel(this.settings, this.container);
    this.keyboard_controls = new KeyboardControls(this.settings, canvas);

    globalThis.main_canvas = this.main_canvas;
    globalThis.parsebigint = parsebigint;

    var seed_input: HTMLInputElement = document.getElementById("initial_value") as HTMLInputElement;
    seed_input.addEventListener("keyup", (function(event) {
      if (event.keyCode === 13) { // Enter
        event.preventDefault();
        seed_button.click();
      }
    }).bind(this));

    // Set up seed button
    var seed_button: HTMLButtonElement = document.getElementById("restart") as HTMLButtonElement;
    seed_button.onclick = function () {
      this.main_canvas.RestartWith(eval(seed_input.value) as bigint);
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

  Update(settings: Settings, redraw: boolean, cache_hash : string): void {
    var render_mode : RenderMode = settings.render_mode.t_value;
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
    Drawing.FillRect(render_context, x, y, width, height, this.settings.bgColor);
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
  static Next(settings: Settings, current: HistoryElement): HistoryElement {
    if (current.number % 2n == 0n) {
      return new HistoryElement(settings, current.number / 2n, 0);
    } else if (current.number % 2n == 1n) {
      return new HistoryElement(settings, current.number * 3n + 1n, 1);
    } else {
      console.log("This shouldn't happen");
      return new HistoryElement(settings, 0n, -1);
    }
  }
}

class MainCanvas {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  data_viewer: DataViewer;
  history: History;
  p_width: number;
  p_height: number;
  settings: Settings;

  constructor(settings: Settings, canvas: HTMLCanvasElement, container: HTMLDivElement) {
    this.settings = settings;
    this.canvas = canvas;
    this.container = container;
    this.data_viewer = new DataViewer(settings);
    this.history = new History();
    window.requestAnimationFrame(this.Draw.bind(this));
  }

  RestartWith(starting_number: bigint): void {
    this.history.RestartAndSeed(this.settings, starting_number);
  }

  Draw() {
    var context: CanvasRenderingContext2D = this.canvas.getContext("2d");
    this.p_height = this.canvas.height
    this.p_width = this.canvas.width;
    this.canvas.height = this.container.clientHeight;
    this.canvas.width = this.container.clientWidth;
    if (this.p_width != this.canvas.width || this.p_height != this.canvas.height) {
      this.settings.InvalidateRenderCache();
    }
    this.data_viewer.draw(0, 0, this.canvas.width, this.canvas.height, context, this.history);
    if (this.settings.run.value && this.history.length > 0) {
      this.history.Add(StepOperator.Next(this.settings, this.history.current));
      this.history.TrimDown((this.canvas.height / this.settings.block_size.value) * 2);
    }
    window.requestAnimationFrame(this.Draw.bind(this));
  }
}


window.onload = function() {
  try {
  var runner : Runner = new Runner();
  } catch (e) {
    alert(e);
  }
  globalThis.runner = runner;
}
