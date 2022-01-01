import Denque from "denque";
import { Drawing } from "./drawing.js";
import { parsebigint } from "./number_utils.js";
import { Settings, MinMaxKeyboardAdjuster, Key, SettingsPannel, BooleanKeyboardAdjuster, InvalidateRenderCache, CheckIfRenderCacheInvalidatedAndReset } from "./settings.js";
import {SpiralView} from "./number_renderer.js";

class Runner {
  version: String = "0.0.1 alpha";
  main_canvas: MainCanvas;
  size_adjust : MinMaxKeyboardAdjuster = new MinMaxKeyboardAdjuster(Settings.block_size, Key.of('z'), Key.of('x'));
  base_adjust : MinMaxKeyboardAdjuster = new MinMaxKeyboardAdjuster(Settings.base, Key.of('a'), Key.of('s'));  
  render_mode : MinMaxKeyboardAdjuster = new MinMaxKeyboardAdjuster(Settings.render_mode, Key.of(','), Key.of('.'));  
  pause : BooleanKeyboardAdjuster = new BooleanKeyboardAdjuster(Settings.run, Key.of(' '));
  reverse : BooleanKeyboardAdjuster = new BooleanKeyboardAdjuster(Settings.reverse, Key.of('r'));
  settings_panel : SettingsPannel = new SettingsPannel();
  constructor() {
    this.main_canvas = new MainCanvas(document.getElementById("main_canvas") as HTMLCanvasElement);

    globalThis.main_canvas = this.main_canvas;
    globalThis.parsebigint = parsebigint;
    var restart_button: HTMLButtonElement = document.getElementById("restart") as HTMLButtonElement;
    restart_button.onclick = function () {
      var seed_input: HTMLInputElement = document.getElementById(
        "initial_value"
      ) as HTMLInputElement;
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

  constructor(number: bigint, op: number) {
    this.number = number;
    this.op = op;
    this.bitmap = document.createElement("canvas");
    this.Update(true, Settings.CacheHash());
  }

  Update(redraw: boolean, cache_hash : string): void {
    if (this.cache_hash != cache_hash) {
      this.cached_string = this.number.toString(Settings.base.value);
      if (Settings.reverse.value) {
        this.cached_string = this.cached_string.split("").reverse().join("");
      }
      this.cache_hash = cache_hash;
    }
    if (redraw) {
      if (Settings.render_mode.value == 0) {
        this.UpdateInternalBitmapForLineView();
      }
    }
  }

  private UpdateInternalBitmapForLineView(): void {
    this.bitmap.width = window.innerWidth;
    this.bitmap.height = Settings.block_size.value;
    var render_context: CanvasRenderingContext2D = this.bitmap.getContext("2d");
    for (var j: number = 0; j < this.cached_string.length; j++) {
      var x: number = j * Settings.block_size.value;
      if (x > this.bitmap.width) {
        break;
      }
      var number_color: [number, number, number] = Settings.baseColors.get(this.cached_string[j]);
      if (number_color == null) {
        continue;
      }
      Drawing.FillRect(
        render_context,
        x,
        0,
        Settings.block_size.value,
        Settings.block_size.value,
        number_color
      );
    }
  }

  BlitSpiralOntoCanvas(render_context: CanvasRenderingContext2D) {
    var sp: SpiralView = new SpiralView(
      Math.floor(render_context.canvas.height / Settings.block_size.value),
      Math.floor(render_context.canvas.width / Settings.block_size.value)
    );
    for (var i = 0; i < this.cached_string.length; i++) {
      sp.AddOne(this.cached_string[i]);
    }
    for (var i = 0; i < sp.rows.length; i++) {
      for (var j = 0; j < sp.rows[i].length; j++) {
        var val: string = sp.rows[i][j];
        var number_color: [number, number, number] = Settings.baseColors.get(val);
        if (number_color == null) {
          continue;
        }
        var x: number = j * Settings.block_size.value;
        var y: number = i * Settings.block_size.value;
        Drawing.FillRect(
          render_context,
          x,
          y,
          Settings.block_size.value,
          Settings.block_size.value,
          number_color
        );
      }
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

  RestartAndSeed(seed: bigint) {
    this.history.clear();
    this.history.push(new HistoryElement(seed, -1));
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
  constructor() {}

  draw(
    x: number,
    y: number,
    width: number,
    height: number,
    render_context: CanvasRenderingContext2D,
    history: History
  ) {
    var redraw: boolean = CheckIfRenderCacheInvalidatedAndReset();
    // background
    Drawing.FillRect(render_context, x, y, width, height, Settings.bgColor);
    var cache_hash: string = Settings.CacheHash();
    for (var i = 0; i < history.all.length; i++) {
      var history_element: HistoryElement = history.all.peekAt(i);
      history_element.Update(redraw, cache_hash);
    }
    if (Settings.render_mode.value == 0) {
      this.HistoryView(render_context, history);
    } else if (Settings.render_mode.value == 1) {
      this.SpiralView(render_context, history);
    }
  }

  SpiralView(render_context: CanvasRenderingContext2D, history: History): void {
    if (history.length >= 1) {
      history.current.BlitSpiralOntoCanvas(render_context);
    }
  }

  HistoryView(render_context: CanvasRenderingContext2D, history: History): void {
    for (var i: number = -1; i >= -history.length; i--) {
      var history_element: HistoryElement = history.all.peekAt(i);
      var render_y: number = render_context.canvas.height + Settings.block_size.value * i;
      render_context.drawImage(history_element.bitmap, 0, render_y);
    }
  }
}

class StepOperator {
  static Next(current: HistoryElement): HistoryElement {
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
  canvas: HTMLCanvasElement;
  data_viewer: DataViewer;
  history: History;
  p_width: number;
  p_height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.data_viewer = new DataViewer();
    this.history = new History();
    window.requestAnimationFrame(this.Draw.bind(this));
  }

  RestartWith(starting_number: bigint): void {
    this.history.RestartAndSeed(starting_number);
  }

  Draw() {
    var context: CanvasRenderingContext2D = this.canvas.getContext("2d");
    this.p_height = this.canvas.height;
    this.p_width = this.canvas.width;
    this.canvas.height = window.innerHeight - 30;
    this.canvas.width = window.innerWidth;
    if (this.p_width != this.canvas.width) {
      InvalidateRenderCache();
    }
    this.data_viewer.draw(0, 0, this.canvas.width, this.canvas.height, context, this.history);
    if (Settings.run.value && this.history.length > 0) {
      this.history.Add(StepOperator.Next(this.history.current));
      this.history.TrimDown((this.canvas.height / Settings.block_size.value) * 2);
    }
    window.requestAnimationFrame(this.Draw.bind(this));
  }
}


window.onload = function() {
  var runner : Runner = new Runner();
  globalThis.runner = runner;
}
