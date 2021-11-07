import { BBTagContext } from '@cluster/bbtag';
import { RuntimeLimitRule } from '@cluster/types';
import { humanize } from '@cluster/utils';

export class DisabledInRule implements RuntimeLimitRule {
    private readonly subtags: readonly string[];
    public constructor(...subtagNames: readonly string[]) {
        this.subtags = subtagNames;
    }

    public check(context: BBTagContext): boolean {
        return !this.subtags.some(s => context.callStack.contains(s));
    }

    public errorText(subtagName: string, context: BBTagContext): string {
        const problem = this.subtags.map(s => ({ s, i: context.callStack.lastIndexOf(s) })).reduce((p, c) => p.i < c.i ? c : p);
        return `{${subtagName}} is disabled inside {${problem.s}}`;
    }

    public displayText(): string {
        return `Cannot be used in the arguments to ${humanize.smartJoin(this.subtags.map(s => `{${s}}`), ', ', ' or ')}`;
    }

    public state(): JToken {
        return null;
    }

    public load(): void {
        // NOOP
    }
}
