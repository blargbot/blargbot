import type { IFormattable } from '@blargbot/formatting';

import type { BBTagContext } from './BBTagContext.js';
import type { SubtagCall } from './language/index.js';
import type { SubtagOptions, SubtagSignature } from './types.js';
import type { SubtagType } from './utils/index.js';

export abstract class Subtag implements SubtagOptions<IFormattable<string>> {
    public abstract readonly name: string;
    public abstract readonly aliases: readonly string[];
    public abstract readonly category: SubtagType;
    public abstract readonly description: IFormattable<string> | undefined;
    public abstract readonly deprecated: string | boolean;
    public abstract readonly staff: boolean;
    public abstract readonly hidden: boolean;
    public abstract readonly signatures: ReadonlyArray<SubtagSignature<IFormattable<string>>>;

    public async * execute(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined> {
        using _hook = context.engine.hooks.subtagExecuting?.(context, this);
        yield* this.executeCore(context, subtagName, subtag);
    }

    protected abstract executeCore(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined>;

    public toString(): string {
        return this.signatures.length === 0 ? `{${this.name}}` : `{${this.name};...}`;
    }
}
