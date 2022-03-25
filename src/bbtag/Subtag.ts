import { metrics } from '@blargbot/core/Metrics';
import { Timer } from '@blargbot/core/Timer';
import { abstract } from '@blargbot/core/utils';

import { BBTagContext } from './BBTagContext';
import { SubtagCall } from './language';
import { SubtagOptions, SubtagSignature } from './types';
import { SubtagType } from './utils';

@abstract
export abstract class Subtag implements SubtagOptions {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: SubtagType;
    public readonly isTag: true;
    public readonly desc: string | undefined;
    public readonly deprecated: string | boolean;
    public readonly staff: boolean;
    public readonly signatures: readonly SubtagSignature[];
    public readonly hidden: boolean;

    public constructor(options: SubtagOptions) {
        this.name = options.name;
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.isTag = true;
        this.desc = options.desc;
        this.deprecated = options.deprecated ?? false;
        this.staff = options.staff ?? false;
        this.hidden = options.hidden ?? false;
        this.signatures = options.signatures;
    }

    @abstract.sealed
    public async * execute(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined> {
        const timer = new Timer().start();
        try {
            yield* this.executeCore(context, subtagName, subtag);
        } finally {
            timer.end();
            metrics.subtagLatency.labels(this.name).observe(timer.elapsed);
            const debugPerf = context.data.subtags[this.name] ??= [];
            debugPerf.push(timer.elapsed);
        }
    }

    protected abstract executeCore(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined>;
}
