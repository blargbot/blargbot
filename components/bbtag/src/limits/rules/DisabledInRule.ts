import type { IFormattable } from '@blargbot/formatting';

import type { BBTagContext } from '../../BBTagContext.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { SubtagCall } from '../../language/index.js';
import templates from '../../text.js';
import type { RuntimeLimitRule } from '../RuntimeLimitRule.js';

export class DisabledInRule implements RuntimeLimitRule {
    readonly #subtags: readonly string[];
    public constructor(...subtagNames: readonly string[]) {
        this.#subtags = subtagNames;
    }

    public check(context: BBTagContext, subtagName: string): void {
        const problem = this.#subtags.map(s => ({ s, i: context.callStack.lastIndexOf(s) }))
            .reduce((p, c) => p.i < c.i ? c : p, { s: '', i: -1 });
        if (problem.s.length > 0) {
            const { subtag } = context.callStack.get(problem.i) ?? { subtag: unknownSubtag };
            throw new BBTagRuntimeError(`{${subtagName}} is disabled inside {${problem.s}}`, `${problem.s} located at:\nIndex ${subtag.start.index}: Line ${subtag.start.line}, column ${subtag.start.column}\nIndex ${subtag.end.index}: Line ${subtag.end.line}, column ${subtag.end.column}`);
        }
    }

    public displayText(): IFormattable<string> {
        return templates.limits.rules.disabledIn.default({ subtagNames: this.#subtags });
    }

    public state(): JToken {
        return null;
    }

    public load(): void {
        // NOOP
    }
}

const unknownSubtag: Pick<SubtagCall, 'start' | 'end'> = {
    start: {
        column: -1,
        index: -1,
        line: -1
    },
    get end() { return this.start; }
};
