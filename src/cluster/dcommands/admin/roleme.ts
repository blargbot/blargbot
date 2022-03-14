import { BaseGuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { bbtag, codeBlock, CommandType, guard } from '@blargbot/cluster/utils';
import { GuildRolemeEntry, SendContent } from '@blargbot/core/types';
import { Constants, EmbedOptions } from 'eris';

export class RolemeCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'roleme',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'add|create {~phrase+}',
                    description: 'Adds a new roleme with the given phrase',
                    execute: (ctx, [phrase], flags) => this.addRoleme(ctx, phrase.asString, {
                        caseSensitive: flags.C !== undefined,
                        addRoles: flags.a?.map(v => v.value),
                        removeRoles: flags.r?.map(v => v.value),
                        channel: flags.c?.map(v => v.value)
                    })
                },
                {
                    parameters: 'remove|delete {rolemeId:integer}',
                    description: 'Deletes the given roleme',
                    execute: (ctx, [id]) => this.deleteRoleme(ctx, id.asInteger)
                },
                {
                    parameters: 'edit {rolemeId:integer} {~newPhrase+?}',
                    description: 'Edits the given roleme',
                    execute: (ctx, [id, phrase], flags) => this.editRoleme(ctx, id.asInteger, phrase.asOptionalString, {
                        caseSensitive: flags.C !== undefined,
                        addRoles: flags.a?.map(v => v.value),
                        removeRoles: flags.r?.map(v => v.value),
                        channel: flags.c?.map(v => v.value)
                    })
                },
                {
                    parameters: 'setmessage {rolemeId:integer} {~bbtag+?}',
                    description: 'Sets the bbtag compatible message to show when the roleme is triggered',
                    execute: (ctx, [id, bbtag]) => this.setMessage(ctx, id.asInteger, bbtag.asOptionalString)
                },
                {
                    parameters: 'rawmessage {rolemeId:integer}',
                    description: 'Gets the current message that will be sent when the roleme is triggered',
                    execute: (ctx, [id]) => this.getRawMessage(ctx, id.asInteger)
                },
                {
                    parameters: 'debugmessage {rolemeId:integer}',
                    description: 'Executes the roleme message as if you triggered the roleme',
                    execute: (ctx, [id]) => this.debugMessage(ctx, id.asInteger)
                },
                {
                    parameters: 'setauthorizer {rolemeId:integer}',
                    description: 'Sets the roleme message to run using your permissions',
                    execute: (ctx, [id]) => this.setAuthorizer(ctx, id.asInteger)
                },
                {
                    parameters: 'info {rolemeId:integer}',
                    description: 'Shows information about a roleme',
                    execute: (ctx, [id]) => this.showInfo(ctx, id.asInteger)
                },
                {
                    parameters: 'list',
                    description: 'Lists the rolemes currently active on this server',
                    execute: (ctx) => this.listRolemes(ctx)
                }
            ],
            flags: [
                { flag: 'a', word: 'add', description: 'A list of roles to add in the roleme' },
                { flag: 'r', word: 'remove', description: 'A list of roles to remove in the roleme' },
                { flag: 'C', word: 'case', description: 'Whether the phrase is case sensitive' },
                { flag: 'c', word: 'channels', description: 'The channels the roleme should be in' }
            ]
        });
    }

    public async addRoleme(context: GuildCommandContext, phrase: string, options: RolemeOptions): Promise<string | undefined> {
        const roleme = await this.buildRoleme(context, {
            message: phrase,
            add: options.addRoles ?? [],
            casesensitive: options.caseSensitive,
            channels: options.channel ?? [],
            remove: options.removeRoles ?? []
        });

        switch (roleme) {
            case 'FAILED': return this.error('Something went wrong while I was trying to create that roleme');
            case 'INVALID_CHANNELS': return this.error('I couldnt locate any of the channels you provided');
            case 'INVALID_ROLES': return this.error('I couldnt locate any of the roles you provided');
            case 'NO_ROLES': return this.error('You must provide atleast 1 role to add or remove');
            case 'NO_TRIGGER': return this.error('You must provide a trigger phrase for the roleme');
            case 'TIMED_OUT': return undefined;
        }

        const rolemes = await context.database.guilds.getRolemes(context.channel.guild.id);
        const lastId = Math.max(0, ...Object.keys(rolemes ?? {}).map(r => parseInt(r)));
        const nextId = isNaN(lastId) ? 0 : lastId + 1;
        await context.database.guilds.setRoleme(context.channel.guild.id, nextId, roleme);
        return this.success(`Roleme \`${nextId}\` has been created!`);
    }

    public async editRoleme(context: GuildCommandContext, id: number, phrase: string | undefined, options: RolemeOptions): Promise<string | undefined> {
        const current = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (current === undefined)
            return this.error(`Roleme ${id} doesnt exist`);

        const roleme = await this.buildRoleme(context, {
            message: phrase ?? current.message,
            add: options.addRoles ?? current.add,
            casesensitive: phrase === undefined ? current.casesensitive : options.caseSensitive,
            channels: options.channel ?? current.channels,
            remove: options.removeRoles ?? current.remove
        });

        switch (roleme) {
            case 'FAILED': return this.error('Something went wrong while I was trying to edit that roleme');
            case 'INVALID_CHANNELS': return this.error('I couldnt locate any of the channels you provided');
            case 'INVALID_ROLES': return this.error('I couldnt locate any of the roles you provided');
            case 'NO_ROLES': return this.error('You must provide atleast 1 role to add or remove');
            case 'NO_TRIGGER': return this.error('You must provide a trigger phrase for the roleme');
            case 'TIMED_OUT': return undefined;
        }

        await context.database.guilds.setRoleme(context.channel.guild.id, id, roleme);
        return this.success(`Roleme \`${id}\` has been updated!`);
    }

    private async buildRoleme(context: GuildCommandContext, roleme: GuildRolemeEntry): Promise<GuildRolemeEntry | 'TIMED_OUT' | 'NO_ROLES' | 'NO_TRIGGER' | 'FAILED' | 'INVALID_CHANNELS' | 'INVALID_ROLES'> {
        const result: Mutable<GuildRolemeEntry> = { casesensitive: false, channels: [], message: '', add: [], remove: [] };

        if (roleme.message !== '') {
            result.message = roleme.message;
            result.casesensitive = roleme.casesensitive;
        } else {
            const trigger = await context.util.queryText({
                context: context.message,
                actors: context.author,
                prompt: this.question('What should users type for this roleme to trigger?')
            });

            switch (trigger.state) {
                case 'CANCELLED': return 'NO_TRIGGER';
                case 'SUCCESS': break;
                default: return 'TIMED_OUT';
            }

            const caseSensitive = await context.util.queryConfirm({
                context: context.message,
                actors: context.author,
                prompt: this.question('Is the trigger case sensitive?'),
                cancel: { style: Constants.ButtonStyles.SECONDARY, label: 'No' },
                confirm: { style: Constants.ButtonStyles.SECONDARY, label: 'Yes' }
            });

            if (caseSensitive === undefined)
                return 'TIMED_OUT';

            result.message = trigger.value;
            result.casesensitive = caseSensitive;
        }

        if (roleme.channels.length > 0) {
            const channels = [];
            for (const channelStr of roleme.channels) {
                const channel = await context.queryChannel({ filter: channelStr });
                if (channel.state === 'SUCCESS' && guard.isTextableChannel(channel.value))
                    channels.push(channel.value.id);
            }
            if (channels.length === 0)
                return 'INVALID_CHANNELS';
            result.channels = channels;
        } else if (roleme.add.length === 0 && roleme.remove.length === 0) {
            const channels = await context.util.queryText({
                context: context.message,
                actors: context.author,
                prompt: this.question('Please mention all the channels you want the roleme to be available in'),
                parse: message => ({ success: true, value: message.channelMentions }),
                cancel: { label: 'All channels', style: Constants.ButtonStyles.PRIMARY }
            });

            switch (channels.state) {
                case 'CANCELLED': break;
                case 'SUCCESS':
                    result.channels = channels.value;
                    break;
                default: return 'TIMED_OUT';
            }
        }

        if (roleme.add.length === 0 && roleme.remove.length === 0) {
            const toAdd = await this.requestRoles(context, 'add');
            if (typeof toAdd === 'string')
                return toAdd;
            result.add = toAdd;

            const toRemove = await this.requestRoles(context, 'remove');
            if (typeof toRemove === 'string')
                return toRemove;
            result.remove = toRemove;

            if (result.add.length === 0 && result.remove.length === 0)
                return 'NO_ROLES';
        } else {
            const toAdd = [];
            for (const roleStr of result.add) {
                const role = await context.queryRole({ filter: roleStr });
                if (role.state === 'SUCCESS')
                    toAdd.push(role.value.id);
            }
            result.add = toAdd;

            const toRemove = [];
            for (const roleStr of result.remove) {
                const role = await context.queryRole({ filter: roleStr });
                if (role.state === 'SUCCESS')
                    toRemove.push(role.value.id);
            }
            result.remove = toRemove;

            if (result.remove.length === 0 && result.add.length === 0)
                return 'INVALID_ROLES';
        }

        return result;
    }

    public async deleteRoleme(context: GuildCommandContext, id: number): Promise<string> {
        const roleme = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (roleme === undefined)
            return this.error(`Roleme ${id} doesnt exist`);

        await context.database.guilds.setRoleme(context.channel.guild.id, id, undefined);
        return this.success(`Roleme ${id} has been deleted`);
    }

    public async setMessage(context: GuildCommandContext, id: number, message: string | undefined): Promise<string> {
        const roleme = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (roleme === undefined)
            return this.error(`Roleme ${id} doesnt exist`);

        await context.database.guilds.setRoleme(context.channel.guild.id, id, {
            ...roleme,
            output: message === undefined ? undefined : {
                ...roleme.output ?? {},
                author: context.author.id,
                content: message
            }
        });

        return this.success(`Roleme ${id} has now had its message set`);
    }

    public async getRawMessage(context: GuildCommandContext, id: number): Promise<string | SendContent> {
        const roleme = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (roleme === undefined)
            return this.error(`Roleme ${id} doesnt exist`);

        if (roleme.output === undefined)
            return this.error(`Roleme ${id} doesnt have a custom message`);

        const response = this.info(`The raw code for the interval is:\n${codeBlock(roleme.output.content)}`);
        return guard.checkMessageSize(response)
            ? response
            : {
                content: this.info('The raw code for the interval is attached'),
                files: [
                    {
                        name: 'interval.bbtag',
                        file: roleme.output.content
                    }
                ]
            };
    }

    public async debugMessage(context: GuildCommandContext, id: number): Promise<string | SendContent> {
        const roleme = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (roleme === undefined)
            return this.error(`Roleme ${id} doesnt exist`);

        if (roleme.output === undefined)
            return this.error(`Roleme ${id} doesnt have a custom message`);

        const result = await context.cluster.rolemes.invokeMessage(context.message, roleme);
        return bbtag.createDebugOutput(result);
    }

    public async setAuthorizer(context: GuildCommandContext, id: number): Promise<string> {
        const roleme = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (roleme === undefined)
            return this.error(`Roleme ${id} doesnt exist`);

        if (roleme.output === undefined)
            return this.error(`Roleme ${id} doesnt have a custom message`);

        await context.database.guilds.setRoleme(context.channel.guild.id, id, {
            ...roleme,
            output: {
                ...roleme.output,
                authorizer: context.author.id
            }
        });

        return this.success(`Your permissions will now be used for roleme ${id}`);
    }

    public async showInfo(context: GuildCommandContext, id: number): Promise<string | EmbedOptions> {
        const roleme = await context.database.guilds.getRoleme(context.channel.guild.id, id);
        if (roleme === undefined)
            return this.error(`Roleme ${id} doesnt exist`);

        const toAdd = roleme.add.length === 0 ? 'None' : roleme.add.map(r => `<@&${r}>`).join('\n');
        const toRemove = roleme.remove.length === 0 ? 'None' : roleme.remove.map(r => `<@&${r}>`).join('\n');

        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: `Roleme #${id}`,
            fields: [
                { name: `Phrase (case ${roleme.casesensitive ? 'sensistive' : 'insensitive'})`, value: roleme.message, inline: true },
                { name: 'Roles added', value: toAdd, inline: true },
                { name: 'Roles removed', value: toRemove, inline: true },
                { name: 'Channels', value: roleme.channels.length === 0 ? 'Anywhere' : roleme.channels.map(c => `<#${c}>`).join('\n'), inline: true },
                ...roleme.output === undefined ? [] : [
                    { name: 'KnownMessage', value: `**Author:** <@${roleme.output.author}>\n**Authorizer:** <@${roleme.output.authorizer ?? roleme.output.author}>`, inline: true }
                ]
            ]
        };
    }

    public async listRolemes(context: GuildCommandContext): Promise<string | EmbedOptions> {
        const rolemes = Object.entries(await context.database.guilds.getRolemes(context.channel.guild.id) ?? {})
            .filter((e): e is [string, GuildRolemeEntry] => e[1] !== undefined);

        if (rolemes.length === 0)
            return this.error('You have no rolemes created!');

        const rolemeByChannel = rolemes.map(r => ({ val: `**Roleme** \`${r[0]}\`: ${r[1].message.replace(/[\\`*_~|]/g, '\\$1')}`, channels: r[1].channels }))
            .flatMap(r => r.channels.length === 0 ? [{ val: r.val, channel: 'All channels' }] : r.channels.map(c => ({ val: r.val, channel: `<#${c}>` })))
            .reduce<Record<string, string[]>>((p, c) => {
                (p[c.channel] ??= []).push(c.val);
                return p;
            }, {});

        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: 'Rolemes',
            description: Object.entries(rolemeByChannel)
                .map(([channel, rolemes]) => `${channel}\n${rolemes.join('\n')}`)
                .join('\n\n')
        };
    }

    private async requestRoles(context: GuildCommandContext, mode: 'add' | 'remove'): Promise<string[] | 'TIMED_OUT' | 'FAILED'> {
        const result = await context.util.queryText<string[]>({
            context: context.message,
            actors: context.author,
            prompt: this.question(`Please type the roles you want the roleme to ${mode}, 1 per line. Mentions, ids or names can be used.`),
            parse: async message => {
                const roles = [];
                for (const line of message.content.split('\n')) {
                    const role = await context.queryRole({ filter: line });
                    if (role.state === 'SUCCESS')
                        roles.push(role.value.id);
                }

                if (roles.length > 0)
                    return { success: true, value: roles } as const;
                return { success: false, error: this.error('I couldnt find any of the roles from your message, please try again.') } as const;
            },
            cancel: { label: 'No roles', style: Constants.ButtonStyles.PRIMARY }
        });

        switch (result.state) {
            case 'CANCELLED': return [];
            case 'SUCCESS': return result.value;
            default: return result.state;
        }
    }
}

interface RolemeOptions {
    caseSensitive: boolean;
    addRoles?: string[];
    removeRoles?: string[];
    channel?: string[];
}
