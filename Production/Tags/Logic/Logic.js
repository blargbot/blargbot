const { Logic } = require.main.require('./Tag/Classes');

class LogicTag extends Logic {
    constructor(client) {
        super(client, {
            name: 'logic',
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
            '==', '!=', '<', '<=', '>', '>=', 'startswith', 'endswith', 'includes'
        ];
    }

    get logical() {
        return ['&&', '||', 'xor'];
    }

    get inverse() {
        return ['!'];
    }

    get operations() {
        return {
            '==': (augend, operand) => {
                return augend == operand;
            },
            '!=': (augend, operand) => {
                return augend != operand;
            },
            '<': (augend, operand) => {
                return augend < operand;
            },
            '<=': (augend, operand) => {
                return augend <= operand;
            },
            '>': (augend, operand) => {
                return augend > operand;
            },
            '>=': (augend, operand) => {
                return augend >= operand;
            },
            'startswith': (augend, operand) => {
                return augend.toString().startsWith(operand);
            },
            'endswith': (augend, operand) => {
                return augend.toString().endsWith(operand);
            },
            'includes': (augend, operand) => {
                return augend.toString().includes(operand);
            },
            '&&': (augend, operand) => {
                return augend && operand;
            },
            '||': (augend, operand) => {
                return augend || operand;
            },
            'xor': (augend, operand) => {
                return augend ? !operand : operand;
            },
            '!': (operand) => {
                return !operand;
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
                    args[i] = this.parseFloat(args[i], i === 0 ? 'augend' : 'operand');
                    if (args[i] === 0) args[i] = false;
                    else if (args[i] === 1) args[i] = true;
                } catch (err) {
                    if (args[i].toLowerCase() === 'false') args[i] = false;
                    else if (args[i].toLowerCase() === 'true') args[i] = true;
                }
            }
            else args[i] = args[i].toLowerCase();
        }

        let operation = args.slice(0);
        if (this.operators.includes(operation[0]) || this.logical.includes(operation[0]))
            operation.unshift('');
        let index;
        for (const operator of this.operators) {
            let index = operation.indexOf(operator);
            while (index > -1) {
                let augend = operation[index - 1];
                if (this.isOperator(augend)) {
                    operation.splice(index, 1);
                    continue;
                }

                let operand = operation[index + 1];
                if (this.isOperator(operand)) {
                    operation.splice(index, 1);
                    continue;
                }

                let out = this.operations[operator](augend, operand);
                operation.splice(index - 1, 3, out);
                index = operation.indexOf(operator);
            }
        }

        for (const operator of this.inverse) {
            let index = operation.indexOf(operator);
            while (index > -1) {
                let operand = operation[index + 1];
                if (this.isOperator(operand)) {
                    operation.splice(index, 1);
                    continue;
                }

                let out = this.operations[operator](operand);
                operation.splice(index, 2, out);
                index = operation.indexOf(operator);
            }
        }

        for (const operator of this.logical) {
            let index = operation.indexOf(operator);
            while (index > -1) {
                let augend = operation[index - 1];
                if (this.isOperator(augend)) {
                    operation.splice(index, 1);
                    continue;
                }

                let operand = operation[index + 1];
                if (this.isOperator(operand)) {
                    operation.splice(index, 1);
                    continue;
                }

                let out = this.operations[operator](augend, operand);
                operation.splice(index - 1, 3, out);
                index = operation.indexOf(operator);
            }
        }

        if (operation.length > 1) {
            operation[0] = !!operation[0];
            for (let i = 1; i < operation.length; i++)
                operation[0] = operation[0] && !!operation[i];
        }

        return res.setContent(operation[0]);
    }

    isOperator(obj) {
        return this.operators.includes(obj) || this.logical.includes(obj) || this.inverse.includes(obj);
    }
}

module.exports = LogicTag;