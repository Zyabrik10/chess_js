import { loopAndDo } from "./utils";

export function drawChess(ctx, map, actionMap, cellSize, chessFiguresImage) {
  loopAndDo(map, (j, i) => {
    if (actionMap?.[i][j]) {
      drawSquare(ctx, j * cellSize, i * cellSize, cellSize, "#92df28", true);
    } else {
      drawSquare(
        ctx,
        j * cellSize,
        i * cellSize,
        cellSize,
        (i + j) % 2 === 0 ? "#7D945D" : "#EEEED5"
      );
    }

    drawFigure(
      ctx,
      j * cellSize,
      i * cellSize,
      map[i][j],
      chessFiguresImage,
      cellSize
    );
  });
}

export function drawFigure(ctx, x, y, figure, chessFiguresImage, size) {
  if (!figure) return;
  ctx.drawImage(
    chessFiguresImage,
    (Math.abs(figure) - 1) * 60,
    figure > 0 ? 0 : 60,
    60,
    60,
    x,
    y,
    size,
    size
  );
}

export function drawSquare(ctx, x, y, size, color, stroke = false) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.rect(x, y, size, size);
  ctx.fill();
  stroke && ctx.stroke();
  ctx.closePath();
}

export function drawChooseModal(
  playerTurn,
  ctx,
  chessFiguresImage,
  cellSize,
  map
) {
  for (let i = 0; i < map.length; i++) {
    drawSquare(
      ctx,
      i * cellSize,
      0,
      cellSize,
      i % 2 === 0 ? "#7D945D" : "#EEEED5"
    );
    drawFigure(
      ctx,
      i * cellSize,
      0,
      playerTurn === 0 ? -map[i] : map[i],
      chessFiguresImage,
      cellSize
    );
  }
}