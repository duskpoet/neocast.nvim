import { HighlightSet, applyHl } from "./highlight_set";
import { Cell, Highlight } from "./types";
import { invert } from "./util";

export class Grid {
  cursorEl: HTMLElement;

  constructor(
    private container: HTMLElement,
    private cols: number,
    private rows: number,
    private highlights: HighlightSet,
  ) {
    window.addEventListener("resize", () => {
      this.calibrateFontSize();
    });
    this.cursorEl = document.createElement("div");
    this.cursorEl.className = "cursor";
    const cursorColor = this.highlights.getCursorColor();
    this.cursorEl.style.backgroundColor = cursorColor;
    const underCursorStyle = document.getElementById("under-cursor-style") ??
      (() => {
        const el = document.createElement("style");
        el.id = "under-cursor-style";
        document.head.appendChild(el);
        return el;
      })();
    underCursorStyle.innerHTML = `
      .under-cursor {
        color: ${invert(cursorColor)} !important;
      }
    `;

  }

  calibrateFontSize() {
    let fontSize = 30;
    while (true) {
      this.container.style.fontSize = fontSize + "px";
      if (
        fontSize < 10 ||
        (this.container.scrollWidth <= document.body.offsetWidth &&
          this.container.scrollHeight <= document.body.offsetHeight)
      ) {
        break;
      }
      fontSize--;
    }
  }

  clearRow(row: HTMLDivElement) {
    row.innerHTML = "";
    for (let i = 0; i < this.cols; i++) {
      const cell = document.createElement("span");
      cell.className = "cell cell-" + i;
      row.appendChild(cell);
      cell.textContent = " ";
    }
  }

  clear() {
    this.container.innerHTML = "";
    for (let i = 0; i < this.rows; i++) {
      const row = document.createElement("div");
      row.className = "row row-" + i;
      this.clearRow(row);
      this.container.appendChild(row);
    }

    this.calibrateFontSize();
    this.container.appendChild(this.cursorEl);
  }

  drawLine(row: number, colStart: number, cells: Cell[]) {
    const rowEl = this.container.querySelector(".row-" + row)!;
    let currentHl: Highlight = {};
    for (const [char, hlid, repeat = 1] of cells) {
      if (hlid !== undefined) {
        currentHl = this.highlights.getHighlight(hlid) || {};
      }
      for (let i = 0; i < repeat; i++) {
        const cell: HTMLElement = rowEl.querySelector(".cell-" + colStart)!;
        if (!cell) {
          console.error("Cell not found:", row, colStart + i);
          continue;
        }
        colStart++;
        cell.textContent = char;
        applyHl(currentHl, cell);
      }
    }
  }

  setCursorPos(row: number, colStart: number) {
    const rowEl = this.container.querySelector<HTMLDivElement>(".row")!;
    this.cursorEl.style.top = row * rowEl.offsetHeight + "px";
    this.cursorEl.style.left = colStart * 1 + "ch";
    const cursorPos = this.cursorEl.getBoundingClientRect();
    document.querySelectorAll(".under-cursor").forEach((el) => {
      el.classList.remove("under-cursor");
    })
    const charEl = document.elementFromPoint(
      cursorPos.left + cursorPos.width / 2,
      cursorPos.top + cursorPos.height / 2,
    );
    if (charEl) {
      charEl.classList.add("under-cursor");
    }
  }

  performScroll(top: number,
    bottom: number,
    left: number,
    right: number,
    rows: number,
  ) {
    const rowsEl = this.container.querySelectorAll<HTMLDivElement>(".row");
    if (rows > 0) {
      for (let i = top; i < bottom; i++) {
        if (i < bottom - rows) {
          for (let j = left; j < right; j++) {
            rowsEl[i].querySelector(`.cell-${j}`)!.innerHTML = rowsEl[i + rows].querySelector(`.cell-${j}`)!.innerHTML;
          }
        } else {
          for (let j = left; j < right; j++) {
            rowsEl[i].querySelector(`.cell-${j}`)!.innerHTML = " ";
          }
        }
      }
    } else if (rows < 0) {
      for (let i = top; i < bottom; i++) {
        if (i < bottom + rows) {
          for (let j = left; j < right; j++) {
            rowsEl[i].querySelector(`.cell-${j}`)!.innerHTML = rowsEl[i - rows].querySelector(`.cell-${j}`)!.innerHTML;
          }
        } else {
          for (let j = left; j < right; j++) {
            rowsEl[i].querySelector(`.cell-${j}`)!.innerHTML = " ";
          }
        }
      }
    }
  }
}
