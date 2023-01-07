import { deferredValue, Subtag, transparentResultAdapter } from '@bbtag/subtag';

import { ArrayPlugin } from '../../plugins/ArrayPlugin.js';
import { StringPlugin } from '../../plugins/StringPlugin.js';
import { p } from '../p.js';

export class SwitchSubtag extends Subtag {
    public constructor() {
        super({
            name: 'switch'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.string('value'))
        .parameter(
            p.group(
                p.string('case'),
                p.deferred('then')
            ).repeat(0).map((values, script) => {
                const array = script.process.plugins.get(ArrayPlugin);
                const string = script.process.plugins.get(StringPlugin);
                return values.map(([caseValue, then]) => {
                    const asArray = array.parseArray(caseValue);
                    const options = asArray?.v.map(v => string.toString(v)) ?? [caseValue];
                    return { options, then };
                });
            })
        )
        .parameter(p.deferred('default').optional(deferredValue('')))
        .convertResultUsing(transparentResultAdapter)
    public switch<T>(
        value: string,
        cases: Iterable<{ readonly options: Iterable<string>; readonly then: () => T; }>,
        defaultCase: () => T
    ): T {
        for (const { options, then } of cases) {
            for (const option of options)
                if (option === value)
                    return then();
        }
        return defaultCase();
    }
}
