export function kingGo(callback) {
  const n = 8;
  const angle = (Math.PI * 2) / n;
  for (let i = 0; i < n; i++) {
    let x = Math.round(Math.cos(angle * i));
    let y = Math.round(Math.sin(angle * i));

    callback(x, y);
  }
}

export function loopAndDo(_2dArray, func) {
  for (let i = 0; i < _2dArray.length; i++) {
    for (let j = 0; j < _2dArray[0].length; j++) {
      if (func(j, i)) {
        return;
      }
    }
  }
}

export function isFigureCorrectToPlayer(figure, playerTurn) {
  return (
    figure !== 0 &&
    ((playerTurn === 0 && figure < 0) || (playerTurn === 1 && figure > 0))
  );
}

export function isFigureEnemyToPlayer(figure, playerTurn) {
  return (
    figure !== 0 &&
    ((playerTurn === 0 && figure > 0) || (playerTurn === 1 && figure < 0))
  );
}

export function getPlayerTurnDirection(playerTurn) {
  return playerTurn ? -1 : 1;
}

export function resetBuffInfo(vars) {
  vars.chosenFigure = null;
  vars.actionMap = generateEmptyDesc();
}

export function getFigure(name, turn) {
  switch (name) {
    case "p":
      return [-6, 6][turn];
    case "b":
      return [-5, 5][turn];
    case "kn":
      return [-4, 4][turn];
    case "r":
      return [-3, 3][turn];
    case "k":
      return [-2, 2][turn];
    case "q":
      return [-1, 1][turn];
  }
}

export function isFigureTheSame(name, turn, figure) {
  return getFigure(name, turn) === figure;
}

export function areCoorCorrect(x, y) {
  return x <= 7 && x >= 0 && y <= 7 && y >= 0;
}

export function getShared(arr1, arr2) {
  const mp = {};
  let shared = [];

  for (const el1 of arr1) {
    for (const el2 of arr2) {
      const a = JSON.stringify(el1);
      const b = JSON.stringify(el2);
      if (a === b && !mp[a]) {
        mp[a] = true;
        shared.push(el1);
      }
    }
  }

  return shared;
}

export function generateEmptyDesc() {
  return new Array(8).fill(0).map(() => new Array(8).fill(0));
}

export function checkIfDefends(coor, actionMap, defenders) {
  let isInDefenders = false;
  let coors = [];
  let dfCoor = null;

  for (const df of defenders) {
    const [x, y] = df[0];

    if (x === coor[0] && y === coor[1]) {
      dfCoor = df[1];
      isInDefenders = true;
      break;
    }
  }

  if (isInDefenders) {
    const [x, y] = dfCoor;
    actionMap[y][x] = 1;
    coors.push([x, y]);
    return coors;
  }

  return [];
}
