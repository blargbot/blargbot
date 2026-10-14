import { guard, metrics } from '@blargbot/core';
import type { IFormattable } from '@blargbot/formatting';

import type { BBTagContext } from './BBTagContext.js';
import type { SubtagCall } from './language/index.js';
import type { SubtagOptions, SubtagSignature } from './types.js';
import type { SubtagType } from './utils/index.js';

export abstract class Subtag implements SubtagOptions<IFormattable<string>> {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: SubtagType;
    public readonly description: IFormattable<string> | undefined;
    public readonly deprecated: string | boolean;
    public readonly staff: boolean;
    public readonly signatures: ReadonlyArray<SubtagSignature<IFormattable<string>>>;
    public readonly hidden: boolean;

    public constructor(options: SubtagOptions<IFormattable<string>>) {
        this.name = options.name;
        this.aliases = [
            ...options.aliases ?? [],
            ...options.signatures.map(s => s.subtagName)
                .filter(guard.hasValue)
        ];
        this.category = options.category;
        this.description = options.description;
        this.deprecated = options.deprecated ?? false;
        this.staff = options.staff ?? false;
        this.hidden = options.hidden ?? false;
        this.signatures = options.signatures;
    }

    public async * execute(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined> {
        const start = performance.now();
        try {
            yield* this.executeCore(context, subtagName, subtag);
        } finally {
            const elapsed = performance.now() - start;
            metrics.subtagLatency.labels(this.name).observe(elapsed);
            metrics.subtagCounter.labels(this.name).inc();
            context.subtagInvocations.getOrInsert(this.name, []).push(elapsed);
        }
    }

    protected abstract executeCore(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined>;
}
