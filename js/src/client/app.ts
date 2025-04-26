import { Grid } from "./grid";
import { HighlightSet } from "./highlight_set";
import { NvimEvent, RedrawPayload } from "./types";
import { color } from "./util";

export class App {
  grids: Map<number, Grid> = new Map();
  highlights = new HighlightSet();
  constructor(private container: HTMLElement) { }


  getDimensions() {
    const { width, height } = this.container.getBoundingClientRect();
    const span = document.createElement("span");
    span.style.visibility = "hidden";
    span.style.position = "absolute";
    span.style.whiteSpace = "pre";
    span.textContent = "X"; // Use a representative character
    document.body.appendChild(span);
    const { width: charWidth, height: charHeight } =
      span.getBoundingClientRect();
    document.body.removeChild(span);
    return {
      cols: Math.floor(width / charWidth),
      rows: Math.floor(height / charHeight),
    };
  }

  listen() {
    const events = new EventSource("/events");
    events.addEventListener("nvim", (event) => {
      const data = JSON.parse(event.data) as NvimEvent;
      console.log("Received message:", data.event);
      if (data.event === "redraw") {
        for (const payload of data.payload) {
          console.log(payload);
          this.handleRedraw(payload);
        }
      }
    });
    events.addEventListener("xerror", (event) => {
      const data = JSON.parse(event.data) as Error;
      this.displayError(data.message);
    })

  }

  displayError(message: string) {
    this.container.innerHTML = `
          <div style="color: red; font-weight: bold;">
            Error: ${message}
          </div>
          <div style="color: black;">
            Please check the console for more details.
          </div>
        `;
  }


  handleRedraw(payload: RedrawPayload) {
    if (payload[0] === "grid_resize") {
      console.log("grid_resize");
      const [_, ...rest] = payload;
      for (const [gridId, width, height] of rest) {
        if (this.grids.has(gridId)) {
          continue;
        }
        this.grids.set(
          gridId,
          new Grid(this.container, width, height, this.highlights),
        );
      }
    } else if (payload[0] === "grid_line") {
      const [_, ...rest] = payload;
      for (const [gridId, row, colStart, cells, _wrap] of rest) {
        const grid = this.grids.get(gridId);
        if (grid) {
          grid.drawLine(row, colStart, cells);
        }
      }
    } else if (payload[0] === "grid_clear") {
      const [_, ...rest] = payload;
      for (const [gridId] of rest) {
        const grid = this.grids.get(gridId);
        if (grid) {
          grid.clear();
        }
      }
    } else if (payload[0] === "default_colors_set") {
      const [_, ...rest] = payload;
      for (const [rgb_fg, rgb_bg, _rgb_sp] of rest) {
        this.container.style.color = color(rgb_fg);
        this.container.style.backgroundColor = color(rgb_bg);
      }
    } else if (payload[0] === "hl_attr_define") {
      const [_, ...rest] = payload;
      for (const [hlid, attrs] of rest) {
        this.highlights.addHighlight(hlid, attrs);
      }
    } else if (payload[0] === "grid_cursor_goto") {
      const [_, ...rest] = payload;
      for (const [gridId, row, col] of rest) {
        const grid = this.grids.get(gridId);
        if (grid) {
          grid.setCursorPos(row, col);
        }
      }
    } else if (payload[0] === "hl_group_set") {
      const [_, ...rest] = payload;
      for (const [name, hlid] of rest) {
        if (name === "Cursor") {
          this.highlights.setCursorHighlight(hlid);
        }
      }
    } else if (payload[0] === "grid_scroll") {
      return;
      // const [_, ...rest] = payload;
      // for (const [gridId, top, bot, left, right, rows] of rest) {
      //   const grid = this.grids.get(gridId);
      //   if (grid) {
      //     grid.performScroll(top, bot, left, right, rows);
      //   }
      // }
    }
  }
}
