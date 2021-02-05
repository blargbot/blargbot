"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flags = void 0;
const words_1 = require("./words");
function flags(definitions, text, noTrim) {
    var _a;
    let words;
    if (Array.isArray(text))
        words = words_1.words(text.slice(1).join(' '), noTrim);
    else
        words = words_1.words(text, noTrim);
    let output = { undefined: [] };
    let currentFlag = '';
    for (let i = 0; i < words.length; i++) {
        let pushFlag = true;
        if (words[i].startsWith('--')) {
            if (words[i].length > 2) {
                let flag = definitions.find(f => f.word == words[i].substring(2).toLowerCase());
                if (flag) {
                    currentFlag = flag.flag;
                    output[currentFlag] = [];
                    pushFlag = false;
                }
            }
            else {
                currentFlag = '';
                pushFlag = false;
            }
        }
        else if (words[i].startsWith('-')) {
            if (words[i].length > 1) {
                let tempFlag = words[i].substring(1);
                for (let char of tempFlag) {
                    currentFlag = char;
                    output[currentFlag] = [];
                }
                pushFlag = false;
            }
        }
        else if (words[i].startsWith('\\-')) {
            words[i] = words[i].substring(1);
        }
        if (pushFlag) {
            if (currentFlag != '') {
                (_a = output[currentFlag]) === null || _a === void 0 ? void 0 : _a.push(words[i]);
            }
            else {
                output['undefined'].push(words[i]);
            }
        }
    }
    return output;
}
exports.flags = flags;
