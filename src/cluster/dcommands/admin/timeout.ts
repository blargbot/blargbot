import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, parse } from '@blargbot/cluster/utils';
import { literal } from '@blargbot/domain/messages/types';
import { FlagResult } from '@blargbot/domain/models';
import { Member } from 'eris';
import moment from 'moment-timezone';

import templates from '../../text';

const cmd = templates.commands.timeout;

export class TimeoutCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'timeout',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: cmd.flags.reason },
                { flag: 't', word: 'time', description: cmd.flags.time }
            ],
            definitions: [
                {
                    parameters: '{user:member+}',
                    description: cmd.user.description,
                    execute: (ctx, [user], flags) => this.timeout(ctx, user.asMember, flags)
                },
                {
                    parameters: 'clear {user:member+}',
                    description: cmd.clear.description,
                    execute: (ctx, [user], flags) => this.clearTimeout(ctx, user.asMember, flags.r?.merge().value ?? '')
                }
            ]
        });
    }

    public async clearTimeout(context: GuildCommandContext, member: Member, reason: string): Promise<CommandResult> {
        const state = await context.cluster.moderation.timeouts.clearTimeout(member, context.author, context.author, literal(reason));
        return cmd.clear.state[state]({ user: member.user });
    }

    public async timeout(context: GuildCommandContext, member: Member, flags: FlagResult): Promise<CommandResult> {
        const reason = flags.r?.merge().value ?? '';
        const duration = (flags.t !== undefined ? parse.duration(flags.t.merge().value) : undefined) ?? moment.duration(1, 'd');
        const state = await context.cluster.moderation.timeouts.timeout(member, context.author, context.author, duration, literal(reason));
        return cmd.user.state[state]({ user: member.user });
    }
}
