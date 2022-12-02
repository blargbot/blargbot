import { GuildCommand } from '../../command/index.js';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType, parse, randInt } from '@blargbot/cluster/utils/index.js';
import { Emote } from '@blargbot/core/Emote.js';
import moment from 'moment-timezone';

import templates from '../../text.js';

const cmd = templates.commands.poll;

export class PollCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'poll',
            category: CommandType.GENERAL,
            flags: [
                { flag: 't', word: 'time', description: cmd.flags.time },
                { flag: 'e', word: 'emojis', description: cmd.flags.emojis },
                { flag: 'd', word: 'description', description: cmd.flags.description },
                { flag: 'c', word: 'colour', description: cmd.flags.colour },
                { flag: 'a', word: 'announce', description: cmd.flags.announce }
            ],
            definitions: [
                {
                    parameters: '{title+}',
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
        const time = typeof options.time === 'string'
            ? parse.duration(options.time) ?? options.time
            : options.time ?? moment.duration(1, 'minute');

        if (typeof time === 'string')
            return cmd.default.invalidDuration({ duration: time });

        let color: number | undefined;
        switch (typeof options.color) {
            case 'undefined':
                color = randInt(0, 0xffffff);
                break;
            case 'number':
                color = options.color;
                break;
            case 'string':
                color = parse.color(options.color);
                if (color === undefined)
                    return cmd.default.invalidColor({ color: options.color });
                break;
        }

        const result = await context.cluster.polls.createPoll(
            context.channel,
            context.author,
            emojis,
            options.title,
            options.description,
            color,
            time,
            options.announce ?? false
        );
        switch (result.state) {
            case 'FAILED_SEND': return cmd.default.sendFailed;
            case 'NO_ANNOUNCE_PERMS': return cmd.default.noAnnouncePerms;
            case 'ANNOUNCE_INVALID': return cmd.default.announceNotSetUp;
            case 'OPTIONS_EMPTY': return cmd.default.emojisMissing;
            case 'OPTIONS_INVALID': return cmd.default.emojisInaccessible;
            case 'TOO_SHORT': return cmd.default.tooShort({ duration: time });
            case 'SUCCESS':
                if (result.failedReactions.length > 0)
                    return cmd.default.someEmojisMissing;
                return undefined;
            default:
                return result;
        }
    }
}

interface PollOptions {
    time?: string | moment.Duration;
    emojis?: string;
    title: string;
    description?: string;
    color?: number | string;
    announce?: boolean;
}

const defaultEmotes = [
    Emote.parse('👍'),
    Emote.parse('👎')
];
