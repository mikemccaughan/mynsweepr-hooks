export interface Cell {
    val: number;
    hasMine: boolean;
    nearby: number;
    x: number;
    y: number;
    index: number;
    hidden: boolean;
    flag: boolean;
    hadOverlay: boolean;
    wasClicked?: boolean;
}

function getRandom(maxValue: number): number {
    const max = 4294967295; // Max Uint32
    const randomValue = window.crypto.getRandomValues(new Uint32Array(1))[0] / max;
    return Math.floor(randomValue * maxValue);
    // return Math.floor(Math.random() * maxValue);
}

function getMineCount(cells: Cell[]): number;
function getMineCount(boardCells: number[][]): number;
function getMineCount(cells: (Cell[]) | (number[][])): number {
    if (cells.length && (cells[0] as number[]).length) {
        const boardCells = cells as number[][];
        return boardCells.reduce((agg: number, cur: number[]) => agg = cur.reduce((a: number, c: number) => a += (c < 0 ? 1 : 0), agg), 0);
    } else if (cells.length && (cells[0] as Cell).index !== undefined) {
        const cellCells = cells as Cell[];
        return cellCells.filter((cell: Cell) => cell.hasMine && !cell.flag).length;
    }
    return 0;
}

export function generateBoard(options: {width?: number; height?: number; density?: number;}): { cells: Cell[], mineCount: number } {
    const width = options.width ?? 9;
    const height = options.height ?? 9;
    const density = options.density ?? (1 / 6);
    if (width < 1) throw new Error(`width must be >= 1, got ${width}`);
    if (height < 1) throw new Error(`height must be >= 1, got ${height}`);
    if (density <= 0 || density >= 1) throw new Error(`density must be > 0 and < 1, got ${density}`);
    const isBetween = (value: number, min: number, max: number): boolean => value >= min && value <= max;
    let cells = new Array(width * height);
    const mineCount = Math.floor(width * height * density);
    const boardCells = new Array(height).fill(0).map(() => new Array(width).fill(0)) as number[][];
    const value = -(mineCount * 2);
    for (let i = 0; i < mineCount; i++) {
        let x = 0;
        let y = 0;
        let stop = false;
        while (!stop) {
            x = getRandom(width);
            y = getRandom(height);
            if (boardCells[y][x] >= 0) {
                stop = true;
                break;
            }
        }

        for (let m = -1; m < 2; m++) {
            for (let n = -1; n < 2; n++) {
                if (n === 0 && m === 0) {
                    boardCells[y][x] = value;
                } else if (isBetween(y + n, 0, height - 1) && isBetween(x + m, 0, width - 1)) {
                    boardCells[y + n][x + m]++;
                }
            }
        }
    }

    console.log('board', JSON.stringify(boardCells, null, 2));
    const actualMineCount = getMineCount(boardCells);
    if (actualMineCount > mineCount) {
        console.warn(`Too many mines! target: ${mineCount}; actual: ${actualMineCount}`);
    }

    cells = createCells(width, height, boardCells);

    return { cells, mineCount };
}

function createCells(width: number, height: number, boardCells: number[][]): Cell[] {
    const cells: Cell[] = [];
    let index = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = index;
            cells[index++] = {
                val: boardCells[y][x],
                hasMine: boardCells[y][x] < 0,
                nearby: boardCells[y][x] >= 0 ? boardCells[y][x] : 0,
                x: x,
                y: y,
                index: i,
                hidden: true,
                flag: false,
                hadOverlay: false
            };
        }
    }

    return cells;
}

export interface fnArgs {
    cells: Cell[];
    mineCount: number;
    index: number;
    hadOverlay?: boolean;
    wasClicked?: boolean;
    continue?: boolean;
    onLose?: (args: fnArgs) => fnArgs;
    onBlank?: (args: fnArgs) => fnArgs;
    onNearby?: (args: fnArgs) => fnArgs;
    onWin?: (args: fnArgs) => fnArgs;
    onReveal?: (args: fnArgs) => fnArgs;
}

export interface clearAroundArgs extends fnArgs {
    width: number;
    height: number;
}

export function clearAround(args: clearAroundArgs): fnArgs {
    const displayArgs = { ...args, cells: [args.cells[args.index]] };
    console.log(`clearAround: args: ${JSON.stringify(displayArgs, null, 2)}`);
    const cell = args.cells[args.index];
    const minX = cell.x === 0 ? 0 : cell.x - 1;
    const maxX = cell.x === args.width - 1 ? cell.x : cell.x + 1;
    const minY = cell.y === 0 ? 0 : cell.y - 1;
    const maxY = cell.y === args.height - 1 ? cell.y : cell.y + 1;
    let revealCellArgs: fnArgs = {
        cells: updateCellAtIndex({
            cells: args.cells, 
            index: args.index, 
            propertyName: 'hidden', 
            propertyValue: false
        }),
        mineCount: args.mineCount,
        index: args.index,
        hadOverlay: cell.hadOverlay,
        wasClicked: false,
        continue: args.continue ?? false,
        onLose: args.onLose,
        onBlank: args.onBlank,
        onNearby: args.onNearby,
        onWin: args.onWin,
        onReveal: args.onReveal
    };
    for (let x = minX; x < maxX + 1; x++) {
        for (let y = minY; y < maxY + 1; y++) {
            const nextCell = args.cells.find(c => c.x === x && c.y === y);
            if (nextCell && nextCell.index !== args.index && nextCell.hidden && !nextCell.flag && args.continue) {
                console.log(`revealing cell at index ${nextCell.index} due to clearAround on ${cell.index}...`);
                revealCellArgs = {...revealCellArgs, index: nextCell.index, hadOverlay: nextCell.hadOverlay };
                revealCellArgs = revealCell(revealCellArgs as revealCellArgs);
            }
        }
    }
    revealCellArgs.mineCount = getMineCount(revealCellArgs.cells);
    return revealCellArgs;
}

interface updateCellArgs {
    cells: Cell[];
    index: number;
    propertyName: string;
    propertyValue: number | boolean;
}

function updateCellAtIndex(args: updateCellArgs): Cell[] {
    const displayArgs = { ...args, cells: [args.cells[args.index]] };
    console.log(`updateCellAtIndex: args: ${JSON.stringify(displayArgs, null, 2)}`);
    const cellToChange = args.cells.find(c => c.index === args.index);
    if (typeof cellToChange === 'undefined') {
        console.warn(`Unable to find a cell at index ${args.index}. Giving up...`);
        return args.cells;
    }
    const cellsBefore = args.cells.filter(c => c.index < args.index);
    const cellsAfter = args.cells.filter(c => c.index > args.index);
    const changedCell = { ...cellToChange, [args.propertyName]: args.propertyValue };
    const newCells = [ 
        ...cellsBefore,
        changedCell,
        ...cellsAfter
    ];
    return newCells;
}

export interface revealCellArgs extends fnArgs {
    hadOverlay: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface showCellArgs extends fnArgs {
}

export function revealCell(args: revealCellArgs): fnArgs {
    const displayArgs = { ...args, cells: [args.cells[args.index]] };
    console.log(`revealCell: args: ${JSON.stringify(displayArgs, null, 2)}`);
    if (args.onReveal) args = args.onReveal(args) as revealCellArgs;
    if (args.cells[args.index].flag) {
        // Do nothing if the cell is flagged
        console.log(`Not revealing ${args.index} because it has a flag`);
        return args;
    }
    args = {
        ...args,
        cells: updateCellAtIndex({
            cells: args.cells, 
            index: args.index, 
            propertyName: 'hadOverlay', 
            propertyValue: args.hadOverlay
        })
    };
    return showCell(args as showCellArgs);
}

export function showCell(args: showCellArgs): fnArgs {
    const displayArgs = { ...args, cells: [args.cells[args.index]] };
    console.log(`showCell: args: ${JSON.stringify(displayArgs, null, 2)}`);
    const cell = args.cells[args.index];
    args = {
        ...args,
        cells: updateCellAtIndex({
            cells: args.cells, 
            index: args.index, 
            propertyName: 'hidden', 
            propertyValue: false
        })
    };
    if (cell.hasMine) {
        args = {
            ...args,
            cells: updateCellAtIndex({
                cells: args.cells,
                index: args.index,
                propertyName: 'hasMine',
                propertyValue: true
            })
        };
    }
    if (cell.hasMine && args.onLose) {
        args = args.onLose(args);
    } else if (cell.nearby === 0 && args.onBlank) {
        args = args.onBlank(args);
    } else if (args.mineCount === 0 && args.onWin) {
        args = args.onWin(args);
    } else if (cell.nearby > 0 && args.onNearby) {
        args = args.onNearby(args);
    }

    args.mineCount = getMineCount(args.cells);
    return args;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface flagCellArgs extends fnArgs {
}

export function flagCell(args: flagCellArgs): fnArgs {
    const displayArgs = { ...args, cells: [args.cells[args.index]] };
    console.log(`flagCell: args: ${JSON.stringify(displayArgs, null, 2)}`);
    const cell = args.cells[args.index];
    const returnArgs = {
        ...args,
        cells: updateCellAtIndex({
            cells: args.cells, 
            index: args.index, 
            propertyName: 'flag', 
            propertyValue: !cell.flag
        })
    };
    returnArgs.mineCount = getMineCount(returnArgs.cells);
    return returnArgs;
}

export function showAllCells(cells: Cell[]): Cell[] {
    console.log(`showAllCells: cells: ${JSON.stringify(cells, null, 2)}`);
    return [
        ...cells.filter(c => !c.hidden),
        ...cells.filter(c => c.hidden).map(c => ({
            ...c,
            hidden: false
        }))
    ].sort((a, b) => a.index - b.index);
}