import { Drawing } from "./drawing";
import { Settings } from "./settings";

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
      var number_color: [number, number, number] = settings.baseColors.get(number_string[j]);
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
        var number_color: [number, number, number] = settings.baseColors.get(val);
        if (number_color == null) {
          continue;
        }
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