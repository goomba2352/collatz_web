import { Drawing } from "./drawing";
import { Settings } from "./settings";
var   number_map = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "a": 10,
  "b": 11,
  "c": 12,
  "d": 13,
  "e": 14,
  "f": 15,
  "g": 16,
  "h": 17,
  "i": 18,
  "j": 19,
  "k": 20,
  "l": 21,
  "m": 22,
  "n": 23,
  "o": 24,
  "p": 25,
  "q": 26,
  "r": 27,
  "s": 28,
  "t": 29,
  "u": 30,
  "v": 31,
  "w": 32,
  "x": 33,
  "y": 34,
  "z": 35,
};

export class SpiralView {
  static encoded_dirs: [number, number][] = [
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 0],
  ];
  static next_level_dir: [number, number] = [1, 0];
  rows: string[][] = [];
  cursor: [number, number];
  middle_pos: [number, number];
  level: number;
  needed_for_next_level: number;
  inner_level_tracker: number;

  constructor(rows: number, cols: number) {
    for (var i = 0; i < rows; i++) {
      this.rows.push([]);
      for (var j = 0; j < cols; j++) {
        this.rows[i].push(null);
      }
    }
    this.cursor = [0, 0];
    this.middle_pos = [Math.floor(rows / 2), Math.floor(cols / 2)];
    this.level = 0;
    this.needed_for_next_level = 0;
    this.inner_level_tracker = 0;
  }

  AddOne(elem: string): boolean {
    var result: boolean = false;
    var position: [number, number] = [
      this.middle_pos[0] + this.cursor[0],
      this.middle_pos[1] + this.cursor[1],
    ];
    if (
      position[0] >= 0 &&
      position[0] < this.rows.length &&
      position[1] >= 0 &&
      position[1] < this.rows[0].length
    ) {
      result = true;
      this.rows[position[0]][position[1]] = elem;
    }
    this.inner_level_tracker++;
    if (this.inner_level_tracker >= this.needed_for_next_level) {
      this.level += 1;
      this.needed_for_next_level += 8;
      this.inner_level_tracker = 0;
      this.cursor = [
        this.cursor[0] + SpiralView.next_level_dir[0],
        this.cursor[1] + SpiralView.next_level_dir[1],
      ];
      return result;
    }
    var dir: [number, number] =
      SpiralView.encoded_dirs[
        Math.floor(this.inner_level_tracker / Math.floor(this.needed_for_next_level / 4))
      ];
    this.cursor = [this.cursor[0] + dir[0], this.cursor[1] + dir[1]];
    return result;
  }
}

export abstract class RenderMode {
  is_history_view_type: boolean = false;
  name: string;
  constructor(history_view_type: boolean, name: String) {
    this.is_history_view_type = history_view_type;
  }

  abstract Render(number_string: string, settings: Settings, context: CanvasRenderingContext2D);

  static RegisteredModes() : RenderMode[] {
    return [new HistoryViewMode(), new SpiralViewMode()];
  }
}

class HistoryViewMode extends RenderMode {
  constructor() {
    super(true, "History View");
  }

  Render(
    number_string: string,
    settings: Settings,
    render_context: CanvasRenderingContext2D
  ) {
    for (var j: number = 0; j < number_string.length; j++) {
      var x: number = j * settings.block_size.value;
      if (x > render_context.canvas.width) {
        break;
      }
      var number_color: [number, number, number] =
        settings.baseColors[
          (number_map[number_string[j]] + settings.color_shift.value) % settings.base.value
        ].value;
      if (number_color == null) {
        continue;
      }
      Drawing.FillRect(
        render_context,
        x,
        0,
        settings.block_size.value,
        settings.block_size.value,
        number_color
      );
    }
  }
}

class SpiralViewMode extends RenderMode {
  constructor() {
    super(false, "Spiral View");
  }
  Render(
    number_string: string,
    settings: Settings,
    render_context: CanvasRenderingContext2D
  ) {
    var sp: SpiralView = new SpiralView(
      Math.floor(render_context.canvas.height / settings.block_size.value),
      Math.floor(render_context.canvas.width / settings.block_size.value)
    );
    for (var i = 0; i < number_string.length; i++) {
      sp.AddOne(number_string[i]);
    }
    for (var i = 0; i < sp.rows.length; i++) {
      for (var j = 0; j < sp.rows[i].length; j++) {
        var val: string = sp.rows[i][j];
        if (val == null) {
          continue;
        }
        var number_color: [number, number, number] =
          settings.baseColors[(number_map[val] + settings.color_shift.value) % settings.base.value]
            .value;
        var x: number = j * settings.block_size.value;
        var y: number = i * settings.block_size.value;
        Drawing.FillRect(
          render_context,
          x,
          y,
          settings.block_size.value,
          settings.block_size.value,
          number_color
        );
      }
    }
  }
}