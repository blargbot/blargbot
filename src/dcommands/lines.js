const BaseCommand = require('../structures/BaseCommand');
const path = require('path');
const Table = dep.Table;

class LinesCommand extends BaseCommand {
    constructor() {
        super({
            name: 'lines',
            category: bu.CommandType.GENERAL,
            hidden: true,
            usage: 'lines',
            info: 'Gets the number of lines the bot is made of.'
        });
    }

    async execute(msg, words, text) {
        bot.sendChannelTyping(msg.channel.id);
        dep.exec(`cloc ${path.join(__dirname, '..')} --exclude-dir=codemirror`, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                bu.send(msg, 'An error has occurred!');
                return;
            }
            let sections = stdout.split(/-+/);
            for (let i = 0; i < sections.length; i++) {
                if (sections[i] == '')
                    sections.splice(i, 1);
            }
            sections[1] = sections[1].replace(/\n/g, '');
            let head = sections[1].split(/\s\s+/);
            var table = new Table({
                chars: {
                    'top': '',
                    'top-mid': '',
                    'top-left': '',
                    'top-right': '',
                    'bottom': '',
                    'bottom-mid': '',
                    'bottom-left': '',
                    'bottom-right': '',
                    'left': '',
                    'left-mid': '',
                    'mid': '',
                    'mid-mid': '',
                    'right': '',
                    'right-mid': '',
                    'middle': ' '
                },
                style: {
                    'padding-left': 0,
                    'padding-right': 0
                },
                head: head
            });
            let middle = sections[2].split(/\n/);
            for (let i = 0; i < middle.length; i++) {
                if (middle[i] != '') {
                    let toPush = middle[i].split(/\s\s+/);
                    console.debug(toPush);
                    table.push(toPush);
                }
            }
            sections[3] = sections[3].replace(/\n/g, '');
            let footer = sections[3].split(/\s\s+/);
            table.push(footer);
            console.debug(table);
            let output = table.toString().replace(/\[[0-9]{2}m/g, '');
            bu.send(msg, `\`\`\`prolog
${output}
\`\`\`
`);
        });
    }
}

module.exports = LinesCommand;
