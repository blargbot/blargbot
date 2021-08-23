import { getDocsEmbed } from '@cluster/bbtag';
import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';
import { SendPayload } from '@core/types';

export class DocsCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'docs',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Displays some generic docs about BBTag.',
                    execute: ctx => this.showGenericDocs(ctx)
                },
                {
                    parameters: 'variables|variable|vars|var',
                    description: 'Displays information about variables and variable scopes.',
                    execute: (ctx) => this.showVariableDocs(ctx)
                },
                {
                    parameters: 'argtypes|arguments|parameters|params',
                    description: 'Displays information about the parameter syntax.',
                    execute: ctx => this.showParameterTypeDocs(ctx)
                },
                {
                    parameters: 'terms|terminology|definitions|define {term?}',
                    description: 'Displays information about the terms used in BBTag.',
                    execute: (ctx, [termName]) => this.showTerminologyDocs(ctx, termName)
                },
                {
                    parameters: 'dynamic',
                    description: 'Displays information about dynamic subtags.',
                    execute: (ctx) => this.showDynamicDocs(ctx)
                },
                {
                    parameters: 'subtags {category?}',
                    description: 'Displays a list of categories, or a list of subtags for `category`',
                    execute: (ctx, [cat]) => this.showSubtagsDocs(ctx, cat)
                }
            ]
        });
    }

    public async showGenericDocs(context: CommandContext): Promise<SendPayload> {
        const embed = await getDocsEmbed(context, 'index');
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }

    public async showVariableDocs(context: CommandContext): Promise<SendPayload> {
        const embed = await getDocsEmbed(context, 'variables');
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }

    public async showParameterTypeDocs(context: CommandContext): Promise<SendPayload> {
        const embed = await getDocsEmbed(context, 'parameters');
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }

    public async showTerminologyDocs(context: CommandContext, input?: string): Promise<SendPayload> {
        const embed = await getDocsEmbed(context, `terminology${input !== undefined ? ' ' + input : ''}`);
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }

    public async showDynamicDocs(context: CommandContext): Promise<SendPayload> {
        const embed = await getDocsEmbed(context, 'dynamic');
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }

    public async showSubtagsDocs(context: CommandContext, input?: string): Promise<SendPayload> {
        const embed = await getDocsEmbed(context, `subtags${input !== undefined ? ' ' + input : ''}`);
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }
}
