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

    async execute(msg, words) {

    }

    async event(params) {

    }

    async send(msg, content, file) {
        await _client.Helpers.Message.send(msg, content, file);
    }

    async canExecute(msg) {
        return true;
    }
}

module.exports = BaseCommand;