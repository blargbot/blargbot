import type { IFormattable } from '@blargbot/formatting';

import type { BBTagRuntime } from '../../BBTagRuntime.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import textTemplates from '../../text.js';
import type { RuntimeLimitRule } from '../RuntimeLimitRule.js';

export class DisabledInRule implements RuntimeLimitRule {
    readonly #subtags: readonly string[];
    public constructor(...subtagNames: readonly string[]) {
        this.#subtags = subtagNames;
    }

    public check(context: BBTagRuntime, subtagName: string): void {
        const problem = this.#subtags.map(s => ({ s, i: context.subtagStack.lastIndexOf(s) }))
            .reduce((p, c) => p.i < c.i ? c : p, { s: '', i: -1 });
        if (problem.s.length > 0) {
            const { subtag } = context.subtagStack.get(problem.i) ?? { subtag: unknownSubtag };
            throw new BBTagRuntimeError(`{${subtagName}} is disabled inside {${problem.s}}`, `${problem.s} located at:\nIndex ${subtag.ast.start.index}: Line ${subtag.ast.start.line}, column ${subtag.ast.start.column}\nIndex ${subtag.ast.end.index}: Line ${subtag.ast.end.line}, column ${subtag.ast.end.column}`);
        }
    }

    public displayText(): IFormattable<string> {
        return textTemplates.limits.rules.disabledIn.default({ subtagNames: this.#subtags });
    }

    public state(): JToken {
        return null;
    }

    public load(): void {
        // NOOP
    }
}

const unknownSubtag = {
    ast: {
        start: {
            column: -1,
            index: -1,
            line: -1
        },
        get end() { return this.start; }
    }
};
