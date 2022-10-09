import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { guard, sleep } from '@blargbot/core/utils';
import { ChatLogSearchOptions, ChatLogType } from '@blargbot/domain/models';

import templates from '../../text';

const cmd = templates.commands.logs;

export class LogsCommand extends GuildCommand {
    public constructor() {
        super({
            name: `logs`,
            category: CommandType.ADMIN,
            flags: [
                { flag: `t`, word: `type`, description: cmd.flags.type },
                { flag: `c`, word: `channel`, description: cmd.flags.channel },
                { flag: `u`, word: `user`, description: cmd.flags.user },
                { flag: `C`, word: `create`, description: cmd.flags.create },
                { flag: `U`, word: `update`, description: cmd.flags.update },
                { flag: `D`, word: `delete`, description: cmd.flags.delete },
                { flag: `j`, word: `json`, description: cmd.flags.json }
            ],
            definitions: [
                {
                    parameters: `{number:integer=100}`,
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
        if (await context.database.guilds.getSetting(context.channel.guild.id, `makelogs`) !== true)
            return `❌ This guild has not opted into chatlogs. Please do \`${context.prefix}settings set makelogs true\` to allow me to start creating chatlogs.`;

        if (options.count > 1000)
            return `❌ You cant get more than 1000 logs at a time`;

        if (options.count <= 0)
            return `❌ A minimum of 1 chatlog entry must be requested`;

        const channel = await context.queryChannel({ filter: options.channel });
        if (channel.state !== `SUCCESS`)
            return `❌ I couldnt find the channel \`${options.channel}\``;

        if (!guard.isGuildChannel(channel.value) || channel.value.guild.id !== context.channel.guild.id)
            return `❌ The channel must be on this guild!`;

        const perms = channel.value.permissionsOf(context.message.member);
        if (!perms.has(`readMessageHistory`))
            return `❌ You do not have permissions to look at that channels message history!`;

        const users = [];
        for (const userStr of options.users) {
            const user = await context.queryUser({ filter: userStr });
            if (user.state !== `SUCCESS`)
                return `❌ I couldnt find the user \`${userStr}\``;
            users.push(user.value.id);
        }

        const info = await context.reply(`Generating your logs...`);
        if (info === undefined)
            return `❌ I wasnt able to send the message containing the logs!`;

        const searchOptions: ChatLogSearchOptions = { channelId: channel.value.id, types: options.types, users, exclude: [info.id, context.id], count: options.count };
        const generatePromise = options.json
            ? context.cluster.moderation.chatLog.find(searchOptions)
            : context.cluster.moderation.chatLog.createIndex(searchOptions);

        await context.channel.sendTyping();

        let logs = await Promise.race([sleep(10000), generatePromise]);

        let ping = ``;
        if (logs === undefined) {
            try {
                await info.edit(`Generating your logs...\nThis seems to be taking longer than usual. I'll ping you when I'm finished.`);
            } catch { /* NOOP */ }
            logs = await generatePromise;
            ping = `Sorry that took so long, ${context.author.mention}.\n`;
        }

        if (!Array.isArray(logs)) {
            return {
                content: `${ping}Your logs are available here: ${context.util.websiteLink(`logs/${logs.keycode}`)}`,
                allowedMentions: { users: [context.author.id] }
            };
        }

        return {
            content: `${ping}Here are your logs, in a JSON file!`,
            allowedMentions: { users: [context.author.id] },
            files: [
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
