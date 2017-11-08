const { GeneralCommand } = require('../../../Core/Structures/Command');
const superagent = require('superagent');

class EconCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'economy',
            usage: '<from> <to> <amount>',
            minArgs: 3,
            info: 'Converts currency using recent conversion rates.',
            aliases: ['econ'],
            keys: {
                invalidAmount: { key: '.invalidamount', value: 'Please specify a valid quantity to convert.' },
                invalidCode: { key: '.invalidcode', value: 'Unknown currency code: {{code}}' },
                converted: { key: '.converted', value: '{{amount}} {{from}} is equivalent to {{converted}} {{to}}' }
            }
        });
    }

    url(to, from) {
        return `http://api.fixer.io/latest?symbols=${to}&base=${from}`;
    }

    async execute(ctx) {
        let from = ctx.input._[0].toUpperCase();
        let to = ctx.input._[1].toUpperCase();
        let amount = parseFloat(ctx.input._[2]);
        if (isNaN(amount)) {
            return await ctx.decodeAndSend(this.keys.invalidAmount);
        }

        let url = this.url(to, from);
        console.log(url);
        try {
            let { body } = await superagent.get(url);

            if (body.rates[to] === undefined)
                return await ctx.decodeAndSend(this.keys.invalidCode, { code: to });

            let converted = Math.round(amount * body.rates[to] * 100.0) / 100;
            return await ctx.decodeAndSend(this.keys.converted, { to, from, converted, amount });
        } catch (err) {
            return await ctx.decodeAndSend(this.keys.invalidCode, { code: from });
        }
    }
}

module.exports = EconCommand;