import { metrics } from '@blargbot/core/Metrics.js';
import { Timer } from '@blargbot/core/Timer.js';
import { guard } from '@blargbot/core/utils/index.js';
import { IFormattable } from '@blargbot/formatting';

import { BBTagContext } from './BBTagContext.js';
import { SubtagCall } from './language/index.js';
import { SubtagOptions, SubtagSignature } from './types.js';
import { SubtagType } from './utils/index.js';

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
        const timer = new Timer().start();
        try {
            yield* this.executeCore(context, subtagName, subtag);
        } finally {
            timer.end();
            metrics.subtagLatency.labels(this.name).observe(timer.elapsed);
            metrics.subtagCounter.labels(this.name).inc();
            const debugPerf = context.data.subtags[this.name] ??= [];
            debugPerf.push(timer.elapsed);
        }
    }

    protected abstract executeCore(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined>;
}
