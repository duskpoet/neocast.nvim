export function color(rgb: number | string) {
  if (typeof rgb === "string") {
    return rgb;
  }
  return "#" + rgb.toString(16).padStart(6, "0");
}

export const invert = (color: string) => {
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `#${((1 << 24) - 1 - (r << 16) - (g << 8) - b).toString(16).padStart(6, "0")}`;
  }
  return color;
}

// Define the color palette
const PALETTE = [
  // Basic 16 colors
  "#000000",
  "#800000",
  "#008000",
  "#808000",
  "#000080",
  "#800080",
  "#008080",
  "#c0c0c0",
  "#808080",
  "#ff0000",
  "#00ff00",
  "#ffff00",
  "#0000ff",
  "#ff00ff",
  "#00ffff",
  "#ffffff",
  // 216 colors
  ...Array.from({ length: 216 }, (_, i) => {
    const r = Math.floor(i / 36) * 51;
    const g = Math.floor((i % 36) / 6) * 51;
    const b = (i % 6) * 51;
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }),
  // 24 grayscale colors
  ...Array.from({ length: 24 }, (_, i) => {
    const value = 8 + i * 10;
    return `#${value.toString(16).padStart(2, "0").repeat(3)}`;
  }),
];

function xtermToHex(xtermColor: number) {
  // Ensure the input is within the valid range (0-255)
  if (xtermColor < 0 || xtermColor > 255) {
    throw new Error("Invalid XTerm-256 color code. Must be between 0 and 255.");
  }

  return PALETTE[xtermColor];
}

// Example usage
console.log(xtermToHex(196)); // Output: #ff0000 (bright red)
console.log(xtermToHex(46)); // Output: #00ff00 (bright green)
console.log(xtermToHex(21)); // Output: #0000ff (bright blue)
