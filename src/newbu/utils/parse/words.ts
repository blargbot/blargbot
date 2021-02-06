export function words(content: string | string[] | number | boolean, noTrim: boolean = false) {
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

    for (let i in input) {
        if (!inQuote) {
            if (input[i].startsWith('"') && !input[i].startsWith('\\"')) {
                inQuote = true;
                if (input[i].endsWith('"') && !input[i].endsWith('\\"')) {
                    inQuote = false;
                    words.push(input[i].substring(1, input[i].length - 1));
                } else
                    quoted = input[i].substring(1, input[i].length) + ' ';
            } else {
                words.push(input[i]);
            }
        } else if (inQuote) {
            if (input[i].endsWith('"') && !input[i].endsWith('\\"')) {
                inQuote = false;
                quoted += input[i].substring(0, input[i].length - 1);
                words.push(quoted);
            } else {
                quoted += input[i] + ' ';
            }
        }
    }
    if (inQuote) {
        words = input;
    }
    for (let i in words) {
        words[i] = words[i].replace(/\\"/g, '"');
        if (!noTrim) words[i] = words[i].replace(/^ +/g, '');
    }
    //console.debug(words);
    return words;
};