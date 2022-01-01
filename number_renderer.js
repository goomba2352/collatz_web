let SpiralView = /** @class */ (() => {
    class SpiralView {
        constructor(rows, cols) {
            this.rows = [];
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
        AddOne(elem) {
            var result = false;
            var position = [
                this.middle_pos[0] + this.cursor[0],
                this.middle_pos[1] + this.cursor[1],
            ];
            if (position[0] >= 0 &&
                position[0] < this.rows.length &&
                position[1] >= 0 &&
                position[1] < this.rows[0].length) {
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
            var dir = SpiralView.encoded_dirs[Math.floor(this.inner_level_tracker / Math.floor(this.needed_for_next_level / 4))];
            this.cursor = [this.cursor[0] + dir[0], this.cursor[1] + dir[1]];
            return result;
        }
    }
    SpiralView.encoded_dirs = [
        [0, 1],
        [-1, 0],
        [0, -1],
        [1, 0],
    ];
    SpiralView.next_level_dir = [1, 0];
    return SpiralView;
})();
export { SpiralView };
//# sourceMappingURL=number_renderer.js.map