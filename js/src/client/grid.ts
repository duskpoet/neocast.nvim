import { HighlightSet, applyHl } from "./highlight_set";
import { Cell, Highlight } from "./types";
import { invert } from "./util";

export class Grid {
  calibrated = false;
  constructor(
    private container: HTMLElement,
    private cols: number,
    private rows: number,
    private highlights: HighlightSet,
  ) {
    window.addEventListener("resize", () => {
      this.calibrateFontSize();
    });
    const cursorColor = this.highlights.getCursorColor();
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
        background-color: ${cursorColor} !important;
      }
    `;

  }

  calibrateFontSize() {
    if (this.calibrated) {
      return;
    }
    this.calibrated = true;
    let fontSize = 30;
    const calibrateAndCheck = () => {
      this.container.style.fontSize = fontSize + "px";
      window.requestAnimationFrame(() => {
        console.log("Font size:", fontSize);
        console.log("Container size:", this.container.scrollWidth, this.container.scrollHeight);
        console.log("Body size:", document.body.offsetWidth, document.body.offsetHeight);
        if (
          fontSize < 10 ||
          (this.container.scrollWidth <= document.body.offsetWidth &&
            this.container.scrollHeight <= document.body.offsetHeight)
        ) {
          return;
        }
        fontSize--;
        calibrateAndCheck();
      });
    }
    calibrateAndCheck();
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
    document.querySelectorAll(".under-cursor").forEach((el) => {
      el.classList.remove("under-cursor");
    })
    const charEl = this.container.querySelector(`.row-${row} .cell-${colStart}`);
    if (charEl) {
      charEl.classList.add("under-cursor");
    }
  }
}
