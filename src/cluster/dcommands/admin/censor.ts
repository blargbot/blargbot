import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { SendContent } from '@blargbot/core/types';
import { codeBlock, guard } from '@blargbot/core/utils';
import { GuildCensor, GuildTriggerTag } from '@blargbot/domain/models';
import { EmbedOptions, KnownChannel, Role, User } from 'eris';

export class CensorCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'censor',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'add|create {~phrase+}',
                    description: 'Creates a censor using the given phrase',
                    execute: (ctx, [phrase], flags) => this.createCensor(ctx, phrase.asString, {
                        isRegex: flags.R !== undefined,
                        decancer: flags.D !== undefined,
                        weight: flags.w?.merge().value,
                        reason: flags.r?.merge().value
                    })
                },
                {
                    parameters: 'edit {id:integer} {~phrase+?}',
                    description: 'Updates a censor',
                    execute: (ctx, [id, phrase], flags) => this.updateCensor(ctx, id.asInteger, phrase.asOptionalString, {
                        isRegex: flags.R !== undefined,
                        decancer: flags.D !== undefined,
                        weight: flags.w?.merge().value,
                        reason: flags.r?.merge().value
                    })
                },
                {
                    parameters: 'delete|remove {id:integer}',
                    description: 'Deletes a censor',
                    execute: (ctx, [id]) => this.deleteCensor(ctx, id.asInteger)
                },
                {
                    parameters: 'exception {action:literal(add|remove)}',
                    subcommands: [
                        {
                            parameters: 'user {user:user+}',
                            description: 'Adds or removes a user from the list of users which all censors ignore',
                            execute: (ctx, [action, user]) => this.ignoreUser(ctx, user.asUser, action.asLiteral === 'add')
                        },
                        {
                            parameters: 'role {role:role+}',
                            description: 'Adds or removes a role from the list of roles which all censors ignore',
                            execute: (ctx, [action, role]) => this.ignoreRole(ctx, role.asRole, action.asLiteral === 'add')
                        },
                        {
                            parameters: 'channel {channel:channel+}',
                            description: 'Adds or removes a channel from the list of channels which all censors ignore',
                            execute: (ctx, [action, channel]) => this.ignoreChannel(ctx, channel.asChannel, action.asLiteral === 'add')
                        }
                    ]
                },
                {
                    parameters: 'setmessage {id:integer?} {type:literal(delete|kick|ban)} {~code+?}',
                    description: 'Sets the message so show when the given censor causes a user to be `kick`ed or `ban`ned, or the message is `delete`d\n' +
                        'If `id` is not provided, the message will be the default message that gets shown if one isnt set for the censor that is triggered',
                    execute: (ctx, [id, type, code]) => this.setMessage(ctx, id.asOptionalInteger, type.asLiteral, code.asOptionalString)
                },
                {
                    parameters: 'setauthorizer {id:integer?} {type:literal(delete|kick|ban)}',
                    description: 'Sets the custom censor message to use your permissions when executing.',
                    execute: (ctx, [id, type]) => this.setAuthorizer(ctx, id.asOptionalInteger, type.asLiteral)
                },
                {
                    parameters: 'rawmessage {id:integer?} {type:literal(delete|kick|ban)}',
                    description: 'Gets the raw code for the given censor',
                    execute: (ctx, [id, type]) => this.getRawMessage(ctx, id.asInteger, type.asLiteral)
                },
                {
                    parameters: 'debug {id:integer} {type:literal(delete|kick|ban)}',
                    description: 'Sets the censor to send you the debug output when it is next triggered by one of your messages. Make sure you arent exempt from censors!',
                    execute: (ctx, [id, type]) => this.setDebug(ctx, id.asInteger, type.asLiteral)
                },
                {
                    parameters: 'list',
                    description: 'Lists all the details about the censors that are currently set up on this server',
                    execute: (ctx) => this.list(ctx)
                },
                {
                    parameters: 'info {id:integer}',
                    description: 'Gets detailed information about the given censor',
                    execute: (ctx, [id]) => this.showInfo(ctx, id.asInteger)
                }
            ],
            flags: [
                { flag: 'R', word: 'regex', description: 'If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.' },
                { flag: 'D', word: 'decancer', description: 'If specified, perform the censor check against the decancered version of the message.' },
                { flag: 'w', word: 'weight', description: 'How many incidents the censor is worth.' },
                { flag: 'r', word: 'reason', description: 'A custom modlog reason. NOT BBTag compatible.' }
            ]
        });
    }

    public async createCensor(context: GuildCommandContext, phrase: string, options: CensorOptions): Promise<string> {
        const censors = await context.database.guilds.getCensors(context.channel.guild.id);

        let weight = 1;
        switch (typeof options.weight) {
            case 'string':
                weight = parseInt(options.weight);
                break;
            case 'number':
                weight = options.weight;
                break;
        }

        if (isNaN(weight))
            return this.error(`The censor weight must be a number but \`${options.weight ?? ''}\` is not`);

        if (weight < 0)
            weight = 0;

        const id = Math.max(...Object.keys(censors?.list ?? {}).map(parseInt), 0) + 1;
        await context.database.guilds.setCensor(context.channel.guild.id, id, {
            regex: options.isRegex,
            decancer: options.decancer,
            term: phrase,
            weight: weight,
            reason: options.reason
        });
        return this.success(`Censor \`${id}\` has been created`);
    }

    public async updateCensor(context: GuildCommandContext, id: number, phrase: string | undefined, options: CensorOptions): Promise<string> {
        const censor = await context.database.guilds.getCensor(context.channel.guild.id, id);
        if (censor === undefined)
            return this.error(`Censor \`${id}\` doesnt exist`);

        let weight = 1;
        switch (typeof options.weight) {
            case 'string':
                weight = parseInt(options.weight);
                break;
            case 'number':
                weight = options.weight;
                break;
        }

        if (isNaN(weight))
            return this.error(`The censor weight must be a number but \`${options.weight ?? ''}\` is not`);

        if (weight < 0)
            weight = 0;

        await context.database.guilds.setCensor(context.channel.guild.id, id, {
            ...censor,
            weight: weight,
            reason: options.reason ?? censor.reason,
            regex: phrase !== undefined ? options.isRegex : censor.regex,
            decancer: phrase !== undefined ? options.decancer : censor.decancer,
            term: phrase ?? censor.term
        });
        return this.success(`Censor \`${id}\` has been updated`);
    }

    public async deleteCensor(context: GuildCommandContext, id: number): Promise<string> {
        const censor = await context.database.guilds.getCensor(context.channel.guild.id, id);
        if (censor === undefined)
            return this.error(`Censor \`${id}\` doesnt exist`);

        await context.database.guilds.setCensor(context.channel.guild.id, id, undefined);
        return this.success(`Censor \`${id}\` has been deleted`);
    }

    public async ignoreUser(context: GuildCommandContext, user: User, ignored: boolean): Promise<string> {
        await context.database.guilds.censorIgnoreUser(context.channel.guild.id, user.id, ignored);
        return this.success(`${user.mention} is now exempt from all censors`);
    }

    public async ignoreChannel(context: GuildCommandContext, channel: KnownChannel, ignored: boolean): Promise<string> {
        if (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild)
            return this.error('The channel must be on this server!');

        await context.database.guilds.censorIgnoreChannel(context.channel.guild.id, channel.id, ignored);
        return this.success(`Messages sent in ${channel.mention} are now exempt from all censors`);
    }

    public async ignoreRole(context: GuildCommandContext, role: Role, ignored: boolean): Promise<string> {
        await context.database.guilds.censorIgnoreRole(context.channel.guild.id, role.id, ignored);
        return this.success(`Anyone with the role ${role.mention} is now exempt from all censors`);
    }

    public async setMessage(context: GuildCommandContext, id: number | undefined, type: string, code: string | undefined): Promise<string> {
        if (!allowedTypes.has(type))
            return this.error(`\`${type}\` is not a valid type`);

        const rule = await context.database.guilds.getCensorRule(context.channel.guild.id, id, type);
        if (id !== undefined) {
            const censor = await context.database.guilds.getCensor(context.channel.guild.id, id);
            if (censor === undefined)
                return this.error(`Censor \`${id}\` doesnt exist`);
        }

        await context.database.guilds.setCensorRule(context.channel.guild.id, id, type, code === undefined ? undefined : {
            ...rule ?? {},
            content: code,
            author: context.author.id
        });

        return this.success(id === undefined
            ? `The default ${type} message has been set`
            : `The ${type} message for censor ${id} has been set`
        );
    }

    public async setAuthorizer(context: GuildCommandContext, id: number | undefined, type: string): Promise<string> {
        if (!allowedTypes.has(type))
            return this.error(`\`${type}\` is not a valid type`);

        const rule = await context.database.guilds.getCensorRule(context.channel.guild.id, id, type);
        if (rule === undefined) {
            return this.error(id === undefined
                ? `A custom default ${type} message has not been set yet`
                : `A custom ${type} message for censor ${id} has not been set yet`
            );
        }

        await context.database.guilds.setCensorRule(context.channel.guild.id, id, type, {
            ...rule,
            authorizer: context.author.id
        });

        return this.success(id === undefined
            ? `The default ${type} message has been set`
            : `The ${type} message for censor ${id} has been set`
        );
    }

    public async getRawMessage(context: GuildCommandContext, id: number | undefined, type: string): Promise<string | SendContent> {
        if (!allowedTypes.has(type))
            return this.error(`\`${type}\` is not a valid type`);

        const rule = await context.database.guilds.getCensorRule(context.channel.guild.id, id, type);
        if (rule === undefined) {
            return this.error(id === undefined
                ? `A custom default ${type} message has not been set yet`
                : `A custom ${type} message for censor ${id} has not been set yet`
            );
        }

        const message = id === undefined
            ? `The raw code for the default ${type} message is`
            : `The raw code for the ${type} message for censor \`${id}\` is`;

        const response = this.info(`${message}:\n${codeBlock(rule.content)}`);

        return guard.checkMessageSize(response)
            ? response
            : {
                content: this.info(`${message} attached`),
                files: [
                    {
                        name: `censor-${type}-${id ?? 'default'}.bbtag`,
                        file: rule.content
                    }
                ]
            };
    }

    public async setDebug(context: GuildCommandContext, id: number, type: string): Promise<string> {
        if (!allowedTypes.has(type))
            return this.error(`\`${type}\` is not a valid type`);

        const censor = await context.database.guilds.getCensor(context.channel.guild.id, id);
        if (censor === undefined)
            return this.error(`Censor \`${id}\` doesnt exist`);

        context.cluster.moderation.censors.setDebug(context.channel.guild.id, id, context.author.id, context.channel.id, context.message.id, type);
        return this.success(`The next message that you send that triggers censor \`${id}\` will send the debug output here`);
    }

    public async list(context: GuildCommandContext): Promise<EmbedOptions> {
        const censors = await context.database.guilds.getCensors(context.channel.guild.id) ?? {};

        const users = censors.exception?.user ?? [];
        const roles = censors.exception?.role ?? [];
        const channels = censors.exception?.channel ?? [];
        const description = Object.entries(censors.list ?? {})
            .filter((e): e is [string, GuildCensor] => e[1] !== undefined)
            .map(([id, censor]) => `**Censor** \`${id}\`${censor.regex ? ' (Regex)' : ''}: ${censor.term}`)
            .join('\n');

        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: this.info('Censors'),
            description: description.length === 0 ? 'No censors configured' : description,
            fields: [
                {
                    name: 'Excluded users',
                    value: users.length === 0 ? 'None' : users.map(u => `<@${u}>`).join(' '),
                    inline: true
                },
                {
                    name: 'Excluded roles',
                    value: roles.length === 0 ? 'None' : roles.map(u => `<@&${u}>`).join(' '),
                    inline: true
                },
                {
                    name: 'Excluded channels',
                    value: channels.length === 0 ? 'None' : channels.map(u => `<#${u}>`).join(' '),
                    inline: true
                }
            ]
        };
    }

    public async showInfo(context: GuildCommandContext, id: number): Promise<string | EmbedOptions> {
        const censor = await context.database.guilds.getCensor(context.channel.guild.id, id);
        if (censor === undefined)
            return this.error(`Censor \`${id}\` doesnt exist`);

        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: this.info(`Censor \`${id}\``),
            fields: [
                { name: `Trigger${censor.regex ? ' (Regex)' : ''}`, value: censor.term, inline: false },
                { name: 'Weight', value: censor.weight.toString(), inline: true },
                { name: 'Reason', value: censor.reason ?? 'Not set', inline: true },
                { name: 'Ban message', value: stringifyCensorEvent(censor.deleteMessage), inline: true },
                { name: 'Kick message', value: stringifyCensorEvent(censor.kickMessage), inline: true },
                { name: 'Ban message', value: stringifyCensorEvent(censor.banMessage), inline: true }
            ]
        };
    }
}

interface CensorOptions {
    isRegex: boolean;
    decancer: boolean;
    weight?: string | number;
    reason?: string;
}

function stringifyCensorEvent(event: GuildTriggerTag | undefined): string {
    if (event === undefined)
        return 'Not set';

    return `Author: <@${event.author}>\nAuthorizer: <@${event.authorizer ?? event.author}>`;
}

const allowedTypes = new Set(['kick', 'ban', 'delete'] as const);
