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
  useRef,
  MouseEventHandler,
} from 'react';
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
  clearAroundArgs,
  revealCellArgs,
  showCellArgs,
  flagCellArgs,
} from './fn-mineboard';

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
  const [gameState, setGameState] = useState<'unknown'|'lost'|'won'>('unknown');
  const [checkForHighScore, setCheckForHighScore] = useState(true);

  // const setRowsAndColumns = () => {
  //   setRows();
  //   setColumns();
  // };

  const closeModal: MouseEventHandler = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    const dialog = e.currentTarget.closest('dialog');
    if (dialog && dialog.open) {
      dialog.close();
    }
  }

  const resetBoard = () => {
    const board = generateBoard({ width, height, density: 1 / 6 });
    setCells(() => board.cells);
    setMineCount(() => board.mineCount);
    setGameIsActive(false);
    setCheckForHighScore(false);
  };

  const setRows = () => {
    document.documentElement.style.setProperty('--rows', height.toString());
  };

  const setColumns = () => {
    document.documentElement.style.setProperty('--columns', width.toString());
  };

  function usePrevious(value: string | number) {
    const ref = useRef<string | number>();
    useEffect(() => {
      ref.current = value;
    })
    return ref.current;
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
      setCheckForHighScore(false);
      setCheckForHighScore(true);
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

  const makeStandardOnBlank = (extraToLog: string) => (args: fnArgs) => {
    console.log(`${extraToLog} onBlank: args: ${JSON.stringify(args)}`);
    args.continue = true;
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
        resetBoard();
      });
    }
  };

  const showWinModal = () => {
    const winModal = document.getElementById('win') as HTMLDialogElement;
    if (winModal && typeof winModal.showModal === 'function' && !winModal.open) {
      winModal.showModal();
      winModal.addEventListener('close', () => {
        resetBoard();
      });
    }
  };

  const makeStandardOnLose = (extraToLog: string) => (args: fnArgs) => {
    setGameIsActive(false);
    args.cells = showAllCells(args.cells);
    console.log(`${extraToLog} onLose: args: ${JSON.stringify(args)}`);
    showLoseModal();
    setCells(args.cells);
    setMineCount(args.mineCount);
    return args;
  };

  const makeStandardOnWin = (extraToLog: string) => (args: fnArgs) => {
    setGameIsActive(false);
    args.cells = showAllCells(args.cells);
    console.log(`${extraToLog} onWin: args: ${JSON.stringify(args)}`);
    setCheckForHighScore(true);
    showWinModal();
    setCells(args.cells);
    setMineCount(args.mineCount);
    return args;
  };

  const makeStandardOnNearby = (extraToLog: string) => (args: fnArgs) => {
    console.log(`${extraToLog} onNearby: args: ${JSON.stringify(args)}`);
    setCells(args.cells);
    setMineCount(args.mineCount);
    return args;
  };

  const makeStandardOnReveal = (extraToLog: string) => (args: fnArgs) => {
    console.log(`${extraToLog} onReveal: args: ${JSON.stringify(args)}`);
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
      cells: newCells,
      continue: !cellToUpdate.hadOverlay
    };
    if (!cellToUpdate.hadOverlay) {
      args = showCell(args as showCellArgs);
    }
    setCells(args.cells);
    setMineCount(args.mineCount);
    return args;
  };

  const makeDoubleClickOnReveal = (extraToLog: string) => (args: fnArgs) => {
    console.log(`${extraToLog} onReveal: args: ${JSON.stringify(args)}`);
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
      cells: newCells,
      continue: false
    };
    if (!cellToUpdate.hadOverlay && !cellToUpdate.flag) {
      args = showCell(args as showCellArgs);
    }
    setCells(args.cells);
    setMineCount(args.mineCount);
    return args;
  };

  const handleCellClick: EventHandler<SyntheticEvent> = (e: SyntheticEvent) => {
    console.log('click', e);
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
  };

  const handleCellDoubleClick: EventHandler<SyntheticEvent> = (
    e: SyntheticEvent
  ) => {
    console.log('double-click', e);
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
      onReveal: makeDoubleClickOnReveal('handleCellDoubleClick: onReveal:'),
      onWin: makeStandardOnWin('handleCellDoubleClick: onWin:'),
    };
    const result = clearAround(args as clearAroundArgs);
    setCells(result.cells);
    setMineCount(result.mineCount);
  };

  const handleCellRightClick: EventHandler<SyntheticEvent> = (
    e: SyntheticEvent
  ) => {
    e.preventDefault();
    setGameIsActive(true);
    console.log('right-click', e);
    const cell = cells[+((e.target as HTMLElement)?.dataset?.index ?? 0)];
    if (!cell.hidden) {
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
      onBlank: makeStandardOnBlank('handleCellRightClick: onBlank:'),
      onLose: makeStandardOnLose('handleCellRightClick: onLose:'),
      onNearby: makeStandardOnNearby('handleCellRightClick: onNearby:'),
      onReveal: makeStandardOnReveal('handleCellRightClick: onReveal:'),
      onWin: makeStandardOnWin('handleCellRightClick: onWin:'),
    };
    const result = flagCell(args as flagCellArgs);
    setCells(result.cells);
    setMineCount(result.mineCount);
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
      </header>
      <main>
        <Scoreboard
          isActive={gameIsActive}
          remaining={mineCount}
          checkHighScore={checkForHighScore}
          size={`${width}x${height}`}
          ></Scoreboard>
        <Board
          cells={cells}
          cellClick={handleCellClick}
          cellDoubleClick={handleCellDoubleClick}
          cellRightClick={handleCellRightClick}
        ></Board>
        <dialog id="win">
          <header className="dialog-header">
            <h1>You won!</h1>
          </header>
          <section className="dialog-content">
            <p>You found all the mines in a short amount of time. Or something.</p>
          </section>
          <footer className="dialog-footer">
            <button className="dialog-okay" onClick={closeModal}>Great 🎉</button>
          </footer>
        </dialog>
        <dialog id="lose">
          <header className="dialog-header">
            <h1>You lose!</h1>
          </header>
          <section className="dialog-content">
            <p>You tripped on a mine. Or something.</p>
          </section>
          <footer className="dialog-footer">
            <button className="dialog-okay" onClick={closeModal}>That blows 💩</button>
          </footer>
        </dialog>
      </main>
      <footer></footer>
      </React.StrictMode>
    </Fragment>
  );
};

export default MynSweepr;
