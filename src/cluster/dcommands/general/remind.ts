import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, guard } from '@blargbot/cluster/utils';
import { parse } from '@blargbot/core/utils';
import moment from 'moment-timezone';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.remind;

export class TimerCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `remind`,
            aliases: [`remindme`],
            category: CommandType.GENERAL,
            flags: [
                { flag: `c`, word: `channel`, description: cmd.flags.channel },
                { flag: `t`, word: `time`, description: cmd.flags.time }
            ],
            definitions: [
                {
                    parameters: `{~message+}`,
                    description: cmd.default.description,
                    execute: (ctx, [message], { c: channel, t: time }) => this.addTimer(ctx, time?.merge().value, message.asString, channel !== undefined)
                }
            ]
        });
    }

    public async addTimer(context: CommandContext, durationStr: string | undefined, message: string, inChannel: boolean): Promise<CommandResult> {
        if (durationStr === undefined)
            return `❌ The \`-t\` flag is required to set the duration of the reminder!`;

        const duration = parse.duration(durationStr);
        if (duration === undefined || duration.asMilliseconds() <= 0)
            return `❌ I cant set a timer for 0 seconds!`;

        if (message.length === 0)
            return `❌ You need to say what you need reminding of!`;

        const channel = inChannel && guard.isGuildCommandContext(context) ? context.channel : await context.author.getDMChannel();
        const source = inChannel && guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;

        await context.cluster.timeouts.insert(`remind`, {
            source: source,
            user: context.author.id,
            channel: channel.id,
            endtime: moment().add(duration).valueOf(),
            content: message
        });

        return `✅ Ok, ill ping you ${channel === context.channel ? `here` : `in a DM`} <t:${moment().add(duration).unix()}:R>`;
    }

}
