"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.duration = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
function duration(start, end) {
    let diff = moment_timezone_1.default.duration(start.diff(end));
    let days = diff.days() > 0 ? diff.days() + ' days, ' : '';
    let hours = diff.hours() > 0 ? diff.hours() + ' hours, ' : '';
    let minutes = diff.minutes() + ' minutes, ';
    let seconds = diff.seconds() + ' seconds';
    return `${days}${hours}${minutes}and${seconds}`;
}
exports.duration = duration;
;
