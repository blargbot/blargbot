class CommandArgs extends Array {
    constructor(args) {
        if (Array.isArray(args))
            super(...args);
        else if (typeof args === 'string') {
            const { words, raw } = CommandArgs.splitInput(args);
            super(...words);
            this.rawArgs = raw;
        } else super(args);
    }

    shift() {
        this.rawArgs.shift();
        return super.shift();

    }

    rawSlice(...args) {
        return this.rawArgs.slice(...args);
    }

    static get [Symbol.species]() { return Array; }

    static splitInput(text) {
        let words = [];
        text = text.replace(/\n/g, '\n ');
        let chars = text.split('');
        let escaped = false;
        let inPhrase = false;
        let temp = '';
        let rawTemp = '';
        for (let i = 0; i < chars.length; i++) {
            switch (chars[i]) {
                case '\\':
                temp += "\\";
                    if (escaped) {
                        escaped = false;
                    } else 
                        escaped = true;
                    break;
                case '"':
                    if (temp === '') {
                        temp += '"';
                        if (escaped) {
                            escaped = false;
                        }
                        else inPhrase = true;
                    } else {
                        temp += '"';
                        if (inPhrase && (chars[i + 1] == ' ' || chars[i + 1] == undefined) && !escaped) {
                            inPhrase = false;
                            words.push(temp.replace(/\n /g, '\n'));
                            temp = '';
                        } else {
                            escaped = false;
                        }
                    };
                    break;
                case ' ':
                    if (escaped) temp += ' ';
                    else if (!inPhrase && temp != '') {
                        words.push(temp);
                        temp = '';
                    } else if (inPhrase) temp += ' ';
                    else words[words.length - 1] += ' ';
                    if (escaped) escaped = false;
                    break;
                default:
                    temp += chars[i];
                    if (escaped) escaped = false;
                    break;
            }
        }
        if (temp != '')
            words.push(temp);
        let raw = words.slice(0);
        words = words.map(r => r.trim().replace(/^"(.+)"$/g, '$1').replace(/\\(["\\])/g, '$1'));
        return {
            words, raw
        };
    }
}

module.exports = CommandArgs;