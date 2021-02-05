"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embed = void 0;
function embed(embedText) {
    if (embedText == null)
        return undefined;
    if (!embedText || !embedText.trim())
        return undefined;
    try {
        let parsed = JSON.parse(embedText);
        if (typeof parsed !== 'object' || Array.isArray(parsed))
            return null;
        else
            return parsed;
    }
    catch (e) {
        return {
            fields: [
                {
                    name: 'Malformed JSON',
                    value: embedText + ''
                }
            ],
            malformed: true
        };
    }
}
exports.embed = embed;
