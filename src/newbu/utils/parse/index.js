"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const boolean_1 = require("./boolean");
const color_1 = require("./color");
const duration_1 = require("./duration");
const embed_1 = require("./embed");
const entityId_1 = require("./entityId");
const flags_1 = require("./flags");
const float_1 = require("./float");
const int_1 = require("./int");
const time_1 = require("./time");
const words_1 = require("./words");
exports.parse = {
    boolean: boolean_1.boolean,
    color: color_1.color,
    duration: duration_1.duration,
    embed: embed_1.embed,
    entityId: entityId_1.entityId,
    flags: flags_1.flags,
    float: float_1.float,
    int: int_1.int,
    time: time_1.time,
    words: words_1.words
};
