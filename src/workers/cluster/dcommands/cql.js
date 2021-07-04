const BaseCommand = require('../structures/BaseCommand');
const { table } = require('table');
const newbutils = require('../newbu');

class CQLCommand extends BaseCommand {
    constructor() {
        super({
            name: 'cql',
            category: newbutils.commandTypes.CAT
        });
    }

    async execute(msg, words) {
        try {
            let res = await bu.cclient.execute(words.slice(1).join(' '));
            let rows = res.rows.map(r => Object.values(r).map(rr => (rr === undefined || rr === null ? '' : rr).toString().replace(/\n/g, ' ').replace(/`/g, '').substring(0, 32)));
            rows.unshift(res.columns.map(c => c.name));
            console.log(rows);
            let out = table(rows, {
                drawHorizontalLine: (index, size) => {
                    return index === 0 || index === 1 || index === size;
                }
            });
            await bu.send(msg, '```js\n' + out + '\n```');
        } catch (err) {
            await bu.send(msg, '```js\n' + err.stack + '\n```');
        }
    }
}

module.exports = CQLCommand;
