export function words(content: string | readonly string[] | number | boolean, noTrim = false): string[] {
    let input;
    if (Array.isArray(content))
        content = content.join(' ');
    if (typeof content !== 'string')
        content = content.toString();
    if (!noTrim)
        input = content.replace(/ +/g, ' ').split(' ');
    else
        input = content.split(' ');

    if (input.length > 0 && input[0] == '')
        input.shift();
    if (input.length > 0 && input.slice(-1)[0] == '')
        input.pop();

    let words = [];
    let inQuote = false;
    let quoted = '';

    for (const c of input) {
        if (!inQuote) {
            if (c.startsWith('"') && !c.startsWith('\\"')) {
                inQuote = true;
                if (c.endsWith('"') && !c.endsWith('\\"')) {
                    inQuote = false;
                    words.push(c.substring(1, c.length - 1));
                } else
                    quoted = c.substring(1, c.length) + ' ';
            } else {
                words.push(c);
            }
        } else if (inQuote) {
            if (c.endsWith('"') && !c.endsWith('\\"')) {
                inQuote = false;
                quoted += c.substring(0, c.length - 1);
                words.push(quoted);
            } else {
                quoted += c + ' ';
            }
        }
    }
    if (inQuote) {
        words = input;
    }
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].replace(/\\"/g, '"');
        if (!noTrim)
            words[i] = words[i].replace(/^ +/g, '');
    }
    return words;
}