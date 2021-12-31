export class Drawing {
    static rgb(color) {
        return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    }
    static FillRect(ctx, x, y, width, height, fill) {
        ctx.fillStyle = Drawing.rgb(fill);
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.fill();
    }
}
//# sourceMappingURL=drawing.js.map