"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hex = void 0;
function hex(value, padding = 2) {
    return value.toString(16).padStart(padding, '0');
}
exports.hex = hex;
