import { processAsyncResult } from '@bbtag/engine';
import { Subtag, transparentResultAdapter } from '@bbtag/subtag';

import { ArrayPlugin } from '../../plugins/ArrayPlugin.js';
import { BooleanPlugin } from '../../plugins/BooleanPlugin.js';
import { ComparePlugin } from '../../plugins/ComparePlugin.js';
import { StringPlugin } from '../../plugins/StringPlugin.js';
import { p } from '../p.js';
import { BoolSubtag } from './bool.js';

export class IfSubtag extends Subtag {
    public constructor() {
        super({
            name: 'if'
        });
    }

    @Subtag.signature({ id: 'valueElse' })
        .parameter(p.boolean('boolean'))
        .parameter(p.deferred('then'))
        .parameter(p.deferred('else').optional(() => processAsyncResult(''), true))
        .useConversion(transparentResultAdapter)
    public simpleBooleanCheck<T>(
        bool: boolean,
        thenCode: () => T,
        elseCode: () => T
    ): T {
        return bool ? thenCode() : elseCode();
    }

    @Subtag.signature({ id: 'conditionElse' })
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.plugin(BooleanPlugin))
        .parameter(p.plugin(ComparePlugin))
        .parameter(p.plugin(StringPlugin))
        .parameter(p.string('value1'))
        .parameter(p.string('operator'))
        .parameter(p.string('value2'))
        .parameter(p.deferred('then'))
        .parameter(p.deferred('else').optional(() => processAsyncResult(''), true))
        .useConversion(transparentResultAdapter)
    public evaluatorCheck<T>(
        array: ArrayPlugin,
        boolean: BooleanPlugin,
        compare: ComparePlugin,
        string: StringPlugin,
        value1: string,
        operator: string,
        value2: string,
        thenCode: () => T,
        elseCode: () => T
    ): T {
        return BoolSubtag.runCondition(array, boolean, compare, string, value1, operator, value2)
            ? thenCode()
            : elseCode();
    }
}
