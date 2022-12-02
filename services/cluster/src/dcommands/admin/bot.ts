import { StoredGuild, StoredUser, TagVariableType } from '@blargbot/domain/models/index.js';
import * as Eris from 'eris';

import { CommandContext, GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import { CommandResult, GuildCommandContext, PrivateCommandContext } from '../../types.js';
import { CommandType, guard } from '../../utils/index.js';

const cmd = templates.commands.bot;

export class ServerCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'bot',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'reset',
                    description: cmd.reset.description,
                    execute: (ctx) => this.reset(ctx)
                },
                {
                    parameters: 'dump',
                    description: cmd.dump.description,
                    execute: (ctx) => this.dump(ctx)
                }
            ]
        });
    }

    public async reset(context: CommandContext): Promise<CommandResult> {
        if (guard.isGuildCommandContext(context))
            return await this.#resetGuild(context);
        else if (guard.isPrivateCommandContext(context))
            return await this.#resetUser(context);
        return cmd.reset.unavailable;
    }

    public async dump(context: CommandContext): Promise<CommandResult> {
        if (guard.isGuildCommandContext(context))
            return await this.#dumpGuild(context);
        else if (guard.isPrivateCommandContext(context))
            return await this.#dumpUser(context);
        return cmd.dump.unavailable;
    }

    async #resetGuild(context: GuildCommandContext): Promise<CommandResult> {
        const text = cmd.reset.guild;
        if (await context.queryConfirm({
            prompt: text.confirm.prompt,
            cancel: {
                style: Eris.Constants.ButtonStyles.SECONDARY,
                label: text.confirm.cancel
            },
            continue: {
                style: Eris.Constants.ButtonStyles.DANGER,
                label: text.confirm.continue
            }
        }) !== true) {
            return text.cancelled;
        }

        await context.database.guilds.reset(context.channel.guild);
        await context.database.tagVariables.clearScope({ type: TagVariableType.GUILD_CC, guildId: context.channel.guild.id });
        await context.database.tagVariables.clearScope({ type: TagVariableType.GUILD_TAG, guildId: context.channel.guild.id });
        await context.database.tagVariables.clearScope({ type: TagVariableType.LOCAL_CC, guildId: context.channel.guild.id });

        return text.success;
    }

    async #resetUser(context: PrivateCommandContext): Promise<CommandResult> {
        const text = cmd.reset.user;
        if (await context.queryConfirm({
            prompt: text.confirm.prompt,
            cancel: {
                style: Eris.Constants.ButtonStyles.SECONDARY,
                label: text.confirm.cancel
            },
            continue: {
                style: Eris.Constants.ButtonStyles.DANGER,
                label: text.confirm.continue
            }
        }) !== true) {
            return text.cancelled;
        }

        const tags = await context.database.tags.byAuthor(context.author.id);
        await context.database.users.reset(context.author);
        await context.database.tags.deleteByAuthor(context.author.id);
        await context.database.tagVariables.clearScope({ type: TagVariableType.AUTHOR, authorId: context.author.id });
        await context.database.tagVariables.clearScope({ type: TagVariableType.LOCAL_TAG, name: tags });
        return text.success;
    }

    async #dumpGuild(context: GuildCommandContext): Promise<CommandResult> {
        if (await context.queryConfirm({
            prompt: cmd.dump.confirm.prompt,
            cancel: {
                style: Eris.Constants.ButtonStyles.SECONDARY,
                label: cmd.dump.confirm.cancel
            },
            continue: {
                style: Eris.Constants.ButtonStyles.DANGER,
                label: cmd.dump.confirm.continue
            }
        }) !== true) {
            return cmd.dump.cancelled;
        }
        const [guild, ...variables] = await Promise.all([
            context.database.guilds.get(context.channel.guild.id),
            context.database.tagVariables.getScope({ type: TagVariableType.GUILD_CC, guildId: context.channel.guild.id }),
            context.database.tagVariables.getScope({ type: TagVariableType.GUILD_TAG, guildId: context.channel.guild.id }),
            context.database.tagVariables.getScope({ type: TagVariableType.LOCAL_CC, guildId: context.channel.guild.id })
        ]);

        return {
            content: cmd.dump.success,
            file: [{
                name: `GUILD_${context.channel.guild.id}.dump.json`,
                file: JSON.stringify({
                    ...pickOrNull(guild, ...guildKeys),
                    variables: variables.flat()
                })
            }]
        };
    }

    async #dumpUser(context: PrivateCommandContext): Promise<CommandResult> {
        const userPromise = context.database.users.get(context.author.id);
        const tagsPromise = context.database.tags.getAllByAuthor(context.author.id);
        const authorVarsPromise = context.database.tagVariables.getScope({ type: TagVariableType.AUTHOR, authorId: context.author.id });

        const tags = await tagsPromise;
        const [user, ...variables] = await Promise.all([
            userPromise,
            authorVarsPromise,
            context.database.tagVariables.getScope({ type: TagVariableType.LOCAL_TAG, name: tags.map(t => t.name) })
        ]);

        return {
            content: cmd.dump.success,
            file: [{
                name: `USER_${context.author.id}.dump.json`,
                file: JSON.stringify({
                    ...pickOrNull(user, ...userKeys),
                    variables: variables.flat(),
                    tags
                })
            }]
        };

    }
}

function pickOrNull<Source extends object, Key extends keyof Source>(source: Source | undefined, ...keys: Key[]): Pick<{ [P in keyof Source]: Source[P] | null }, Key> | undefined {
    if (source === undefined)
        return undefined;
    return Object.fromEntries(keys.map(k => [k, source[k] as unknown ?? null] as const)) as ReturnType<typeof pickOrNull<Source, Key>>;
}

function selectKeys<T extends object>(values: { [P in keyof T]-?: boolean }): Array<keyof T> {
    return Object.entries(values).filter(e => e[1]).map(e => e[0]);
}

const userKeys = selectKeys<StoredUser>({
    todo: true,
    dontdmerrors: true,
    prefixes: true,
    timezone: true,
    usernames: true,

    // Not dumped
    avatarURL: false,
    blacklisted: false,
    discriminator: false,
    reportblock: false,
    reports: false,
    userid: false,
    username: false
});

const guildKeys = selectKeys<StoredGuild>({
    announce: true,
    autoresponse: true,
    ccommands: true,
    censor: true,
    channels: true,
    commandperms: true,
    farewell: true,
    greeting: true,
    interval: true,
    log: true,
    logIgnore: true,
    modlog: true,
    roleme: true,
    settings: true,
    votebans: true,
    warnings: true,

    // Not dumped
    active: false,
    guildid: false,
    name: false,
    nextModlogId: false
});
