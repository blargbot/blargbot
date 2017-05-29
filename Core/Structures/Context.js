class Context {
    constructor(client, msg, text) {
        this.client = client;
        this.msg = msg;
        this.text = text;
        this.splitInput();
    }

    async send(content, file) {
        return await this.client.Helpers.Message.send(this, content, file);
    }

    async decode(key, args) {
        return await this.client.Helpers.Message.decode(this, key, args);
    }

    get channel() {
        return this.msg.channel;
    }

    get author() {
        return this.msg.author;
    }

    get guild() {
        return this.msg.guild;
    }

    splitInput() {
        let words = [];
        this.text = this.text.replace(/\n/g, '\n ');
        let chars = this.text.split('');
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
        this.words = words;
    }
}

module.exports = Context;