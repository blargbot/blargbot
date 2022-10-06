import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, parse, randInt } from '@blargbot/cluster/utils';
import { Emote } from '@blargbot/core/Emote';
import { Duration, duration } from 'moment-timezone';

interface PollOptions {
    time?: string | Duration;
    emojis?: string;
    title: string;
    description?: string;
    color?: number | string;
    announce?: boolean;
}

export class PollCommand extends GuildCommand {
    public constructor() {
        super({
            name: `poll`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: `{title+}`,
                    description: `Creates a poll for the given question and duration. If no duration is given, defaults to 60 seconds. If emojis are given, they will be used as options for the poll.`,
                    execute: (ctx, [title], flags) => this.createPoll(ctx, {
                        time: flags.t?.merge().value,
                        emojis: flags.e?.merge().value,
                        title: title.asString,
                        description: flags.d?.merge().value,
                        color: flags.c?.merge().value,
                        announce: flags.a !== undefined
                    })
                }
            ],
            flags: [
                { flag: `t`, word: `time`, description: `How long before the poll expires, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d2h3m4s', or some other combination.` },
                { flag: `e`, word: `emojis`, description: `The emojis to apply to the poll.` },
                { flag: `d`, word: `description`, description: `The description of the poll.` },
                { flag: `c`, word: `colour`, description: `The colour of the poll (in HEX).` },
                { flag: `a`, word: `announce`, description: `If specified, it will make an announcement. Requires the proper permissions.` }
            ]
        });
    }

    public async createPoll(context: GuildCommandContext, options: PollOptions): Promise<string | undefined> {
        const emojis = options.emojis === undefined ? defaultEmotes : Emote.findAll(options.emojis);
        const time = typeof options.time === `string`
            ? parse.duration(options.time) ?? options.time
            : options.time ?? duration(1, `minute`);

        if (typeof time === `string`)
            return this.error(`\`${time}\` is not a valid duration for a poll.`);

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
                    return this.error(`\`${options.color}\` is not a valid color!`);
                break;
        }

        const result = await context.cluster.polls.createPoll(context.channel, context.author, emojis, options.title, options.description, color, time, options.announce ?? false);
        switch (result.state) {
            case `FAILED_SEND`: return this.error(`I wasnt able to send the poll! Please make sure I have the right permissions and try again.`);
            case `NO_ANNOUNCE_PERMS`: return this.error(`Sorry, you dont have permissions to send announcements!`);
            case `ANNOUNCE_INVALID`: return this.error(`Announcements on this server arent set up correctly. Please fix them before trying again.`);
            case `OPTIONS_EMPTY`: return this.error(`You must provide some emojis to use in the poll.`);
            case `OPTIONS_INVALID`: return this.error(`I dont have access to some of the emojis you used! Please use different emojis or add me to the server that the emojis are from.`);
            case `TOO_SHORT`: return this.error(`${time.humanize()} is too short for a poll! Use a longer time`);
            case `SUCCESS`:
                if (result.failedReactions.length > 0)
                    return this.warning(`I managed to create the poll, but wasnt able to add some of the emojis to it. Please add them manually (they will still be counted in the results)`);
                return undefined;
            default:
                return result;
        }
    }
}

const defaultEmotes = [
    Emote.parse(`👍`),
    Emote.parse(`👎`)
];
