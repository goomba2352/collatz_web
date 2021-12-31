export class Drawing {
  static rgb(color: [number, number, number]): string {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }
  
  static FillRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: [number, number, number]
  ): void {
    ctx.fillStyle = Drawing.rgb(fill);
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fill();
  }
}
