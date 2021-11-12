import { AnySubtagHandlerDefinition, SubtagCall, SubtagHandler, SubtagHandlerCallSignature, SubtagOptions } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { metrics } from '@core/Metrics';
import { Timer } from '@core/Timer';
import { MessageEmbedOptions } from 'discord.js';

import { BBTagContext } from './BBTagContext';
import { compileSignatures, parseDefinitions } from './compilation';

export abstract class BaseSubtag implements SubtagOptions {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: SubtagType;
    public readonly isTag: true;
    public readonly desc: string | undefined;
    public readonly deprecated: string | boolean;
    public readonly staff: boolean;
    public readonly signatures: readonly SubtagHandlerCallSignature[];
    public readonly handler: SubtagHandler;
    public readonly hidden: boolean;

    protected constructor(options: SubtagOptions & { definition: readonly AnySubtagHandlerDefinition[]; }) {
        this.name = options.name;
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.isTag = true;
        this.desc = options.desc;
        this.deprecated = options.deprecated ?? false;
        this.staff = options.staff ?? false;
        this.hidden = options.hidden ?? false;
        this.signatures = parseDefinitions(options.definition);
        this.handler = compileSignatures(this.signatures);
    }

    public async * execute(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined> {
        const timer = new Timer().start();
        try {
            const result = await this.handler.execute(context, subtagName, subtag);
            yield* result.execute(context, subtag);
        } finally {
            timer.end();
            metrics.subtagLatency.labels(this.name).observe(timer.elapsed);
            const debugPerf = context.state.subtags[this.name] ??= [];
            debugPerf.push(timer.elapsed);
        }
    }

    public enrichDocs(docs: MessageEmbedOptions): MessageEmbedOptions {
        return docs;
    }
}
