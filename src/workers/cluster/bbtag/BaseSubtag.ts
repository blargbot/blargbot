import { SubtagCall, SubtagHandler, SubtagHandlerCallSignature, SubtagHandlerDefinition, SubtagOptions, SubtagResult } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { metrics } from '@core/Metrics';
import { Timer } from '@core/Timer';
import { MessageEmbedOptions } from 'discord.js';

import { BBTagContext } from './BBTagContext';
import { compileSignatures, parseDefinitions } from './compilation';

export abstract class BaseSubtag implements SubtagOptions, SubtagHandler {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: SubtagType;
    public readonly isTag: true;
    public readonly desc: string | undefined;
    public readonly deprecated: string | boolean;
    public readonly staff: boolean;
    public readonly signatures: readonly SubtagHandlerCallSignature[];
    public readonly handler: SubtagHandler;

    protected constructor(options: SubtagOptions & { definition: readonly SubtagHandlerDefinition[]; }) {
        this.name = options.name;
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.isTag = true;
        this.desc = options.desc;
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

    public enrichDocs(docs: MessageEmbedOptions): MessageEmbedOptions {
        return docs;
    }
    public notANumber(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('Not a number', subtag, debugMessage);
    }

    public notABoolean(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('Not a boolean', subtag, debugMessage);
    }

    public notAnArray(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('Not an array', subtag, debugMessage);
    }

    public notEnoughArguments(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('Not enough arguments', subtag, debugMessage);
    }

    public channelNotFound(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('No channel found', subtag, debugMessage);
    }

    public noMessageFound(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('No message found', subtag, debugMessage);
    }

    public noUserFound(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('No user found', subtag, debugMessage);
    }
    public noRoleFound(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('No role found', subtag, debugMessage);
    }
    public userNotInGuild(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('User not in guild', subtag, debugMessage);
    }

    public invalidEmbed(issue: string, context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('Invalid embed: ' + issue, subtag, debugMessage);//TODO move issue to debug perhaps?
    }

    public tooManyLoops(context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError('Too many loops', subtag, debugMessage);
    }
    public customError(errorText: string, context: BBTagContext, subtag?: SubtagCall, debugMessage?: string): string {
        return context.addError(errorText, subtag, debugMessage);
    }
}
