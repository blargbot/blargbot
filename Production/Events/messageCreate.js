async function messageCreate(msg) {

}

function splitInput(text) {
    let words = [];
    let chars = text.split('');
    text.replace(/\n/g, '\n ');
    let escaped = false;
    for (const char of chars) {

    }
}

function parseInput(flags, text) {
    let words;
    if (Array.isArray(text)) words = bu.splitInput(text.slice(1).join(' '));
    else words = bu.splitInput(text);
    let output = {
        undefined: []
    };
    let currentFlag = '';
    for (let i = 0; i < words.length; i++) {
        let pushFlag = true;
        if (words[i].startsWith('--')) {
            let flags = flags.filter(f => f.word == words[i].substring(2).toLowerCase());
            if (flags.length > 0) {
                currentFlag = flags[0].flag;
                output[currentFlag] = [];
                pushFlag = false;
            }
        } else if (words[i].startsWith('-')) {
            let tempFlag = words[i].substring(1);
            for (let char of tempFlag) {
                currentFlag = char;
                output[currentFlag] = [];
            }
            pushFlag = false;
        }
        if (pushFlag) {
            if (currentFlag != '') {
                output[currentFlag].push(words[i]);
            } else {
                if (words[i] != '')
                    output['_'].push(words[i]);
            }
        }
    }
    return output;
};

module.exports = messageCreate;