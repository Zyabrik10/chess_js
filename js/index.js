import { drawChess, drawChooseModal } from "./draw";
import { fillActionMap } from "./movement";
import {
  isFigureCorrectToPlayer,
  loopAndDo,
  resetBuffInfo,
  isFigureTheSame,
  kingGo,
  areCoorCorrect,
  getShared,
  generateEmptyDesc,
  isFigureEnemyToPlayer,
} from "./utils";
import { vars } from "./vars";

window.addEventListener("load", init);

function init() {
  initVars();
  setWindowsEvents();
  vars.chessFiguresImage.addEventListener("load", doWhenImageIsLoaded);
}

function doWhenImageIsLoaded() {
  function setKingsCoor() {
    let king = 0;
    loopAndDo(vars.map, (j, i) => {
      if (king === 2) return true;
      if (Math.abs(vars.map[i][j]) === 2) {
        vars.kingsCoor[king++] = [j, i, vars.map[i][j]];
      }
    });
  }
  setKingsCoor();
  update(vars);
  vars.canvas.addEventListener("click", doWhenClick);
  vars.canvas2.addEventListener("click", doWhenClickOnModal);
}

function setWindowsEvents() {
  window.addEventListener(
    "mousedown",
    ({ pageX: x, pageY: y }) => (vars.mouseCoor = [x, y])
  );
}

function initVars() {
  vars.canvas = document.querySelector("#chess");
  vars.ctx = vars.canvas.getContext("2d");

  vars.canvas.width = vars.canvasChessWidth;
  vars.canvas.height = vars.canvasChessHeight;

  vars.cellSize = vars.canvas.width / vars.map.length;

  vars.canvas2 = document.querySelector("#chooseFigureCanvas");
  vars.ctx2 = vars.canvas2.getContext("2d");

  vars.canvas2.width = vars.cellSize * 4;
  vars.canvas2.height = vars.cellSize;

  vars.chessFiguresImage.src = vars.chessFiguresImageUrl;

  vars.modal = document.querySelector(".modal");
}

function update(vars) {
  animate(vars);
  vars.chessGameId = setTimeout(update.bind(null, vars), 100);
}

function animate({ ctx, map, actionMap, cellSize, chessFiguresImage }) {
  drawChess(ctx, map, actionMap, cellSize, chessFiguresImage);
}

function doWhenClickOnModal({ offsetX }) {
  const x = Math.floor(offsetX / 60);

  vars.modal.classList.remove("active");

  vars.map[vars.lastMoveCoor[1]][vars.lastMoveCoor[0]] =
    vars.playerTurn === 0 ? vars.map2[x] : -vars.map2[x];

  update(vars);
}

function doWhenClick({ offsetX: x, offsetY: y }) {
  const bx = Math.floor(x / vars.cellSize);
  const by = Math.floor(y / vars.cellSize);
  const figure = vars.map[by][bx];

  if (
    vars.chosenFigure &&
    vars.chosenFigure[0] === bx &&
    vars.chosenFigure[1] === by
  ) {
    resetBuffInfo(vars);
    return;
  }

  if (
    vars.chosenFigure &&
    vars.actionMap[by][bx] &&
    validateMove(vars, [bx, by])
  ) {
    makeAMove(vars, [bx, by]);
    resetBuffInfo(vars);
    vars.playerTurn = +!vars.playerTurn;
    return;
  }

  if (isFigureCorrectToPlayer(figure, vars.playerTurn)) {
    vars.chosenFigure = [bx, by, figure];
    vars.actionMap = generateEmptyDesc();

    const coors = fillActionMap(vars.chosenFigure, vars.actionMap, vars);
    updateActionMapForKingDefend(
      vars.chosenFigure,
      vars.actionMap,
      coors,
      vars
    );
    return;
  }

  resetBuffInfo(vars);
}

function validateMove(vars, newCoor) {
  const [fx, _, figure] = vars.chosenFigure;
  const [newX, newY] = newCoor;

  function validateRook() {
    if (fx < 4) vars.hasPlayerRooksMoved[vars.playerTurn][0] = true;
    if (fx > 4) vars.hasPlayerRooksMoved[vars.playerTurn][1] = true;
  }

  // rook
  if (
    isFigureTheSame("r", vars.playerTurn, figure) &&
    vars.hasPlayerRooksMoved[vars.playerTurn].some((e) => !e)
  ) {
    validateRook();
  }

  // pawn
  if (
    isFigureTheSame("p", vars.playerTurn, figure) &&
    (newY === 7 || newY == 0)
  ) {
    vars.modal.classList.add("active");
    vars.modal.style.top =
      vars.mouseCoor[1] - vars.modal.getBoundingClientRect().height + "px";
    vars.modal.style.left =
      vars.mouseCoor[0] - vars.modal.getBoundingClientRect().width / 2 + "px";

    clearTimeout(vars.chessGameId);
    drawChooseModal(
      vars.playerTurn,
      vars.ctx2,
      vars.chessFiguresImage,
      vars.cellSize,
      vars.map2
    );
  }

  if (isFigureTheSame("k", vars.playerTurn, figure)) {
    vars.hasPlayerKingsMoved[vars.playerTurn] = true;

    vars.kingsCoor[vars.playerTurn] = [newX, newY];
    vars.hasKingCheck[vars.playerTurn] = false;

    if (vars.isRoquerAllowed) {
      const [kingX, kingY, kingFigure] = vars.chosenFigure;
      const [newX, newY] = newCoor;

      const dir = newX - kingX > 0 ? 1 : -1;
      const newKingX = kingX + dir * 2;

      // move king
      vars.map[kingY][kingX] = 0;
      vars.map[kingY][newKingX] = kingFigure;

      // move rook
      vars.map[newY][newKingX + -1 * dir] = vars.map[newY][newX];
      vars.map[newY][newX] = 0;

      vars.isRoquerAllowed = false;

      validateRook();
      vars.playerTurn = +!vars.playerTurn;
      vars.lastMoveCoor = [newKingX, kingY, kingFigure];
      return false;
    }
  }

  return true;
}

function makeAMove(vars, newCoor) {
  const [fx, fy, figure] = vars.chosenFigure;
  const [newX, newY] = newCoor;

  vars.map[newY][newX] = figure;
  vars.map[fy][fx] = 0;
  vars.defenders = [];
  vars.lastMoveCoor = [newX, newY, figure];
  checkIfKingHasCheckAndMate(vars);
}

function hasKingCheck([kingX, kingY], vars) {
  const [lastX, lastY, lastF] = vars.lastMoveCoor;
  const attF = [lastX, lastY, lastF];

  vars.hypAttackMap = generateEmptyDesc();

  const coors = fillActionMap(attF, vars.hypAttackMap, vars, true);

  const hasKingCheck = vars.hypAttackMap[kingY][kingX] === 1;

  vars.hasKingCheck[vars.playerTurn] = hasKingCheck;

  if (hasKingCheck) vars.attackerInfo = [vars.lastMoveCoor, coors];

  return hasKingCheck;
}

function fillHypMap(vars) {
  loopAndDo(vars.map, (j, i) => {
    const f = [j, i, vars.map[i][j]];

    if (
      vars.map[i][j] === 0 ||
      isFigureEnemyToPlayer(f[2], vars.playerTurn) ||
      (i === vars.lastMoveCoor[1] && j === vars.lastMoveCoor[0])
    )
      return;

    fillActionMap(f, vars.hypAttackMap, vars, true);
  });
}

function countKingFreeFields([kingX, kingY], vars) {
  vars.kingsFreeFields = 0;

  kingGo((x, y) => {
    const newKingX = kingX + x;
    const newKingY = kingY + y;
    if (
      !areCoorCorrect(newKingX, newKingY) ||
      isFigureCorrectToPlayer(vars.map[newKingY][newKingX], vars.playerTurn) ||
      vars.hypAttackMap[newKingY][newKingX]
    )
      return;
    vars.kingsFreeFields++;
  });
}

function checkIfKingHasCheckAndMate(vars) {
  const [kingX, kingY] = vars.kingsCoor[vars.playerTurn];
  if (kingX === null || kingY === null) return;

  if (!hasKingCheck(vars.kingsCoor[vars.playerTurn], vars)) return;
  fillHypMap(vars);
  countKingFreeFields([kingX, kingY], vars);

  const kingsDefenders = getKingDefenders(vars);

  if (vars.kingsFreeFields === 0 && kingsDefenders.length === 0) {
    clearTimeout(vars.chessGameId);
    console.log(["White player ", "Black player "][vars.playerTurn] + " wins");
  }
}

function getKingDefenders(vars) {
  const [attacker] = vars.attackerInfo;
  const [kingX, kingY, king] = vars.kingsCoor[vars.playerTurn];
  const [attX, attY, attF] = attacker;

  let mp = generateEmptyDesc();
  mp[kingY][kingX] = king;
  mp[attY][attX] = attF;

  loopAndDo(vars.map, (j, i) => {
    if (isFigureEnemyToPlayer(vars.map[i][j], vars.playerTurn)) {
      mp[i][j] = vars.map[i][j];
    }
  });

  vars.defenders = getDefenders(vars, mp);

  return vars.defenders;
}

function getDefenders(vars, mp) {
  const [[attackerX, attackerY, attackerF], attackerCoors] = vars.attackerInfo;
  const [kingX, kingY, king] = vars.kingsCoor[vars.playerTurn];
  let defenders = [];

  loopAndDo(vars.map, (x, y) => {
    let defendersMap = generateEmptyDesc();
    const figure = [x, y, vars.map[y][x]];

    if (
      !isFigureCorrectToPlayer(figure[2], +!vars.playerTurn) ||
      isFigureTheSame("k", +!vars.playerTurn, figure[2])
    )
      return;

    const dfCoors = fillActionMap(figure, defendersMap, {
      ...vars,
      map: mp,
      playerTurn: +!vars.playerTurn,
    });

    if (canDefenderEatAttacker([attackerX, attackerY], dfCoors)) {
      defenders.push([figure, [attackerX, attackerY]]);
      return;
    }

    const sharedCoor = getShared(attackerCoors, dfCoors);

    for (const shCoor of sharedCoor) {
      const simMap = generateEmptyDesc();
      const buffDefendersMap = generateEmptyDesc();
      const [simDFX, simDFY] = shCoor;

      simMap[kingY][kingX] = king;
      simMap[simDFY][simDFX] = figure[2];
      simMap[attackerY][attackerX] = attackerF;

      fillActionMap(vars.lastMoveCoor, buffDefendersMap, {
        ...vars,
        map: simMap,
        playerTurn: vars.playerTurn,
      });

      if (buffDefendersMap[kingY][kingX] === 0) {
        defenders.push([figure, shCoor]);
      }
    }
  });

  return defenders;
}

function canDefenderEatAttacker([attackerX, attackerY], coors) {
  for (const element of coors) {
    if (attackerX === element[0] && attackerY === element[1]) {
      return true;
    }
  }

  return false;
}

function updateActionMapForKingDefend([fx, fy, f], actionMap, coors, vars) {
  const [kingX, kingY, king] = vars.kingsCoor[vars.playerTurn];

  for (const [x, y] of coors) {
    // const simMap = vars.map.map((e) => { return [...e]; });

    simMap[kingY][kingX] = king;
    simMap[fy][fx] = 0;
    simMap[y][x] = f;

    console.log(simMap);

    // loopAndDo(vars.map, (j, i) => {
    //   const ef = [j, i, vars.map[i][j]]; // e - enemy
    //   const buffMap = generateEmptyDesc();

    //   if (!isFigureCorrectToPlayer(ef[2], vars.playerTurn)) return;

    //   fillActionMap(ef, buffMap, {
    //     ...vars,
    //     map: simMap,
    //     playerTurn: vars.playerTurn,
    //   });

    //   console.log(buffMap);

    //   if (buffMap[kingY][kingX]) {
    //     actionMap[y][x] = 0;
    //   }
    // });

    console.log("============================");
  }
}