import type { ChatLogSearchOptions } from '@blargbot/chatlog-types';
import { ChatLogType } from '@blargbot/chatlog-types';
import type { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import { guard, sleep } from '@blargbot/core/utils/index.js';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';

const cmd = templates.commands.logs;

export class LogsCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'logs',
            category: CommandType.ADMIN,
            flags: [
                { flag: 't', word: 'type', description: cmd.flags.type },
                { flag: 'c', word: 'channel', description: cmd.flags.channel },
                { flag: 'u', word: 'user', description: cmd.flags.user },
                { flag: 'C', word: 'create', description: cmd.flags.create },
                { flag: 'U', word: 'update', description: cmd.flags.update },
                { flag: 'D', word: 'delete', description: cmd.flags.delete },
                { flag: 'j', word: 'json', description: cmd.flags.json }
            ],
            definitions: [
                {
                    parameters: '{number:integer=100}',
                    description: cmd.default.description,
                    execute: (ctx, [number], flags) => this.generateLogs(ctx, {
                        count: number.asInteger,
                        users: flags.u?.map(f => f.value) ?? [],
                        types: [
                            flags.C !== undefined ? ChatLogType.CREATE : undefined,
                            flags.U !== undefined ? ChatLogType.UPDATE : undefined,
                            flags.D !== undefined ? ChatLogType.DELETE : undefined
                        ].filter(guard.hasValue),
                        channel: flags.c?.merge().value ?? ctx.channel.id,
                        json: flags.j !== undefined
                    })
                }
            ]
        });
    }
    public async generateLogs(context: GuildCommandContext, options: LogsGenerateOptions): Promise<CommandResult> {
        if (await context.database.guilds.getSetting(context.channel.guild.id, 'makelogs') !== true)
            return cmd.default.chatlogsDisabled({ prefix: context.prefix });

        if (options.count > 1000)
            return cmd.default.tooManyLogs;

        if (options.count <= 0)
            return cmd.default.notEnoughLogs;

        const channel = await context.queryChannel({ filter: options.channel });
        if (channel.state !== 'SUCCESS')
            return cmd.default.channelMissing({ channel: options.channel });

        if (!guard.isGuildChannel(channel.value) || channel.value.guild.id !== context.channel.guild.id)
            return cmd.default.notOnGuild;

        const perms = channel.value.permissionsOf(context.message.member);
        if (!perms.has('readMessageHistory'))
            return cmd.default.noPermissions;

        const users = [];
        for (const userStr of options.users) {
            const user = await context.queryUser({ filter: userStr });
            if (user.state !== 'SUCCESS')
                return cmd.default.userMissing({ user: userStr });
            users.push(user.value.id);
        }

        const info = await context.reply(cmd.default.generating);
        if (info === undefined)
            return cmd.default.sendFailed;

        const searchOptions: ChatLogSearchOptions = { channelId: channel.value.id, types: options.types, users, exclude: [info.id, context.id], count: options.count };
        const generatePromise = options.json
            ? context.cluster.moderation.chatLog.find(searchOptions)
            : context.cluster.moderation.chatLog.createIndex(searchOptions);

        await context.channel.sendTyping();

        let logs = await Promise.race([sleep(10000), generatePromise]);

        let slow = false;
        if (logs === undefined) {
            slow = true;
            try {
                await context.edit(info, cmd.default.pleaseWait);
            } catch { /* NOOP */ }
            logs = await generatePromise;
        }

        if (!Array.isArray(logs)) {
            return {
                content: slow
                    ? cmd.default.generated.link.slow({ link: context.util.websiteLink(`logs/${logs.keycode}`), user: context.author })
                    : cmd.default.generated.link.quick({ link: context.util.websiteLink(`logs/${logs.keycode}`) }),
                allowedMentions: { users: [context.author.id] }
            };
        }

        return {
            content: slow
                ? cmd.default.generated.json.slow({ user: context.author })
                : cmd.default.generated.json.quick,
            allowedMentions: { users: [context.author.id] },
            file: [
                {
                    file: JSON.stringify(logs.map(l => ({ ...l, id: undefined })), null, 2),
                    name: `${channel.value.id}-logs.json`
                }
            ]
        };
    }
}

interface LogsGenerateOptions {
    count: number;
    users: string[];
    types: ChatLogType[];
    channel: string;
    json: boolean;
}
