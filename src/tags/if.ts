import { SubtagArgumentValue } from './../core/bbtag/types';
import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType, parse } from '../utils';

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

export class IfSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'if',
            category: SubtagType.COMPLEX,
            desc:
                'If `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. ' +
                'If they are not provided, `value1` is read as `true` or `false`. ' +
                'If the resulting value is `true` then the tag returns `then`, otherwise it returns `else`.\n' +
                'Valid evaluators are `' +
                operators.join('`, `') +
                '`.',
            definition: [
                {
                    args: ['boolean', '~then'],
                    description:
                        'If `boolean` is `true`, return `then`, else do nothing.',
                    execute: (ctx, [{ value: bool }, thenCode], subtag) =>
                        this.simpleBooleanCheck(ctx, subtag, bool, thenCode)
                },
                {
                    args: ['boolean', '~then', '~else'],
                    description:
                        'If `boolean` is `true`, return `then`, else execute `else`',
                    execute: (
                        ctx,
                        [{ value: bool }, thenCode, elseCode],
                        subtag
                    ) =>
                        this.simpleBooleanCheck(
                            ctx,
                            subtag,
                            bool,
                            thenCode,
                            elseCode
                        )
                },
                {
                    args: ['value1', 'evaluator', 'value2', '~then'],
                    description:
                        '`Value1` is evaluated against `value2` using `evaluator, if the resulting value is `true` then the tag returns `then`.',
                    execute: (
                        ctx,
                        [
                            { value: value1 },
                            { value: evaluator },
                            { value: value2 },
                            thenCode
                        ],
                        subtag
                    ) =>
                        this.evaluatorCheck(
                            ctx,
                            subtag,
                            value1,
                            evaluator,
                            value2,
                            thenCode
                        )
                },
                {
                    args: ['value1', 'evaluator', 'value2', '~then', '~else'],
                    description:
                        '`Value1` is evaluated against `value2` using `evaluator, if the resulting value is `true` then the tag returns `then`, otherwise it returns `else`',
                    execute: (
                        ctx,
                        [
                            { value: value1 },
                            { value: evaluator },
                            { value: value2 },
                            thenCode,
                            elseCode
                        ],
                        subtag
                    ) =>
                        this.evaluatorCheck(
                            ctx,
                            subtag,
                            value1,
                            evaluator,
                            value2,
                            thenCode,
                            elseCode
                        )
                }
            ]
        });
    }
    public async simpleBooleanCheck(
        context: BBTagContext,
        subtag: SubtagCall,
        bool: string,
        thenCode: SubtagArgumentValue,
        elseCode?: SubtagArgumentValue
    ): Promise<string> {
        const actualBoolean = parse.boolean(bool);
        if (typeof actualBoolean != 'boolean')
            return this.customError('Not a boolean', context, subtag);

        if (actualBoolean) {
            return thenCode.wait();
        } else {
            if (elseCode) {
                return elseCode.wait();
            }
            return '';
        }
    }

    public async evaluatorCheck(
        context: BBTagContext,
        subtag: SubtagCall,
        value1: string,
        evaluator: string,
        value2: string,
        thenCode: SubtagArgumentValue,
        elseCode?: SubtagArgumentValue
    ): Promise<string> {
        const boolSubtag = this.cluster.subtags.get('bool');
        //TODO Should we continue relying on other subtags?
        //@ts-ignore
        const result: string = await boolSubtag!.runCondition(
            context,
            subtag,
            value1,
            evaluator,
            value2
        );
        if (result !== 'false' && result !== 'true') return result;

        if (parse.boolean(result)) {
            return thenCode.wait();
        } else {
            if (elseCode) {
                return elseCode.wait();
            }
            return '';
        }
    }
}
