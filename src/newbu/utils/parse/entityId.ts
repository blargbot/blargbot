export function entityId(text: string, identifier: string, allowJustId = false): string | null {
    if (typeof text != 'string')
        return null;

    const regex = new RegExp('\\<' + identifier + '(\\d{17,23})\\>');
    let match = regex.exec(text);
    if (match != null)
        return match[1];

    if (!allowJustId)
        return null;

    match = /\d{17,23}/.exec(text);
    if (match != null)
        return match[0];

    return null;
}