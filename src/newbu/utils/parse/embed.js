function embed(embedText) {
    if (embedText == null)
        return undefined;

    if (!embedText || !embedText.trim())
        return undefined;

    try {
        let parsed = JSON.parse(embedText);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) return null;
        else return parsed;
    } catch (e) {
        return { fields: [{ name: 'Malformed JSON', value: embedText + '' }], malformed: true };
    }
}

module.exports = { embed };