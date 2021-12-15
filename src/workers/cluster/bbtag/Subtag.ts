import { SubtagCall, SubtagOptions, SubtagResult, SubtagSignatureDetails } from '@cluster/types';
import { abstract, SubtagType } from '@cluster/utils';
import { metrics } from '@core/Metrics';
import { Timer } from '@core/Timer';
import { EmbedOptions } from 'eris';

import { BBTagContext } from './BBTagContext';

@abstract
export abstract class Subtag implements SubtagOptions {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: SubtagType;
    public readonly isTag: true;
    public readonly desc: string | undefined;
    public readonly deprecated: string | boolean;
    public readonly staff: boolean;
    public readonly signatures: readonly SubtagSignatureDetails[];
    public readonly hidden: boolean;

    protected constructor(options: SubtagOptions) {
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
    public async * execute(context: BBTagContext, subtagName: string, subtag: SubtagCall): SubtagResult {
        const timer = new Timer().start();
        try {
            yield* this.executeCore(context, subtagName, subtag);
        } finally {
            timer.end();
            metrics.subtagLatency.labels(this.name).observe(timer.elapsed);
            const debugPerf = context.state.subtags[this.name] ??= [];
            debugPerf.push(timer.elapsed);
        }
    }

    protected abstract executeCore(context: BBTagContext, subtagName: string, subtag: SubtagCall): SubtagResult;

    public enrichDocs(docs: EmbedOptions): EmbedOptions {
        return docs;
    }
}
