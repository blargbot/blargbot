function flags(definitions, text, noTrim) {
    let words;
    if (Array.isArray(text))
        words = bu.splitInput(text.slice(1).join(' '), noTrim);
    else
        words = bu.splitInput(text, noTrim);
    let output = {
        undefined: []
    };
    let currentFlag = '';
    for (let i = 0; i < words.length; i++) {
        let pushFlag = true;
        if (words[i].startsWith('--')) {
            if (words[i].length > 2) {
                let flags = definitions.filter(f => f.word == words[i].substring(2).toLowerCase());
                if (flags.length > 0) {
                    currentFlag = flags[0].flag;
                    output[currentFlag] = [];
                    pushFlag = false;
                }
            } else {
                currentFlag = '';
                pushFlag = false;
            }
        } else if (words[i].startsWith('-')) {
            if (words[i].length > 1) {
                let tempFlag = words[i].substring(1);

                for (let char of tempFlag) {
                    currentFlag = char;
                    output[currentFlag] = [];
                }
                pushFlag = false;
            }
        } else if (words[i].startsWith('\\-')) {
            words[i] = words[i].substring(1);
        }
        if (pushFlag) {
            if (currentFlag != '') {
                output[currentFlag].push(words[i]);
            } else {
                output['undefined'].push(words[i]);
            }
        }
    }
    return output;
}

module.exports = { flags };