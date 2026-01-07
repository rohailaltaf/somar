/**
 * Convert oklch color to hex format for React Native compatibility.
 * React Native/Reanimated doesn't support oklch colors.
 */

// oklch to OKLab conversion
function oklchToOklab(l: number, c: number, h: number): [number, number, number] {
  const hRad = (h * Math.PI) / 180;
  return [l, c * Math.cos(hRad), c * Math.sin(hRad)];
}

// OKLab to linear RGB
function oklabToLinearRgb(l: number, a: number, b: number): [number, number, number] {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
}

// Linear RGB to sRGB
function linearToSrgb(c: number): number {
  if (c <= 0.0031308) {
    return 12.92 * c;
  }
  return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// Convert to hex
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c));
    const hex = Math.round(clamped * 255)
      .toString(16)
      .padStart(2, "0");
    return hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert an oklch color string to hex.
 * If the color is already in a supported format (hex, rgb), returns it as-is.
 */
export function oklchToHex(color: string): string {
  // If already hex or rgb, return as-is
  if (color.startsWith("#") || color.startsWith("rgb")) {
    return color;
  }

  // Parse oklch(L C H) format
  const match = color.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!match) {
    // Fallback for unparseable colors
    return "#6366f1";
  }

  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);

  const [labL, labA, labB] = oklchToOklab(l, c, h);
  const [linR, linG, linB] = oklabToLinearRgb(labL, labA, labB);
  const sR = linearToSrgb(linR);
  const sG = linearToSrgb(linG);
  const sB = linearToSrgb(linB);

  return rgbToHex(sR, sG, sB);
}
