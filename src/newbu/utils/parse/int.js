"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.int = void 0;
function int(s, radix = 10) {
    if (typeof s === 'number')
        return s;
    return parseInt(s.replace(/[,\.](?=.*[,\.])/g, '').replace(',', '.'), radix);
}
exports.int = int;
