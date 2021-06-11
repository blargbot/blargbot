import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType, parse, bbtagUtil, compare } from '../utils';

const operators = [
    '==',
    '!=',
    '>=',
    '>',
    '<=',
    'startswith',
    'endswith',
    'includes',
    'contains'
];

interface OperatorHandler {
    [index: string]: (a: string, b: string) => boolean;
}

export class BoolSubtag extends BaseSubtag {
    public operatorHandler: OperatorHandler;
    public operators: string[];
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'bool',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    args: ['arg1', 'evaluator', 'arg2'],
                    description:
                        'Evaluates `arg1` and `arg2` using the `evaluator` and returns `true` or `false`. ' +
                        'Valid evaluators are `' +
                        operators.join('`, `') +
                        '`\n' +
                        'The positions of `evaluator` and `arg1` can be swapped.',
                    exampleCode: '{bool;5;<=;10}',
                    exampleOut: 'true',
                    execute: (ctx, args, subtag) =>
                        this.runCondition(
                            ctx,
                            subtag,
                            args[0].value,
                            args[1].value,
                            args[2].value
                        )
                }
            ]
        });
        //TODO possibly remove this?
        this.operators = operators;
        /**
         * * There has to be a way to better define these types??
         */
        this.operatorHandler = {
            '==': (a, b) => compare(a, b) == 0,
            '!=': (a, b) => compare(a, b) != 0,
            '>=': (a, b) => compare(a, b) >= 0,
            '>': (a, b) => compare(a, b) > 0,
            '<=': (a, b) => compare(a, b) <= 0,
            '<': (a, b) => compare(a, b) < 0,
            startswith: (a, b) => {
                const arr = this.getArray(a);
                if (arr) {
                    return arr[0] == b;
                } else {
                    return a.startsWith(b);
                }
            },
            endswith: (a, b) => {
                const arr = this.getArray(a);
                if (arr) {
                    return arr.slice(-1)[0] == b;
                } else {
                    return a.endsWith(b);
                }
            },
            includes: (a: string, b: string): boolean => {
                const arr = this.getArray(a);
                if (arr) {
                    return arr.find((v) => v == b) != null;
                } else {
                    return a.includes(b);
                }
            },
            contains: (a: string, b: string): boolean => {
                const arr = this.getArray(a);
                if (arr) {
                    return arr.find((v) => v == b) != null;
                } else {
                    return a.includes(b);
                }
            }
        };
    }

    public getArray(text: string): JArray | false {
        const arr = bbtagUtil.tagArray.deserialize(text);
        if (arr && Array.isArray(arr.v)) {
            return arr.v;
        } else {
            return false;
        }
    }

    public runCondition(
        context: BBTagContext,
        subtag: SubtagCall,
        left: string,
        operator: string,
        right: string
    ): string {
        if (operators.indexOf(operator) !== -1) {
            //
        } else if (operators.indexOf(left) !== -1) {
            [left, operator, right] = [operator, left, right];
        } else if (operators.indexOf(right) !== -1) {
            [left, operator, right] = [left, right, operator];
        } else {
            return this.customError('Invalid operator', context, subtag);
        }
        const leftBool = parse.boolean(left, undefined, false);
        if (leftBool !== undefined) left = leftBool.toString();
        const rightBool = parse.boolean(right, undefined, false);
        if (rightBool !== undefined) right = rightBool.toString();

        return this.operatorHandler[operator](left, right).toString();
    }
}
