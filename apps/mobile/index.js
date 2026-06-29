// Polyfills for browser APIs used by web-targeting libraries.
// Must run before any module is required.
const _g = typeof globalThis !== 'undefined' ? globalThis : global;

try {
  if (!_g.DOMRect) {
    _g.DOMRect = class DOMRect {
      constructor(x, y, width, height) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = width || 0;
        this.height = height || 0;
        this.top = Math.min(this.y, this.y + this.height);
        this.left = Math.min(this.x, this.x + this.width);
        this.bottom = Math.max(this.y, this.y + this.height);
        this.right = Math.max(this.x, this.x + this.width);
      }
      static fromRect(other) {
        return new _g.DOMRect(other && other.x, other && other.y, other && other.width, other && other.height);
      }
      toJSON() {
        return { x: this.x, y: this.y, width: this.width, height: this.height, top: this.top, left: this.left, bottom: this.bottom, right: this.right };
      }
    };
  }
} catch (_e) {
  _g.DOMRect = function DOMRect(x, y, w, h) {
    this.x = x || 0; this.y = y || 0; this.width = w || 0; this.height = h || 0;
    this.top = this.y; this.left = this.x; this.bottom = this.y + this.height; this.right = this.x + this.width;
  };
}

try {
  if (!_g.DOMRectReadOnly) _g.DOMRectReadOnly = _g.DOMRect;
} catch (_e) {}

try {
  if (!_g.structuredClone) {
    _g.structuredClone = function(obj) { return JSON.parse(JSON.stringify(obj)); };
  }
} catch (_e) {}

require('expo-router/entry');
