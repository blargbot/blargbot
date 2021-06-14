import { Client as ErisClient, EmbedOptions } from 'eris';
import { Cluster } from '../../cluster';
import { SubtagType } from '../../utils';
import { SubtagCall, SubtagHandler, SubtagHandlerCallSignature, SubtagHandlerDefinition, SubtagResult } from './types';
import { BBTagContext } from './BBTagContext';
import { compileSignatures } from './compilation/compileSignatures';
import { parseDefinitions } from './compilation/parseDefinitions';
import { Timer } from '../../structures/Timer';
import { metrics } from '../Metrics';

export interface SubtagOptions {
    name: string;
    aliases?: readonly string[];
    category: SubtagType;
    desc?: string | null;
    deprecated?: string | false;
    staff?: boolean;
}

export abstract class BaseSubtag implements Required<SubtagOptions>, SubtagHandler {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: SubtagType;
    public readonly isTag: true;
    public readonly desc: string | null;
    public readonly deprecated: string | false;
    public readonly staff: boolean;
    public readonly signatures: readonly SubtagHandlerCallSignature[];
    public readonly handler: SubtagHandler;

    public get logger(): CatLogger { return this.cluster.logger; }
    public get discord(): ErisClient { return this.cluster.discord; }

    protected constructor(
        public readonly cluster: Cluster,
        options: SubtagOptions & { definition: readonly SubtagHandlerDefinition[] }
    ) {
        this.name = options.name;
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.isTag = true;
        this.desc = options.desc ?? '';
        this.deprecated = options.deprecated ?? false;
        this.staff = options.staff ?? false;
        this.signatures = parseDefinitions(options.definition);
        this.handler = compileSignatures(this.signatures);
    }

    public async execute(context: BBTagContext, subtagName: string, subtag: SubtagCall): Promise<SubtagResult> {
        const timer = new Timer().start();
        try {
            return await this.handler.execute(context, subtagName, subtag);
        } finally {
            timer.end();
            metrics.subtagLatency.labels(this.name).observe(timer.elapsed);
            const debugPerf = context.state.subtags[this.name] ??= [];
            debugPerf.push(timer.elapsed);
        }
    }

    public notANumber(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('Not a number', subtag, debugMessage);
    }

    public enrichDocs(docs: EmbedOptions): EmbedOptions {
        return docs;
    }

    public notABoolean(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('Not a boolean', subtag, debugMessage);
    }

    public notEnoughArguments(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('Not enough arguments', subtag, debugMessage);
    }

    public channelNotFound(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('No channel found', subtag, debugMessage);
    }
    public customError(errorText: string, context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError(errorText, subtag, debugMessage);
    }
}