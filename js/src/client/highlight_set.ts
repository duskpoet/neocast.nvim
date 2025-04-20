import { HlId, Highlight } from "./types";
import { color } from "./util";

export class HighlightSet {
  highlights = new Map<HlId, Highlight>();
  cursorHlId = 0;

  addHighlight(hlId: HlId, highlight: Highlight) {
    this.highlights.set(hlId, highlight);
  }

  getHighlight(hlId: HlId) {
    return this.highlights.get(hlId);
  }

  setCursorHighlight(hlId: HlId) {
    this.cursorHlId = hlId;
  }

  getCursorColor() {
    const hl = this.highlights.get(this.cursorHlId);
    if (hl?.background) {
      return color(hl.background);
    }
    return "#fff";
  }
}

export function applyHl(hl: Highlight, el: HTMLElement) {
  if (hl.foreground) {
    el.style.color = color(hl.foreground);
  } else {
    el.style.color = "";
  }
  if (hl.background) {
    el.style.backgroundColor = color(hl.background);
  } else {
    el.style.backgroundColor = "";
  }
  if (hl.bold) {
    el.style.fontWeight = "bold";
  } else {
    el.style.fontWeight = "";
  }
  if (hl.italic) {
    el.style.fontStyle = "italic";
  } else {
    el.style.fontStyle = "";
  }
  if (hl.underline || hl.undercurl) {
    el.style.textDecoration = "underline";
  } else if (hl.strikethrough) {
    el.style.textDecoration = "line-through";
  } else {
    el.style.textDecoration = "";
  }
}
