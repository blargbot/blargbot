"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entityId = void 0;
function entityId(text, identifier, allowJustId = false) {
    if (typeof text != 'string')
        return null;
    let regex = new RegExp('\\<' + identifier + '(\\d{17,23})\\>');
    let match = text.match(regex);
    if (match != null)
        return match[1];
    if (!allowJustId)
        return null;
    match = text.match(/\d{17,23}/);
    if (match != null)
        return match[0];
    return null;
}
exports.entityId = entityId;
;
