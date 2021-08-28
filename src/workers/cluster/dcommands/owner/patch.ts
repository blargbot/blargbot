import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType, guard } from '@cluster/utils';
import { EmbedFieldData, MessageEmbedOptions } from 'discord.js';

export class PatchCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'patch',
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: '{features+?}',
                    description: 'Makes a patch note',
                    execute: (ctx, [features], flags) => this.patch(ctx, features, flags.f?.merge().raw, flags.n?.merge().raw)
                }
            ],
            flags: [
                { flag: 'f', word: 'fixes', description: 'The bug fixes of the patch.' },
                { flag: 'n', word: 'notes', description: 'Other notes.' }
            ]
        });
    }

    public async patch(context: CommandContext, features: string | undefined, fixes: string | undefined, notes: string | undefined): Promise<string> {
        const channel = await context.util.getChannel(context.config.discord.channels.changelog);
        if (channel === undefined || !guard.isGuildChannel(channel) || !guard.isTextableChannel(channel))
            return this.error('I cant find the changelog channel!');

        if (features === undefined && fixes === undefined && notes === undefined)
            return this.error('I cant send out an empty patch note!');

        const role = await context.util.getRole(channel.guild, context.config.discord.roles.updates);
        const { major = 0, minor = 0, patch = 0 } = await context.database.vars.get('version') ?? {};
        const fields: EmbedFieldData[] = [];
        const embed: MessageEmbedOptions = {
            author: { name: `Version ${major}.${minor}.${patch}` },
            fields: fields,
            color: 0x2df952
        };

        if (features !== undefined) {
            embed.title = 'New Features and Changes';
            embed.description = features;
        }

        if (fixes !== undefined)
            fields.push({ name: 'Bug Fixes', value: fixes });

        if (notes !== undefined)
            fields.push({ name: 'Other Notes', value: notes });

        const confirmed = await context.util.queryConfirm({
            context: context.channel,
            actors: context.author,
            prompt: { content: 'This is a preview of what the patch will look like', embeds: [embed] },
            confirm: 'Looks good, post it!',
            cancel: 'Nah let me change something'
        });

        if (confirmed !== true)
            return this.info('Patch cancelled');

        const changelog = await context.send(channel, {
            content: role?.toString(),
            embeds: [embed],
            allowedMentions: {
                roles: role === undefined ? undefined : [role.id]
            }
        });

        if (changelog === undefined)
            return this.error('I wasnt able to send the patch notes!');

        if (changelog.crosspostable)
            await changelog.crosspost();

        return this.success('Done!');
    }
}
