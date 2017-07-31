const { GeneralCommand } = require('../../../Core/Structures/Command');

class TokenifyCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'tokenify'
        });
    }

    get leet() {
        return {
            i: 1,
            a: 4,
            o: 0,
            t: 7,
            e: 3,
            s: 2,
            b: 8
        };
    }

    async execute(ctx) {
        if (ctx.input._.length < 1) {
            return await this.notEnoughParameters(ctx);
        }
        let input = ctx.input._.join(' ').replace(/[^0-9a-z]/gi, '').toLowerCase();
        let output = [];
        for (let i = 0; i < input.length; i++) {
            if (Object.keys(this.leet).includes(input[i])
                && ctx.client.Helpers.Random.chance(2, 7))
                output.push(this.leet[input[i]]);
            else if (ctx.client.Helpers.Random.chance(1, 2))
                output.push(input[i].toUpperCase());
            else output.push(input[i]);
            if (i != 0 && i < input.length - 1) {
                switch (ctx.client.Helpers.Random.randInt(1, 50)) {
                    case 10:
                    case 11:
                    case 12:
                        output.push('.');
                        break;
                    case 20:
                    case 21:
                        output.push('-');
                        break;
                    case 30:
                        output.push('\\_');
                        break;
                }
            }
        }

        return output.join('');
    }
}

module.exports = TokenifyCommand;