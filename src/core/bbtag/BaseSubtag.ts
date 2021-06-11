import { Client as ErisClient } from 'eris';
import { Cluster } from '../../cluster';
import { SubtagType } from '../../utils';
import { SubtagCall, SubtagHandler, SubtagHandlerDefinition, SubtagResult } from './types';
import { BBTagContext } from './BBTagContext';
import { compileSignatures } from './compilation/compileSignatures';
import { parseDefinitions } from './compilation/parseDefinitions';
import { Timer } from '../../structures/Timer';
import { metrics } from '../Metrics';

export interface SubtagOptions {
    name: string;
    aliases?: readonly string[];
    category: SubtagType;
    desc?: string;
    usage: string;
    exampleCode?: string | null;
    exampleIn?: string | null;
    exampleOut?: string | null;
    deprecated?: string | false;
    staff?: boolean;
    acceptsArrays?: boolean;
    definition: readonly SubtagHandlerDefinition[];
}

export abstract class BaseSubtag implements Required<SubtagOptions>, SubtagHandler {
    public readonly name: string;
    public readonly aliases: readonly string[];
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
    public readonly definition: readonly SubtagHandlerDefinition[];
    public readonly handler: SubtagHandler;

    public get logger(): CatLogger { return this.cluster.logger; }
    public get discord(): ErisClient { return this.cluster.discord; }

    protected constructor(
        public readonly cluster: Cluster,
        options: SubtagOptions
    ) {
        if (options.definition.length === 0)
            throw new Error('Cannot have no handler definitions!');

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

        const signatures = parseDefinitions(this.definition);
        this.handler = compileSignatures(signatures);
    }

    public async execute(context: BBTagContext, subtag: SubtagCall): Promise<SubtagResult> {
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

    public notANumber(context: BBTagContext, subtag?: SubtagCall): string {
        return context.addError('Not a number', subtag);
    }

    public notEnoughArguments(context: BBTagContext, subtag?: SubtagCall): string {
        return context.addError('Not enough arguments', subtag);
    }

    public customError(errorText: string, context: BBTagContext, subtag?: SubtagCall): string {
        return context.addError(errorText, subtag);
    }
}