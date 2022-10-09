import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, parse, randInt } from '@blargbot/cluster/utils';
import { Emote } from '@blargbot/core/Emote';
import { Duration, duration } from 'moment-timezone';

import templates from '../../text';

const cmd = templates.commands.poll;

export class PollCommand extends GuildCommand {
    public constructor() {
        super({
            name: `poll`,
            category: CommandType.GENERAL,
            flags: [
                { flag: `t`, word: `time`, description: cmd.flags.time },
                { flag: `e`, word: `emojis`, description: cmd.flags.emojis },
                { flag: `d`, word: `description`, description: cmd.flags.description },
                { flag: `c`, word: `colour`, description: cmd.flags.colour },
                { flag: `a`, word: `announce`, description: cmd.flags.announce }
            ],
            definitions: [
                {
                    parameters: `{title+}`,
                    description: cmd.default.description,
                    execute: (ctx, [title], flags) => this.createPoll(ctx, {
                        time: flags.t?.merge().value,
                        emojis: flags.e?.merge().value,
                        title: title.asString,
                        description: flags.d?.merge().value,
                        color: flags.c?.merge().value,
                        announce: flags.a !== undefined
                    })
                }
            ]
        });
    }

    public async createPoll(context: GuildCommandContext, options: PollOptions): Promise<CommandResult> {
        const emojis = options.emojis === undefined ? defaultEmotes : Emote.findAll(options.emojis);
        const time = typeof options.time === `string`
            ? parse.duration(options.time) ?? options.time
            : options.time ?? duration(1, `minute`);

        if (typeof time === `string`)
            return `❌ \`${time}\` is not a valid duration for a poll.`;

        let color: number | undefined;
        switch (typeof options.color) {
            case `undefined`:
                color = randInt(0, 0xffffff);
                break;
            case `number`:
                color = options.color;
                break;
            case `string`:
                color = parse.color(options.color);
                if (color === undefined)
                    return `❌ \`${options.color}\` is not a valid color!`;
                break;
        }

        const result = await context.cluster.polls.createPoll(context.channel, context.author, emojis, options.title, options.description, color, time, options.announce ?? false);
        switch (result.state) {
            case `FAILED_SEND`: return `❌ I wasnt able to send the poll! Please make sure I have the right permissions and try again.`;
            case `NO_ANNOUNCE_PERMS`: return `❌ Sorry, you dont have permissions to send announcements!`;
            case `ANNOUNCE_INVALID`: return `❌ Announcements on this server arent set up correctly. Please fix them before trying again.`;
            case `OPTIONS_EMPTY`: return `❌ You must provide some emojis to use in the poll.`;
            case `OPTIONS_INVALID`: return `❌ I dont have access to some of the emojis you used! Please use different emojis or add me to the server that the emojis are from.`;
            case `TOO_SHORT`: return `❌ ${time.humanize()} is too short for a poll! Use a longer time`;
            case `SUCCESS`:
                if (result.failedReactions.length > 0)
                    return `⚠️ I managed to create the poll, but wasnt able to add some of the emojis to it. Please add them manually (they will still be counted in the results)`;
                return undefined;
            default:
                return result;
        }
    }
}

interface PollOptions {
    time?: string | Duration;
    emojis?: string;
    title: string;
    description?: string;
    color?: number | string;
    announce?: boolean;
}

const defaultEmotes = [
    Emote.parse(`👍`),
    Emote.parse(`👎`)
];
