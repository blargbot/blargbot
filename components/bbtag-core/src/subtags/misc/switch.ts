import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { ArrayPlugin } from '../../plugins/ArrayPlugin.js';
import type { InterruptableAsyncProcess, InterruptableProcess } from '../../runtime/InterruptableProcess.js';

export class SwitchSubtag extends Subtag {
    public constructor() {
        super({
            name: 'switch'
        });
    }

    @Subtag.signature(
        p.plugin(ArrayPlugin),
        p.string('value'),
        p.aggregate(p.string('case'), p.deferred('then'))
            .repeat()
            .map(([caseValue, then]) => ({ caseValue, then })),
        p.deferred('default').optional()
    ).returns('transparent')
    public async * switch(
        array: ArrayPlugin,
        value: string,
        cases: Array<{ caseValue: string; then: () => InterruptableProcess<string>; }>,
        defaultCase?: () => InterruptableProcess<string>
    ): InterruptableAsyncProcess<string> {
        for (const { caseValue, then } of cases) {
            const { v: options = [caseValue] } = array.parseArray(caseValue);
            for (const option of options)
                if (parse.string(option) === value)
                    return yield* then();
        }
        if (defaultCase !== undefined)
            return yield* defaultCase();

        return '';
    }
}
