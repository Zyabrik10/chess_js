import {
  areCoorCorrect,
  checkIfDefends,
  getFigure,
  getPlayerTurnDirection,
  isFigureCorrectToPlayer,
  isFigureEnemyToPlayer,
  kingGo,
} from "./utils";

export function fillActionMap(
  [x, y, figure],
  actionMap,
  vars,
  ignoreObstacles = false
) {
  switch (Math.abs(figure)) {
    case 6:
      return fillPawn([x, y], actionMap, vars);
    case 5:
      return fillBishop([x, y], actionMap, vars, ignoreObstacles);
    case 4:
      return fillKnight([x, y], actionMap, vars);
    case 3:
      return fillRook([x, y], actionMap, vars, ignoreObstacles);
    case 2:
      return fillKing([x, y], actionMap, vars);
    case 1:
      return fillQueen([x, y], actionMap, vars, ignoreObstacles);
  }
}

export function fillPawn(coor, actionMap, vars) {
  const coors = checkIfDefends(coor, actionMap, vars.defenders);

  if (checkForActions(coors, vars)) return coors;

  let yF1 = coor[1] - 1 * getPlayerTurnDirection(vars.playerTurn);
  let yF2 = coor[1] - 2 * getPlayerTurnDirection(vars.playerTurn);
  let xF1 = coor[0];
  let xF2 = coor[0] - 1 * getPlayerTurnDirection(vars.playerTurn);
  let xF3 = coor[0] + 1 * getPlayerTurnDirection(vars.playerTurn);

  if (yF1 < 0 || yF1 > 7) return coors;

  // eat left
  if (isFigureEnemyToPlayer(vars.map[yF1][xF2], vars.playerTurn)) {
    actionMap[yF1][xF2] = 1;
    coors.push([xF2, yF1]);
  }

  // eat right
  if (isFigureEnemyToPlayer(vars.map[yF1][xF3], vars.playerTurn)) {
    actionMap[yF1][xF3] = 1;
    coors.push([xF3, yF1]);
  }

  if (
    ((vars.playerTurn === 1 && coor[1] === 1) ||
      (vars.playerTurn === 0 && coor[1] === 6)) &&
    vars.map[yF1][xF1] === 0 &&
    vars.map[yF2][xF1] === 0 &&
    !isFigureCorrectToPlayer(vars.map[yF2][xF1], vars.playerTurn)
  ) {
    // two times forward
    actionMap[yF1][xF1] = 1;
    actionMap[yF2][xF1] = 1;
    coors.push([xF1, yF1]);
    coors.push([xF1, yF2]);

    return coors;
  }

  if (vars.map[yF1][xF1] === 0) {
    // one time forward
    actionMap[yF1][xF1] = 1;
    coors.push([xF1, yF1]);
    return coors;
  }

  return coors;
}

export function fillBishop(coor, actionMap, vars, ignoreObstacles = false) {
  const coors = checkIfDefends(coor, actionMap, vars.defenders);

  if (checkForActions(coors, vars)) return coors;

  function draw(xCheck, yCheck) {
    for (let i = 0; i < 8; i++) {
      const x = xCheck(i);
      const y = yCheck(i);

      if (
        !areCoorCorrect(x, y) ||
        isFigureCorrectToPlayer(vars.map[y][x], vars.playerTurn)
      )
        break;

      if (!ignoreObstacles && vars.map[y][x] !== 0) {
        actionMap[y][x] = 1;
        coors.push([x, y]);
        break;
      }

      actionMap[y][x] = 1;
      coors.push([x, y]);
    }
  }

  draw(
    (i) => coor[0] - i - 1,
    (i) => coor[1] - i - 1
  );

  draw(
    (i) => coor[0] + i + 1,
    (i) => coor[1] - i - 1
  );

  draw(
    (i) => coor[0] - i - 1,
    (i) => coor[1] + i + 1
  );

  draw(
    (i) => coor[0] + i + 1,
    (i) => coor[1] + i + 1
  );

  return coors;
}

export function fillKnight(coor, actionMap, vars) {
  const coors = checkIfDefends(coor, actionMap, vars.defenders);

  if (checkForActions(coors, vars)) return coors;

  const x1 = coor[0] - 1; // left 1
  const x2 = coor[0] - 2; // left 2
  const x3 = coor[0] + 1; // right 1
  const x4 = coor[0] + 2; // right 2

  const y1 = coor[1] - 1; // top 1
  const y2 = coor[1] - 2; // top 2
  const y3 = coor[1] + 1; // bottom 1
  const y4 = coor[1] + 2; // bottom 2

  draw(x1, y2);
  draw(x3, y2);
  draw(x2, y1);
  draw(x4, y1);
  draw(x1, y4);
  draw(x3, y4);
  draw(x4, y3);
  draw(x2, y3);

  function draw(x, y) {
    if (!areCoorCorrect(x, y)) return;

    if (
      !vars.map[y][x] ||
      isFigureEnemyToPlayer(vars.map[y][x], vars.playerTurn)
    ) {
      actionMap[y][x] = 1;
      coors.push([x, y]);
    }
  }
  return coors;
}

export function fillRook(coor, actionMap, vars, ignoreObstacles = false) {
  const coors = checkIfDefends(coor, actionMap, vars.defenders);

  if (checkForActions(coors, vars)) return coors;

  function draw(vx, vy) {
    let x = coor[0] - vx;
    let y = coor[1] - vy;

    while (true) {
      if (!areCoorCorrect(x, y)) break;
      if (isFigureCorrectToPlayer(vars.map[y][x], vars.playerTurn)) return;

      if (
        !ignoreObstacles &&
        isFigureEnemyToPlayer(vars.map[y][x], vars.playerTurn)
      ) {
        actionMap[y][x] = 1;
        coors.push([x, y]);
        break;
      }

      actionMap[y][x] = 1;
      coors.push([x, y]);
      x -= vx;
      y -= vy;
    }
  }

  draw(0, 1);
  draw(1, 0);
  draw(0, -1);
  draw(-1, 0);

  return coors;
}

export function fillKing(coor, actionMap, vars) {
  let coors = [];

  kingGo((x, y) => {
    const kingX = coor[0] + x;
    const kingY = coor[1] + y;

    if (!areCoorCorrect(kingX, kingY)) return;
    if (
      isFigureCorrectToPlayer(vars.map[kingY][kingX], vars.playerTurn) ||
      vars.hypAttackMap[kingY][kingX]
    ) {
      return;
    }
    actionMap[kingY][kingX] = 1;
    coors.push([kingX, kingY]);
  });

  // Roquer Part
  const allRookMove = vars.hasPlayerRooksMoved[vars.playerTurn].every(
    (value) => value
  );

  if (vars.hasPlayerKingsMoved[vars.playerTurn] || allRookMove) return;

  function checkRoquer([kingX, kingY], rookY) {
    if ((kingX === 4 && kingY === 7) || (kingX === 4 && kingY === 0)) {
      function isPathClear(n, dir) {
        for (let i = 0; i < n - 1; i++) {
          if (vars.map[kingY][kingX + (i + 1) * dir] !== 0) return false;
        }

        return true;
      }

      if (
        vars.map[rookY][0] === getFigure("r", vars.playerTurn) &&
        !vars.hasPlayerRooksMoved[vars.playerTurn][0] &&
        isPathClear(Math.abs(kingX), -1)
      ) {
        actionMap[rookY][0] = 1;
        vars.isRoquerAllowed = true;
      }

      if (
        vars.map[rookY][7] === getFigure("r", vars.playerTurn) &&
        !vars.hasPlayerRooksMoved[vars.playerTurn][1] &&
        isPathClear(Math.abs(kingX - 7), 1)
      ) {
        actionMap[rookY][7] = 1;
        vars.isRoquerAllowed = true;
      }
    }
  }

  checkRoquer(coor, !vars.playerTurn ? 7 : 0);

  return coors;
}

export function fillQueen(coor, actionMap, vars, ignoreObstacles = false) {
  let coors = checkIfDefends(coor, actionMap, vars.defenders);

  if (checkForActions(coors, vars)) return coors;

  return [
    ...fillBishop(coor, actionMap, vars, ignoreObstacles),
    ...fillRook(coor, actionMap, vars, ignoreObstacles),
  ];
}

function checkForActions(coors, vars) {
  return coors.length > 0 ||
    vars.defenders.length > 0;
}