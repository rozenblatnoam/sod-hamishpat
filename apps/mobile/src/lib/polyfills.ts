// @ts-nocheck
// Firebase web SDK uses browser APIs not available in React Native
if (typeof global.DOMRect === 'undefined') {
  (global as any).DOMRect = class DOMRect {
    x: number; y: number; width: number; height: number;
    top: number; left: number; bottom: number; right: number;
    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x; this.y = y; this.width = width; this.height = height;
      this.top = y; this.left = x; this.bottom = y + height; this.right = x + width;
    }
    static fromRect(other?: DOMRectInit) {
      return new DOMRect(other?.x, other?.y, other?.width, other?.height);
    }
    toJSON() {
      return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
  };
}

if (typeof global.DOMRectReadOnly === 'undefined') {
  (global as any).DOMRectReadOnly = (global as any).DOMRect;
}
