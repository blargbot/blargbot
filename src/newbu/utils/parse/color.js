"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.color = void 0;
const colors_json_1 = __importDefault(require("../../../../res/colors.json"));
const randInt_1 = require("../randInt");
const hex_1 = require("./hex");
const colors = colors_json_1.default;
function color(text) {
    if (typeof text == 'number')
        return text;
    if (typeof text != 'string')
        return null;
    text = text.replace(/\s+/g, '').toLowerCase();
    let name = text.toLowerCase().replace(/[^a-z]/g, '');
    if (name == 'random')
        return randInt_1.randInt(0, 0xffffff);
    //By name
    if (name in colors)
        return parseInt(colors[name], 16);
    //RGB 256,256,256
    let match = text.match(/^\(?(\d{1,3}),(\d{1,3}),(\d{1,3})\)?$/);
    if (match != null) {
        let r = parseInt(match[1]);
        let g = parseInt(match[2]);
        let b = parseInt(match[3]);
        if (isNaN(r + g + b) || !isByte(r) || !isByte(g) || !isByte(b))
            return null;
        console.debug('color: ' + hex_1.hex(r) + hex_1.hex(g) + hex_1.hex(b));
        return parseInt(hex_1.hex(r) + hex_1.hex(g) + hex_1.hex(b), 16);
    }
    //Hex code with 6 digits
    match = text.match(/^#?([0-9a-f]{6})$/i);
    if (match != null)
        return parseInt(match[1], 16);
    //Hex code with 3 digits
    match = text.match(/^#?([0-9a-f]{3})$/i);
    if (match != null)
        return parseInt(match[1].split('').map(v => v + v).join(''), 16);
    //Decimal number
    match = text.match(/^\.([0-9]{1,8})$/);
    if (match != null) {
        let value = parseInt(match[1]);
        if (isUInt24(value))
            return value;
    }
    return null;
}
exports.color = color;
function isInt(value) {
    return Number.isInteger(value);
}
function isByte(value) {
    return isInt(value) && value >= 0 && value < 265;
}
function isUInt24(value) {
    return isInt(value) && value >= 0 && value < (2 << 23);
}
module.exports = { color };
