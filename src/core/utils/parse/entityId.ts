export function entityId(text: string, identifier = '', allowJustId = identifier.length === 0): string | undefined {
    if (typeof text !== 'string')
        return undefined;

    let regex = new RegExp(`\\<${identifier}(\\d{17,23})\\>`);
    let match = regex.exec(text);
    if (match !== null)
        return match[1];

    if (!allowJustId)
        return undefined;

    regex = new RegExp(`(?:${identifier})?(\\d{17,23})`);
    match = regex.exec(text);
    if (match !== null)
        return match[1];

    return undefined;
}
