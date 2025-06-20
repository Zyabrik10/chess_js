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
    const wereKings = [false, false];
    loopAndDo(vars.map, (j, i) => {
      if (wereKings.every((e) => e === true)) return true;
      if (vars.map[i][j] === 2 && !wereKings[1]) {
        vars.kingsCoor[1] = [j, i, 2];
        wereKings[1] = true;
      }
      if (vars.map[i][j] === 8 && !wereKings[0]) {
        vars.kingsCoor[0] = [j, i, 8];
        wereKings[0] = true;
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
    vars.playerTurn === 0 ? vars.map2[x] : vars.map2[x] + 6;

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

  if (vars.chosenFigure && vars.actionMap[by][bx]) {
    makeAMove(vars, [bx, by]);
    vars.lastMoveCoor = [bx, by];
    return;
  }

  if (isFigureCorrectToPlayer(figure, vars.playerTurn)) {
    vars.chosenFigure = [bx, by, figure];
    vars.actionMap = generateEmptyDesc();

    fillActionMap(vars.chosenFigure, vars.actionMap, vars);
    return;
  }

  resetBuffInfo(vars);
}

function makeAMove(vars, newCoor) {
  const [fx, fy, figure] = vars.chosenFigure;
  const [newX, newY] = newCoor;

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

  // king
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
    } else {
      move();
    }
  } else {
    // else figures
    move();
  }

  function move() {
    vars.map[newY][newX] = figure;
    vars.map[fy][fx] = 0;
    vars.defenders = [];
    checkIfKingsHaveCheck(vars);
  }

  function validateRook() {
    if (fx < 4) vars.hasPlayerRooksMoved[vars.playerTurn][0] = true;
    if (fx > 4) vars.hasPlayerRooksMoved[vars.playerTurn][1] = true;
  }

  resetBuffInfo(vars);
  vars.playerTurn = +!vars.playerTurn;
}

function checkIfKingsHaveCheck(vars) {
  const enemyTurn = +!vars.playerTurn;
  const [enemyKingX, enemyKingY] = vars.kingsCoor[enemyTurn];
  if (enemyKingX === null || enemyKingY === null) return;

  vars.gipAttackMap = generateEmptyDesc();
  let attackersMap = generateEmptyDesc();

  let attacker = null;

  loopAndDo(vars.map, (x, y) => {
    const figure = [x, y, vars.map[y][x]];

    if (isFigureCorrectToPlayer(figure[2], vars.playerTurn)) {
      fillActionMap(figure, vars.gipAttackMap, vars, true); // for king
      const coors = fillActionMap(figure, attackersMap, vars);
      if (attackersMap[enemyKingY][enemyKingX]) {
        attacker = [coors, figure];
        attackersMap = generateEmptyDesc();
        return;
      }
    }
  });

  vars.hasKingCheck[enemyTurn] = Boolean(
    vars.gipAttackMap[enemyKingY][enemyKingX]
  );

  vars.kingsFreeFields = 0;
  kingGo((x, y) => {
    const kingX = enemyKingX + x;
    const kingY = enemyKingY + y;

    if (
      !areCoorCorrect(kingX, kingY) ||
      isFigureCorrectToPlayer(vars.map[kingY][kingX], enemyTurn) ||
      vars.gipAttackMap[kingY][kingX]
    )
      return;
    vars.kingsFreeFields++;
  });

  console.log(attacker);

  if (
    vars.hasKingCheck[enemyTurn] &&
    !canSomeOneProtectTheKing(vars, attacker, vars.kingsCoor[enemyTurn]) &&
    vars.kingsFreeFields === 0
  ) {
    clearTimeout(vars.chessGameId);
    console.log(vars.playerTurn + " wins");
  }
}

function canSomeOneProtectTheKing(
  vars,
  k,
  [kingX, kingY, king]
) {
  if (k === null) return;
  const [attackerCoors, attacker] = k;
  const [attackerX, attackerY, attackerF] = attacker;
  let defendersMap = generateEmptyDesc();
  let mp = generateEmptyDesc();
  mp[kingY][kingX] = king;
  mp[attackerY][attackerX] = attackerF;

  loopAndDo(vars.map, (j, i) => {
    if (isFigureCorrectToPlayer(vars.map[i][j], +!vars.playerTurn)) {
      mp[i][j] = vars.map[i][j];
    }
  });

  const defenders = [];
  vars.defenders = [];

  loopAndDo(vars.map, (x, y) => {
    const figure = [x, y, vars.map[y][x]];

    if (
      isFigureCorrectToPlayer(figure[2], +!vars.playerTurn) &&
      !isFigureTheSame("k", +!vars.playerTurn, figure[2])
    ) {
      const dfCoors = fillActionMap(figure, defendersMap, {
        ...vars,
        map: mp,
        playerTurn: +!vars.playerTurn,
      });

      let canDefenderEatAttacker = false;

      for (const element of dfCoors) {
        if (attackerX === element[0] && attackerY === element[1]) {
          canDefenderEatAttacker = true;
          break;
        }
      }

      if (canDefenderEatAttacker) {
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

        fillActionMap(attacker, buffDefendersMap, {
          ...vars,
          map: simMap,
          playerTurn: vars.playerTurn,
        });

        if (buffDefendersMap[kingY][kingX] === 0) {
          defenders.push([figure, shCoor]);
        }
      }

      defendersMap = generateEmptyDesc();
    }
  });

  vars.defenders = defenders;

  return true;
}
