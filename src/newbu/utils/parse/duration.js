"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.duration = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
function duration(text) {
    return moment_timezone_1.default.duration()
        .add(find(text, /([0-9]+) ?(day|days|d)/i), 'd')
        .add(find(text, /([0-9]+) ?(hours|hour|h)/i), 'h')
        .add(find(text, /([0-9]+) ?(minutes|minute|mins|min|m)/i), 'm')
        .add(find(text, /((?:[0-9]*[.])?[0-9]+) ?(seconds|second|secs|sec|s)/i), 'ms');
}
exports.duration = duration;
function find(text, regex) {
    let match = text.match(regex);
    if (!match)
        return 0;
    return parseFloat(match[1]);
}
