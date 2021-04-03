import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './style.scss';
import * as san from './sancheese.png';
import * as tile from './resourses/minesweeper/minesweeperTile.png';
import * as flag from './resourses/minesweeper/minesweeperTileFlag.png';
import * as hidden from './resourses/minesweeper/minesweeperTileHidden.png';
import * as mine from './resourses/minesweeper/minesweeperTileMine.png';

let isOver = false;

function MenuList() {
  return (
    <ul>
      <li>Home</li>
      <li>Other</li>
      <li>About</li>
    </ul>
  );
}

function Title() {
  return <h1>MINESWEEPER</h1>;
}

class TopBar extends React.Component {
  render() {
    return (
      <header className='header-menu'>
        <Title />
      </header>
    );
  }
}

interface CellProps {
  xy: number;
  num: number;
  onUnhidden: () => void;
  onGameOver: (win: boolean) => void;
}

interface CellState {
  isHidden: boolean;
  isFlagged: boolean;
}

class Cell extends React.Component<CellProps, CellState> {
  xy: number;
  isMine: boolean;
  adjacentMinesCount: number;

  constructor(props: CellProps) {
    super(props);
    this.xy = props.xy;
    this.isMine = props.num === 9 ?? false;
    this.adjacentMinesCount = props.num;

    this.state = { isHidden: true, isFlagged: false };

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e: React.MouseEvent<HTMLImageElement>) {
    e.preventDefault();
    if (isOver) return;
    if (e.button === 0 && this.state.isFlagged) return;
    if (e.button === 0) this.setState({ isHidden: false });
    if (e.button === 2) this.setState({ isFlagged: !this.state.isFlagged });
  }

  componentDidUpdate() {
    if (!this.state.isHidden && this.isMine) {
      this.props.onGameOver(false);
    } else if (!this.state.isHidden) this.props.onUnhidden();
  }

  render() {
    //if (isOver && !this.state.isFlagged) this.setState({isHidden: false});
    if (this.state.isHidden) {
      if (this.state.isFlagged)
        return (
          <img
            className='numbers'
            src={flag}
            draggable='false'
            onMouseDown={this.handleClick}
            onContextMenu={(e) => {
              e.preventDefault();
            }}
          />
        );
      return (
        <img
          className='numbers'
          src={hidden}
          draggable='false'
          onMouseDown={this.handleClick}
          onContextMenu={(e) => {
            e.preventDefault();
          }}
        />
      );
    } else {
      let el: JSX.Element;
      switch (this.props.num) {
        case 9:
          el = (
            <img
              className='numbers'
              src={mine}
              draggable='false'
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            />
          );
          break;

        case 0:
          el = (
            <img
              className='numbers'
              src={tile}
              draggable='false'
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            />
          );
          break;

        default:
          el = (
            <input
              className='numbers'
              value={this.props.num}
              readOnly={true}
              style={{ backgroundImage: 'url(' + tile + ')' }}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            />
          );
          break;
      }
      return el;
    }
  }
}

interface BoardProps {
  width: number;
  height: number;
}

interface BoardState {
  cells: CellsState[];
}

interface CellsState {
  isFlagged: boolean;
  isHidden: boolean;
}

function* idMaker() {
  let index = 0;
  while (true) yield index++;
}

class GameFrame extends React.Component<BoardProps, BoardState> {
  gameMap: JSX.Element[];
  hiddenCellsCount: number;
  minesCount: number;
  width: number;
  height: number;
  cellsDataHolder: number[];

  constructor(props: BoardProps) {
    super(props);
    this.width = props.width;
    this.height = props.height;
    this.hiddenCellsCount = props.width * props.height;
    this.minesCount = 20;
    this.cellFromXY = this.cellFromXY.bind(this);
    this.randomCell = this.randomCell.bind(this);
    this.changeHiddenCounter = this.changeHiddenCounter.bind(this);
    this.gameOver = this.gameOver.bind(this);
    this.getNeighbourMinesCount = this.getNeighbourMinesCount.bind(this);

    this.gameMap = [];

    this.cellsDataHolder = new Array<number>(this.hiddenCellsCount).fill(0);

    let minesXY = this.randomCell();
    for (let m = this.minesCount; m > 0; m--) {
      while (this.cellsDataHolder[minesXY]) {
        minesXY = this.randomCell();
      }
      this.cellsDataHolder[minesXY] = 9;
    }

    for (let y = 0; y < this.width; y++) {
      for (let x = 0; x < this.height; x++) {
        let currCell = this.cellFromXY(x, y) ?? 0;
        if (this.cellsDataHolder[currCell] === 9) continue;
        this.cellsDataHolder[currCell] = this.getNeighbourMinesCount(x, y);
      }
    }

    let getRowId = idMaker();
    let getCellId = idMaker();
    let getExId = idMaker();

    console.log(this.cellsDataHolder);
    this.gameMap = new Array<JSX.Element>(this.height).fill(<div />).map<JSX.Element>(() => (
      <section key={Number(getRowId.next().value)} className='minesweeper-row'>
        {new Array<JSX.Element>(this.width).fill(<div />).map<JSX.Element>(() => (
          <Cell
            key={Number(getRowId.next().value)}
            xy={Number(getCellId.next().value)}
            num={this.cellsDataHolder[Number(getExId.next().value)]}
            onUnhidden={this.changeHiddenCounter}
            onGameOver={this.gameOver}
          />
        ))}
      </section>
    ));
  }

  getNeighbourMinesCount(currX: number, currY: number): number {
    let mines = 0;
    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        let checkX = currX + x;
        let checkY = currY + y;

        if (checkX >= 0 && checkX < this.width && checkY >= 0 && checkY < this.height) {
          if (this.cellsDataHolder[this.cellFromXY(checkX, checkY) ?? 0] === 9) {
            mines++;
          }
        }
      }
    }
    return mines;
  }

  cellFromXY(x: number, y: number): number | null {
    if (x < 0 || x >= this.width) return null;
    if (y < 0 || y >= this.height) return null;
    return x + y * this.width;
  }

  randomCell(): number {
    let x = Math.floor(Math.random() * this.width);
    let y = Math.floor(Math.random() * this.height);

    return this.cellFromXY(x, y) ?? 0;
  }

  changeHiddenCounter() {
    this.hiddenCellsCount -= 1;
    if (this.hiddenCellsCount === this.minesCount) this.gameOver(true);
  }

  gameOver(win: boolean) {
    isOver = true;
    window.alert(win ? 'You win!!' : 'D:');
  }

  render() {
    return <div className='field'>{this.gameMap}</div>;
  }
}

class GameSwitch extends React.Component {
  render() {
    return <input type='image' src={san} alt='oops' width={50} height={50} />;
  }
}

class FrameController extends React.Component {
  render() {
    return (
      <div>
        <GameFrame width={10} height={10} />
      </div>
    );
  }
}

class MainZone extends React.Component {
  render() {
    return (
      <div className='main-zone'>
        <FrameController />
      </div>
    );
  }
}

class RootComponent extends React.Component {
  render() {
    return (
      <div className='display'>
        <TopBar />
        <MainZone />
      </div>
    );
  }
}

//window.addEventListener('contextmenu', (e) => {e.preventDefault()})

const container = document.createElement('div');
document.body.appendChild(container);
ReactDOM.render(<RootComponent />, container);
