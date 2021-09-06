import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { ChatlogSearchOptions, ChatlogType } from '@core/types';
import { guard, sleep } from '@core/utils';
import { MessageOptions } from 'discord.js';

export class LogsCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'logs',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{number:integer=100}',
                    description: 'Creates a chatlog page for a specified channel, where `number` is the amount of lines to get. You can retrieve a maximum of 1000 logs. For more specific logs, you can specify flags.\n' +
                        'For example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:\n' +
                        '`logs 100 --type delete --user stupid cat`\n' +
                        'If you want to use multiple of the same type, separate parameters with commas or chain them together. For example:\n' +
                        '`logs 100 -CU -u stupid cat, dumb cat`',
                    execute: (ctx, [number], flags) => this.generateLogs(ctx, {
                        count: number as number,
                        users: flags.u?.map(f => f.value) ?? [],
                        types: [
                            flags.C !== undefined ? ChatlogType.CREATE : undefined,
                            flags.U !== undefined ? ChatlogType.UPDATE : undefined,
                            flags.D !== undefined ? ChatlogType.DELETE : undefined
                        ].filter(guard.hasValue),
                        channel: flags.c?.merge().value ?? ctx.channel.id,
                        json: flags.j !== undefined
                    })
                }
            ],
            flags: [
                { flag: 't', word: 'type', description: 'The type(s) of message. Value can be CREATE, UPDATE, and/or DELETE, separated by commas.' },
                { flag: 'c', word: 'channel', description: 'The channel to retrieve logs from. Value can be a channel ID or a channel mention.' },
                { flag: 'u', word: 'user', description: 'The user(s) to retrieve logs from. Value can be a username, nickname, mention, or ID. This uses the user lookup system.' },
                { flag: 'C', word: 'create', description: 'Get message creates.' },
                { flag: 'U', word: 'update', description: 'Get message updates.' },
                { flag: 'D', word: 'delete', description: 'Get message deletes.' },
                { flag: 'j', word: 'json', description: 'Returns the logs in a json file rather than on a webpage.' }
            ]
        });
    }
    public async generateLogs(context: GuildCommandContext, options: LogsGenerateOptions): Promise<string | MessageOptions> {
        if (await context.database.guilds.getSetting(context.channel.guild.id, 'makelogs') !== true)
            return this.error(`This guild has not opted into chatlogs. Please do \`${context.prefix}!settings set makelogs true\` to allow me to start creating chatlogs.`);

        if (options.count > 1000)
            return this.error('You cant get more than 1000 logs at a time');

        if (options.count <= 0)
            return this.error('A minimum of 1 chatlog entry must be requested');

        const channel = await context.queryChannel({ filter: options.channel });
        if (channel.state !== 'SUCCESS')
            return this.error(`I couldnt find the channel \`${options.channel}\``);

        if (!guard.isGuildChannel(channel.value) || channel.value.guild.id !== context.channel.guild.id)
            return this.error('The channel must be on this guild!');

        const perms = context.message.member.permissionsIn(channel.value);
        if (!perms.has('READ_MESSAGE_HISTORY'))
            return this.error('You do not have permissions to look at that channels message history!');

        const users = [];
        for (const userStr of options.users) {
            const user = await context.queryMember({ filter: userStr });
            if (user.state !== 'SUCCESS')
                return this.error(`I couldnt find the user \`${userStr}\``);
            users.push(user.value.id);
        }

        const info = await context.reply('Generating your logs...');
        if (info === undefined)
            return this.error('I wasnt able to send the message containing the logs!');

        const searchOptions: ChatlogSearchOptions = { channelId: channel.value.id, types: options.types, users, exclude: [info.id, context.id], count: options.count };
        const generatePromise = options.json
            ? context.cluster.moderation.chatLog.find(searchOptions)
            : context.cluster.moderation.chatLog.createIndex(searchOptions);

        await context.channel.sendTyping();

        let logs = await Promise.race([sleep(10000), generatePromise]);

        let ping = '';
        if (logs === undefined) {
            try {
                await info.edit('Generating your logs...\nThis seems to be taking longer than usual. I\'ll ping you when I\'m finished.');
            } catch { /* NOOP */ }
            logs = await generatePromise;
            ping = `Sorry that took so long, ${context.author.toString()}.\n`;
        }

        if (!Array.isArray(logs)) {
            return {
                content: `${ping}Your logs are available here: ${context.util.websiteLink(`logs/#${logs.keycode}`)}`,
                allowedMentions: { users: [context.author.id] }
            };
        }

        return {
            content: `${ping}Here are your logs, in a JSON file!`,
            allowedMentions: { users: [context.author.id] },
            files: [
                {
                    attachment: JSON.stringify(logs.map(l => ({ ...l, id: undefined })), null, 2),
                    name: `${channel.value.id}-logs.json`
                }
            ]
        };
    }
}

interface LogsGenerateOptions {
    count: number;
    users: string[];
    types: ChatlogType[];
    channel: string;
    json: boolean;
}
