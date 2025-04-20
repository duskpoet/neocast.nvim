type R<E, P> = [E, ...P[]];
type GridId = number;
type Width = number;
type Height = number;
type Row = number;
type ColStart = number;
type Wrap = boolean;
export type HlId = number;
type Repeat = number;
export type Cell = [string, HlId?, Repeat?];
export type RGB = number | string;
export type Highlight = {
  foreground?: RGB;
  background?: RGB;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  undercurl?: boolean;
  strikethrough?: boolean;
  fg_indexed?: boolean;
  bg_indexed?: boolean;
};
export type RedrawPayload =
  | R<"grid_resize", [GridId, Width, Height]>
  | R<"grid_line", [GridId, Row, ColStart, Cell[], Wrap]>
  | R<"grid_clear", [GridId]>
  | R<"grid_cursor_goto", [GridId, Row, ColStart]>
  | R<"grid_scroll", [GridId, number, number, number, number, number]>
  | R<"default_colors_set", [RGB, RGB, RGB]>
  | R<"hl_attr_define", [HlId, Highlight, Highlight]>
  | R<"hl_group_set", [string, HlId]>

export type NvimEvent =
  | {
    event: "redraw";
    payload: RedrawPayload[];
  }
  | {
    event: "ready";
    payload: { columns: number; rows: number };
  };
