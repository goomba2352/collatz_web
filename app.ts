import Denque from "denque";
import { Drawing } from "./drawing.js";
import { parsebigint } from "./number_utils.js";
import { Settings, MinMaxKeyboardAdjuster, Key, SettingsPannel, BooleanKeyboardAdjuster, InvalidateRenderCache, CheckIfRenderCacheInvalidatedAndReset } from "./settings.js";

class Runner {
  version: String = "0.0.1 alpha";
  main_canvas: MainCanvas;
  size_adjust : MinMaxKeyboardAdjuster = new MinMaxKeyboardAdjuster(Settings.block_size, Key.of('z'), Key.of('x'));
  base_adjust : MinMaxKeyboardAdjuster = new MinMaxKeyboardAdjuster(Settings.base, Key.of('a'), Key.of('s'));  
  pause : BooleanKeyboardAdjuster = new BooleanKeyboardAdjuster(Settings.run, Key.of(' '));
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

  constructor(number: bigint, op: number) {
    this.number = number;
    this.op = op;
    this.bitmap = document.createElement("canvas")
    this.ReRender();
  }


  ReRender() : void {
    this.cached_string = this.number.toString(Settings.base.value);
    this.bitmap.width = window.innerWidth;
    this.bitmap.height = Settings.block_size.value;
    var render_context : CanvasRenderingContext2D = this.bitmap.getContext("2d");
    for (var j: number = 0; j < this.cached_string.length; j++) {
      var x: number = j * Settings.block_size.value;
      if (x > this.bitmap.width) {
        break;
      }
      var number_color: [number, number, number] = Settings.baseColors.get(this.cached_string[j]);
      if (number_color == null) {
        console.log("Could not find color for: " + this.cached_string[j])
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
    this.history_view(x, y, width, height, render_context, history);
  }

  history_view(
    x: number,
    y: number,
    width: number,
    height: number,
    render_context: CanvasRenderingContext2D,
    history: History
  ): void {
    // background
    var redraw : boolean = CheckIfRenderCacheInvalidatedAndReset();
    if (redraw) {
      console.log("Cache invalidated!");
    }
    Drawing.FillRect(render_context, x, y, width, height, Settings.bgColor);
    for (var i: number = -1; i >= -history.length; i--) {
      var history_element : HistoryElement = history.all.peekAt(i);
      if (redraw) {
        history_element.ReRender();
      }
      var render_y : number = render_context.canvas.height + Settings.block_size.value * i;
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
