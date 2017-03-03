class BaseCommand {
    constructor(options) {
        if (this.constructor === BaseCommand) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.hidden = options.hidden || false;
        this.usage = options.usage || '';
        this.info = options.info || '';
        this.name = options.name || this.constructor.name;
        this.flags = options.flags || [];
        this.aliases = options.aliases || [];
    }

    get webInfo() {
        let paragraphs = this.info.replace(/\n+/g, '\n').split('\n');
        let output = '';
        let list = [];
        for (const line of paragraphs) {
            if (line.startsWith(' - ')) {
                list.push(`<li>${line.substring(3)}</li>`);
            } else {
                if (list.length > 0) {
                    output += `<ul>${list.join('')}</ul>`;
                    list = [];
                }
                output += `<p>${line}</p>`;
            }
        }
        output.replace(/```\n((?:.|\n)+?)\n```/gim, '<pre><code>$1</code></pre>')
            .replace(/`((?:.|\n)+?)`/gim, '<code>$1</code>');
        return output;
    }

    async execute(ctx) {
        this.splitInput(ctx);
        this.parseInput(ctx);
    }

    async event(params) {

    }

    async send(dest, content, file) {
        await _client.Helpers.Message.send(dest, content, file);
    }

    async canExecute(ctx) {
        return true;
    }

    splitInput(ctx) {
        let words = [];
        ctx.text = ctx.text.replace(/\n/g, '\n ');
        let chars = ctx.text.split('');
        let escaped = false;
        let inPhrase = false;
        let temp = '';
        for (let i = 0; i < chars.length; i++) {
            switch (chars[i]) {
                case '\\':
                    if (escaped)
                        temp += '\\';
                    else escaped = true;
                    break;
                case '"':
                    if (temp == '') {
                        if (escaped) {
                            temp += '"';
                            escaped = false;
                        }
                        else inPhrase = true;
                    } else {
                        if (inPhrase && (chars[i + 1] == ' ' || chars[i + 1] == undefined) && !escaped) {
                            inPhrase = false;
                            words.push(temp.replace(/\n /g, '\n'));
                            temp = '';
                        } else {
                            temp += '"';
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
        ctx.words = words;
    }

    parseInput(ctx) {
        let words = ctx.words;
        let output = {
            undefined: []
        };
        let currentFlag = '';
        for (let i = 0; i < words.length; i++) {
            let pushFlag = true;
            if (words[i].startsWith('--')) {
                let parseFlags = this.flags.filter(f => f.word == words[i].substring(2).toLowerCase());
                if (parseFlags.length > 0) {
                    currentFlag = parseFlags[0].flag;
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
        ctx.input = output;
    };
}

module.exports = BaseCommand;