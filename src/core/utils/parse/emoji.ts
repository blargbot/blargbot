import * as twemoji from 'twemoji';

export function emoji(text: string, distinct = false): string[] {
    if (typeof text != 'string') return [];
    let match;
    let result: string[] = [];

    text = text.replace(/\ufe0f/g, '');

    // Find custom emotes
    const regex = /<(a?:\w+:\d{17,23})>|(\w+:\d{17,23})/gi;
    while (match = regex.exec(text)) {
        if (match[2])
            result.push(match[2]);
        else
            result.push(match[1]);
    }

    // Find twemoji defined emotes
    twemoji.replace(text, (match?: string) =>
        void (match !== undefined ? result.push(match) : undefined));

    if (distinct)
        result = [...new Set(result)];

    // Sort by order of appearance
    return result.map(r => ({ value: r, index: text.indexOf(r) }))
        .sort((a, b) => a.index - b.index)
        .map(r => r.value);
}