export function entityId(text: string, identifier = '', allowJustId = !identifier): string | null {
    if (typeof text != 'string')
        return null;

    let regex = new RegExp(`\\<${identifier}(\\d{17,23})\\>`);
    let match = regex.exec(text);
    if (match != null)
        return match[1];

    if (!allowJustId)
        return null;

    regex = new RegExp(`${identifier}(\\d{17,23})`);
    match = regex.exec(text);
    if (match != null)
        return match[1];

    return null;
}