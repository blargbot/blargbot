const { Math } = require.main.require('./Tag/Classes');

class MathTag extends Math {
    constructor(client) {
        super(client, {
            name: 'math',
            named: false,
            args: [
                {
                    name: 'augend'
                }, {
                    name: 'operator'
                }, {
                    name: 'operand',
                    repeat: true
                }, {
                    name: 'etc',
                    optional: true,
                    repeat: true
                }
            ],
            minArgs: 2
        });
    }

    get operators() {
        return [
            '**', '/', '*', '+', '-', '&', '|', '^'
        ];
    }

    get operations() {
        return {
            '^': (augend, operands) => {
                let out = augend;
                for (const operand of operands) out **= operand;
                return out;
            },
            '/': (augend, operands) => {
                let out = augend;
                for (const operand of operands) out /= operand;
                return out;
            },
            '*': (augend, operands) => {
                let out = augend;
                for (const operand of operands) out *= operand;
                return out;
            },
            '+': (augend, operands) => {
                let out = augend;
                for (const operand of operands) out += operand;
                return out;
            },
            '-': (augend, operands) => {
                let out = augend;
                for (const operand of operands) out -= operand;
                return out;
            },
            '&': (augend, operands) => {
                let out = augend;
                for (const operand of operands) out &= operand;
                return out;
            },
            '|': (augend, operands) => {
                let out = augend;
                for (const operand of operands) out |= operand;
                return out;
            },
            'xor': (augend, operands) => {
                let out = augend;
                for (const operand of operands) out ^= operand;
                return out;
            }
        };
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        args = args.args;

        for (let i = 0; i < args.length; i++) {
            if (args[i] instanceof this.TagArray) args[i] = args[i].toString();
            else if (Array.isArray(args[i])) args[i] = args[i].join('');
            if (!this.operators.includes(args[i].toLowerCase())) {
                try {
                    args[i] = this.parseFloat(args[i]);
                } catch (err) {
                    let variable = await ctx.client.TagVariableManager.executeGet(ctx, args[i]) || '';
                    try {
                        args[i] = this.parseFloat(variable);
                    } catch (err2) {
                        this.parseFloat(`${variable}', variable: '${args[i]}`, i === 0 ? 'augend' : 'operand');
                    }
                }
            }
            else args[i] = args[i].toLowerCase();
        }
        let operation = args.slice(0);
        if (typeof operation[0] !== 'number')
            operation.unshift(0);
        for (const operator of this.operators) {
            let index = operation.indexOf(operator);
            while (index > -1) {
                let augend = operation[index - 1];
                if (typeof augend === 'string') {
                    operation.slice(index, 1);
                    continue;
                }
                let operands = [];
                for (let i = index + 1; i < operation.length && typeof operation[i] === 'number'; i++)
                    operands.push(operation[i]);
                let out = this.operations[operator](augend, operands);
                operation.splice(index - 1, 2 + operands.length, out);
                index = operation.indexOf(operator);
            }
        }

        if (operation.length > 1) {
            for (let i = 1; i < operation.length; i++)
                operation[0] += operation[i];
        }

        return res.setContent(operation[0]);
    }
}

module.exports = MathTag;