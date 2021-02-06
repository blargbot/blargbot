"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _elapsed, _start;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timer = void 0;
const moment_1 = __importDefault(require("moment"));
class Timer {
    constructor() {
        _elapsed.set(this, void 0);
        _start.set(this, void 0);
        __classPrivateFieldSet(this, _elapsed, 0);
        __classPrivateFieldSet(this, _start, null);
    }
    get elapsed() {
        if (__classPrivateFieldGet(this, _start) === null)
            return __classPrivateFieldGet(this, _elapsed);
        else
            return __classPrivateFieldGet(this, _elapsed) + (Date.now() - __classPrivateFieldGet(this, _start));
    }
    get duration() {
        return moment_1.default.duration(this.elapsed, 'milliseconds');
    }
    format() {
        let diff = this.duration;
        return `${diff.minutes()} minutes, ${diff.seconds()} seconds, and ${diff.milliseconds()} milliseconds`;
    }
    start(reset = true) {
        if (__classPrivateFieldGet(this, _start) !== null)
            throw new Error('Cannot start an already started timer');
        if (reset)
            __classPrivateFieldSet(this, _elapsed, 0);
        __classPrivateFieldSet(this, _start, Date.now());
        return this;
    }
    poll(reset = false) {
        let elapsed = this.elapsed;
        if (reset) {
            this.end();
            this.start();
        }
        return elapsed;
    }
    resume() {
        return this.start(false);
    }
    end() {
        if (__classPrivateFieldGet(this, _start) !== null) {
            __classPrivateFieldSet(this, _elapsed, __classPrivateFieldGet(this, _elapsed) + (Date.now() - __classPrivateFieldGet(this, _start)));
            __classPrivateFieldSet(this, _start, null);
        }
        return this;
    }
}
exports.Timer = Timer;
_elapsed = new WeakMap(), _start = new WeakMap();
module.exports = Timer;
