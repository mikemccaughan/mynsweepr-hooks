import React, {
  Fragment,
  useState,
  ChangeEvent,
  ChangeEventHandler,
  MouseEvent,
  EventHandler,
  SyntheticEvent,
  useLayoutEffect,
  useEffect,
  MouseEventHandler,
} from 'react';
import { usePrevious } from './hooks';
import { Utils } from './Utils';
import Difficulty from './Difficulty';
import Board from './Board';
import { Scoreboard } from './Scoreboard';
import {
  Cell,
  fnArgs,
  clearAround,
  flagCell,
  generateBoard,
  revealCell,
  showCell,
  showAllCells,
  flagCellArgs,
  clearAroundArgs,
  revealCellArgs,
  showCellArgs,
  stringifyArgs,
} from './fn-mineboard';
import { Dialog, DialogManager } from './Dialog';
import { Logger } from './Logger';

const MynSweepr: React.FC = () => {
  const [difficulty, setDifficulty] = useState('9');
  const prevDifficulty = usePrevious(difficulty);
  const [width, setWidth] = useState(9);
  const prevWidth = usePrevious(width);
  const [height, setHeight] = useState(9);
  const prevHeight = usePrevious(height);
  const [cells, setCells] = useState([] as Cell[]);
  const [mineCount, setMineCount] = useState(0);
  const [gameIsActive, setGameIsActive] = useState(false);
  const [gameState, setGameState] = useState('unknown');

  const setRows = () => {
    document.documentElement.style.setProperty('--rows', height.toString());
  };

  const setColumns = () => {
    document.documentElement.style.setProperty('--columns', width.toString());
  };

  function checkWin(args: fnArgs): void {
    if ((args?.mineCount ?? 1) === 0 && (args?.cells.every((cell) => !cell.hidden || cell.flag) ?? false)) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      args?.onWin ? args.onWin(args) : (() => {})();
    }
  }

  useLayoutEffect(() => {
    setDifficulty(() => {
      if (difficulty !== prevDifficulty) {
        setWidth((w: number) => difficulty === '?' ? w : +difficulty);
        setHeight((h: number) => difficulty === '?' ? h : difficulty === '30' ? 16 : +difficulty);
      }
      return difficulty;
    });
  }, [difficulty, prevDifficulty]);

  useLayoutEffect(() => {
    setWidth(() => {
      if (width !== prevWidth) {
        setColumns();
      }
      return width;
    });
    // eslint-disable-next-line
  }, [width, prevWidth]);

  useLayoutEffect(() => {
    setHeight(() => {
      if (height !== prevHeight) {
        setRows();
      }
      return height;
    });
    // eslint-disable-next-line
  }, [height, prevHeight]);

  useLayoutEffect(() => {
    const board = generateBoard({ width, height, density: 1 / 6 });
    setCells(() => board.cells);
    setMineCount(() => board.mineCount);
  }, [width, height]);

  useEffect(() => {
    const mineCount = cells.filter((cell) => cell.hasMine && !cell.flag).length;
    const blownMineCount = cells.filter((cell) => cell.hasMine && !cell.hidden && !cell.flag).length;
    const hiddenCount = cells.filter((cell) => cell.hidden && !cell.flag).length;
    if (mineCount === 0 && blownMineCount === 0 && hiddenCount === 0) {
      setGameState('won');
    } else if (blownMineCount > 0) {
      setGameState('lost');
    } else if (mineCount > 0 && blownMineCount === 0 && hiddenCount > 0) {
      setGameState('unknown');
    }
  }, [cells]);

  useEffect(() => {
    if (gameState === 'lost') {
      showLoseModal();
    }
    if (gameState === 'won') {
      showWinModal();
    }
    if (gameState === 'unknown') {
      // do nothing
    }
  }, [gameState]);

  const handleDifficultyChange = (
    e: MouseEvent<HTMLInputElement, globalThis.MouseEvent>
  ) => {
    const culty: string = e && (e.target as HTMLInputElement).value;
    setGameIsActive(false);
    setDifficulty(culty);
  };

  const handleWidthChange: ChangeEventHandler<HTMLInputElement> = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const dth = +e.target.value;
    setGameIsActive(false);
    setWidth(dth);
  };

  const handleHeightChange: ChangeEventHandler<HTMLInputElement> = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const ght = +e.target.value;
    setGameIsActive(false);
    setHeight(ght);
  };

  const getTempOtherDifficulty = (selectedDifficulty: '?' | '9' | '16' | '30'): '9' | '16' | '30' => {
    let tempOtherDifficulty: '9' | '16' | '30';
    switch (selectedDifficulty) {
      case '9':
        tempOtherDifficulty = '16';
        break;
      case '16':
        tempOtherDifficulty = '30';
        break;
      case '30':
        tempOtherDifficulty = '16';
        break;
      case '?':
        tempOtherDifficulty = '9';
        break;
    }
    return tempOtherDifficulty;
  };

  const handleRequestForNewBoard: MouseEventHandler = (
    e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
  ) => {
    e?.preventDefault();
    const selectedRadio: HTMLInputElement = window.document.querySelector('input[type="radio"][name="difficulty"]:checked') as HTMLInputElement;
    const selectedDifficulty: '?' | '9' | '16' | '30' = ((selectedRadio?.value ?? '9') as '?' | '9' | '16' | '30');
    let w: string, h: string;
    if (selectedDifficulty === '?') {
      w = (document.querySelector('#width') as HTMLInputElement)?.value;
      h = (document.querySelector('#height') as HTMLInputElement)?.value;
    }
    const tempOtherDifficulty: '9' | '16' | '30' = getTempOtherDifficulty(selectedDifficulty);
    setGameIsActive(false);
    setMineCount(0);
    setDifficulty(tempOtherDifficulty);
    window.setTimeout(() => {
      setDifficulty(selectedDifficulty);
      if (selectedDifficulty === '?') {
        setHeight(Utils.asGoodNumber(h));
        setWidth(Utils.asGoodNumber(w));
      }
    }, 0);
  };

  const resetBoard = () => { document.querySelector('button.reset')?.dispatchEvent(new Event('click')); }

  const makeStandardOnBlank = (extraToLog: string) => (args: fnArgs) => {
    Logger.trace(`${extraToLog} onBlank: args: ${JSON.stringify(args, stringifyArgs)}`);
    args = clearAround(args as clearAroundArgs);
    setCells(args.cells);
    setMineCount(args.mineCount);
    return args;
  };

  const showLoseModal = () => {
    const loseModal = document.getElementById('lose') as HTMLDialogElement;
    if (loseModal && typeof loseModal.showModal === 'function' && !loseModal.open) {
      loseModal.showModal();
      loseModal.addEventListener('close', () => {
        Logger.info('showLoseModal:close event handler');
        resetBoard();
      });
    }
  };

  const showWinModal = () => {
    const winModal = document.getElementById('win') as HTMLDialogElement;
    if (winModal && typeof winModal.showModal === 'function' && !winModal.open) {
      winModal.showModal();
      winModal.addEventListener('close', () => {
        Logger.info('showWinModal:close event handler');
        resetBoard();
      });
    }
  };

  const makeStandardOnLose = (extraToLog: string) => (args: fnArgs) => {
    setGameIsActive(false);
    args.cells = showAllCells(args.cells);
    DialogManager.instance.open("loss");
    Logger.trace(`${extraToLog} onLose: args: ${JSON.stringify(args, stringifyArgs)}`);
    setCells(args.cells);
    setMineCount(args.mineCount);
    return args;
  };

  const makeStandardOnWin = (extraToLog: string) => (args: fnArgs) => {
    setGameIsActive(false);
    args.cells = showAllCells(args.cells);
    DialogManager.instance.open("win");
    Logger.trace(`${extraToLog} onWin: args: ${JSON.stringify(args, stringifyArgs)}`);
    setCells(args.cells);
    setMineCount(args.mineCount);
    return args;
  };

  const makeStandardOnNearby = (extraToLog: string) => (args: fnArgs) => {
    Logger.trace(`${extraToLog} onNearby: args: ${JSON.stringify(args, stringifyArgs)}`);
    args = clearAround(args as clearAroundArgs);
    setCells(args.cells);
    setMineCount(args.mineCount);
    return args;
  };

  const makeStandardOnReveal = (extraToLog: string) => (args: fnArgs) => {
    Logger.trace(`${extraToLog} onReveal: args: ${JSON.stringify(args, stringifyArgs)}`);
    const cellToUpdate = args.cells[args.index];
    const newCells = [
      ...args.cells.filter((c, i) => i < args.index),
      {
        ...cellToUpdate,
        hadOverlay: args.hadOverlay ?? false
      },
      ...args.cells.filter((c, i) => i > args.index)
    ];
    args = {
      ...args,
      cells: newCells
    };
    if (!cellToUpdate.hadOverlay && !cellToUpdate.flag) {
      args = showCell(args as showCellArgs);
    }
    setCells(args.cells);
    return args;
  };

  const handleCellClick: EventHandler<SyntheticEvent> = (e: SyntheticEvent) => {
    Logger.trace('click', e);
    setGameIsActive(true);
    if (cells[+((e.target as HTMLElement)?.dataset?.index ?? 0)].flag) {
      // ignore single clicks on flagged cells
      return;
    }
    const args: fnArgs = {
      cells,
      mineCount,
      index: +((e.target as HTMLElement)?.dataset?.index ?? 0),
      hadOverlay:
        (e.target as HTMLElement)?.classList?.contains('hidden') ?? false,
      wasClicked: true,
      continue: 
        !((e.target as HTMLElement)?.classList?.contains('hidden') ?? false),
      onBlank: makeStandardOnBlank('handleCellClick: onBlank:'),
      onLose: makeStandardOnLose('handleCellClick: onLose:'),
      onNearby: makeStandardOnNearby('handleCellClick: onNearby:'),
      onReveal: makeStandardOnReveal('handleCellClick: onReveal:'),
      onWin: makeStandardOnWin('handleCellClick: onWin:'),
    };
    const result = revealCell(args as revealCellArgs);
    setCells(result.cells);
    setMineCount(result.mineCount);
    checkWin(result);
  };

  const handleCellDoubleClick: EventHandler<SyntheticEvent> = (
    e: SyntheticEvent
  ) => {
    Logger.trace('double-click', e);
    setGameIsActive(true);
    const args: fnArgs = {
      cells,
      mineCount,
      index: +((e.target as HTMLElement)?.dataset?.index ?? 0),
      hadOverlay:
        (e.target as HTMLElement)?.classList?.contains('hidden') ?? false,
      wasClicked: true,
      continue: true,
      onBlank: makeStandardOnBlank('handleCellDoubleClick: onBlank:'),
      onLose: makeStandardOnLose('handleCellDoubleClick: onLose:'),
      onNearby: makeStandardOnNearby('handleCellDoubleClick: onNearby:'),
      onReveal: makeStandardOnReveal('handleCellDoubleClick: onReveal:'),
      onWin: makeStandardOnWin('handleCellDoubleClick: onWin:'),
    };
    const result = clearAround(args as clearAroundArgs);
    setCells(result.cells);
    setMineCount(result.mineCount);
    checkWin(result);
  };

  const handleCellRightClick: EventHandler<SyntheticEvent> = (
    e: SyntheticEvent
  ) => {
    e.preventDefault();
    setGameIsActive(true);
    Logger.trace('right-click', e);
    const args: fnArgs = {
      cells,
      mineCount,
      index: +((e.target as HTMLElement)?.dataset?.index ?? 0),
      hadOverlay:
        (e.target as HTMLElement)?.classList?.contains('hidden') ?? false,
      wasClicked: true,
      continue: 
        !((e.target as HTMLElement)?.classList?.contains('hidden') ?? false),
      onBlank: makeStandardOnBlank('handleCellRightClick: onBlank:'),
      onLose: makeStandardOnLose('handleCellRightClick: onLose:'),
      onNearby: makeStandardOnNearby('handleCellRightClick: onNearby:'),
      onReveal: makeStandardOnReveal('handleCellRightClick: onReveal:'),
      onWin: makeStandardOnWin('handleCellRightClick: onWin:'),
    };
    const result = flagCell(args as flagCellArgs);
    setCells(result.cells);
    setMineCount(result.mineCount);
    checkWin(result);
  };

  return (
    <Fragment>
      <React.StrictMode>
      <header>
        <Difficulty
          difficulty={difficulty}
          difficultyChanged={handleDifficultyChange}
          width={width}
          widthChanged={handleWidthChange}
          height={height}
          heightChanged={handleHeightChange}
        ></Difficulty>
        <button 
          type="button"
          className="reset"
          onClick={handleRequestForNewBoard}>
          Reset
        </button>  
      </header>
      <main>
        <Scoreboard
          difficulty={difficulty}
          isActive={gameIsActive}
          remaining={mineCount}
          size={`${width}x${height}`}
          ></Scoreboard>
        <Board
          cells={cells}
          cellClick={handleCellClick}
          cellDoubleClick={handleCellDoubleClick}
          cellRightClick={handleCellRightClick}
        ></Board>
        <Dialog id="win" isOpen={false}>
          <header className="dialog-header">
            Success!
          </header>
          <div className='dialog-body'>
            <p>You won! Congrats!</p>
          </div>
          <footer className='dialog-footer'>
            <div className='dialog-buttons'>
              <button type="button" onClick={() => DialogManager.instance.close("win")}>❤️ Noice</button>
            </div>
          </footer>
        </Dialog>
        <Dialog id="loss" isOpen={false}>
          <header className="dialog-header">
            Failure!
          </header>
          <div className='dialog-body'>
            <p>You lose! *Sad trombone*</p>
          </div>
          <footer className='dialog-footer'>
            <div className='dialog-buttons'>
              <button type="button" onClick={() => DialogManager.instance.close("loss")}>💩 That sucks</button>
            </div>
          </footer>
        </Dialog>
      </main>
      <footer></footer>
      </React.StrictMode>
    </Fragment>
  );
};

export default MynSweepr;
