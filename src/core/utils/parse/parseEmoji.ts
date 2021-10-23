import * as twemoji from 'twemoji';

export function parseEmoji(text: string, distinct = false): string[] {
    let result: string[] = [];

    text = text.replace(/\ufe0f/g, '');
    const source = text;

    // Find custom emotes
    text = text.replace(/(?<!\w)a?:\w+:\d{17,23}(?!\d)/gi, m => {
        result.push(m);
        return '';
    });

    // Find twemoji defined emotes
    twemoji.replace(text, m => {
        result.push(m);
        return '';
    });

    if (distinct)
        result = [...new Set(result)];

    // Sort by order of appearance
    return result.map(r => ({ value: r, index: source.indexOf(r) }))
        .sort((a, b) => a.index - b.index)
        .map(r => r.value);
}
