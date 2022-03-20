import { BaseGlobalCommand, CommandContext } from '@blargbot/cluster/command';
import { CommandType, getBBTagDocsEmbed } from '@blargbot/cluster/utils';
import { SendPayload } from '@blargbot/core/types';

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
                    execute: (ctx, [termName]) => this.showTerminologyDocs(ctx, termName.asOptionalString)
                },
                {
                    parameters: 'dynamic',
                    description: 'Displays information about dynamic subtags.',
                    execute: (ctx) => this.showDynamicDocs(ctx)
                },
                {
                    parameters: 'subtags {category?}',
                    description: 'Displays a list of categories, or a list of subtags for `category`',
                    execute: (ctx, [cat]) => this.showSubtagsDocs(ctx, cat.asOptionalString)
                },
                {
                    parameters: '{subtagName}',
                    description: 'Displays information about a specific subtag.',
                    execute: (ctx, [subtagName]) => this.showSubtagDocs(ctx, subtagName.asString)
                }
            ]
        });
    }

    public async showGenericDocs(context: CommandContext): Promise<SendPayload> {
        const embed = await getBBTagDocsEmbed(context, 'index');
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }

    public async showVariableDocs(context: CommandContext): Promise<SendPayload> {
        const embed = await getBBTagDocsEmbed(context, 'variables');
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }

    public async showParameterTypeDocs(context: CommandContext): Promise<SendPayload> {
        const embed = await getBBTagDocsEmbed(context, 'parameters');
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }

    public async showTerminologyDocs(context: CommandContext, input?: string): Promise<SendPayload> {
        const embed = await getBBTagDocsEmbed(context, `terminology${input !== undefined ? ' ' + input : ''}`);
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }

    public async showDynamicDocs(context: CommandContext): Promise<SendPayload> {
        const embed = await getBBTagDocsEmbed(context, 'dynamic');
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }

    public async showSubtagsDocs(context: CommandContext, input?: string): Promise<SendPayload> {
        const embed = await getBBTagDocsEmbed(context, `subtags${input !== undefined ? ' ' + input : ''}`);
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }

    public async showSubtagDocs(context: CommandContext, input: string): Promise<SendPayload> {
        const embed = await getBBTagDocsEmbed(context, input);
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}docs\` for a list of all topics`);
        return embed;
    }
}
