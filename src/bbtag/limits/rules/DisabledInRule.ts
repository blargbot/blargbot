import { humanize } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { BBTagRuntimeError } from '../../errors';
import { SubtagCall } from '../../language';
import { RuntimeLimitRule } from '../RuntimeLimitRule';

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
            throw new BBTagRuntimeError(`{${subtagName}} is disabled inside {${problem.s}}`, `${problem.s} located at:\n` +
                `Index ${subtag.start.index}: Line ${subtag.start.line}, column ${subtag.start.column}\n` +
                `Index ${subtag.end.index}: Line ${subtag.end.line}, column ${subtag.end.column}`);
        }
    }

    public displayText(): string {
        return `Cannot be used in the arguments to ${humanize.smartJoin(this.#subtags.map(s => `{${s}}`), ', ', ' or ')}`;
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
