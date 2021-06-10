import { Client as ErisClient } from 'eris';
import { Cluster } from '../../cluster';
import { SubtagType } from '../../utils';
import { SubtagCall, SubtagHandler, SubtagHandlerDefintion, SubtagResult } from './types';
import { RuntimeContext } from './RuntimeContext';
import { compileHandler } from './compileHandler';
import { Timer } from '../../structures/Timer';
import { metrics } from '../Metrics';

export interface SubtagOptions {
    name: string;
    aliases?: string[];
    category: SubtagType;
    desc?: string;
    usage: string;
    exampleCode?: string | null;
    exampleIn?: string | null;
    exampleOut?: string | null;
    deprecated?: string | false;
    staff?: boolean;
    acceptsArrays?: boolean;
    definition: SubtagHandlerDefintion;
}

export abstract class BaseSubtag implements Required<SubtagOptions>, SubtagHandler {
    public readonly name: string;
    public readonly aliases: string[];
    public readonly category: SubtagType;
    public readonly isTag: true;
    public readonly desc: string;
    public readonly usage: string;
    public readonly exampleCode: string | null;
    public readonly exampleIn: string | null;
    public readonly exampleOut: string | null;
    public readonly deprecated: string | false;
    public readonly staff: boolean;
    public readonly acceptsArrays: boolean;
    public readonly definition: SubtagHandlerDefintion;
    public readonly handler: SubtagHandler;

    public get logger(): CatLogger { return this.cluster.logger; }
    public get discord(): ErisClient { return this.cluster.discord; }

    protected constructor(
        public readonly cluster: Cluster,
        options: SubtagOptions
    ) {
        this.name = options.name;
        this.definition = options.definition;
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.isTag = true;
        this.desc = options.desc ?? '';
        this.usage = options.usage;
        this.exampleCode = options.exampleCode ?? null;
        this.exampleIn = options.exampleIn ?? null;
        this.exampleOut = options.exampleOut ?? null;
        this.deprecated = options.deprecated ?? false;
        this.staff = options.staff ?? false;
        this.acceptsArrays = options.acceptsArrays ?? false;

        this.handler = compileHandler(this.definition);
    }

    public async execute(context: RuntimeContext, subtag: SubtagCall): Promise<SubtagResult> {
        const timer = new Timer().start();
        try {
            return await this.handler.execute(context, subtag);
        } finally {
            timer.end();
            metrics.subtagLatency.labels(this.name).observe(timer.elapsed);
            const debugPerf = context.state.subtags[this.name] ??= [];
            debugPerf.push(timer.elapsed);
        }
    }

    public notANumber(context: RuntimeContext, subtag?: SubtagCall): string {
        return context.addError('Not a number', subtag);
    }

    public notEnoughArguments(context: RuntimeContext, subtag?: SubtagCall): string {
        return context.addError('Not enough arguments', subtag);
    }

    public customError(errorText: string, context: RuntimeContext, subtag?: SubtagCall): string {
        return context.addError(errorText, subtag);
    }
}