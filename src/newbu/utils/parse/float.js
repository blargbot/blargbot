"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.float = void 0;
function float(s) {
    if (typeof s === 'number')
        return s;
    return parseFloat(s.replace(/[,\.](?=.*[,\.])/g, '').replace(',', '.'));
}
exports.float = float;
