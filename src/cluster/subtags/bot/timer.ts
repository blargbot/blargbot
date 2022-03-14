import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { parse, SubtagType } from '@blargbot/cluster/utils';
import moment from 'moment-timezone';

export class TimerSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'timer',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['~code', 'duration'],
                    description: 'Executes `code` after `duration`. ' +
                        'Three timers are allowed per custom command, with no recursive timers.',
                    exampleCode: '{timer;Hello!;20s}',
                    exampleOut: '(after 20 seconds:) Hello!',
                    returns: 'nothing',
                    execute: (ctx, [code, duration]) => this.queueTimer(ctx, code.raw, duration.value)
                }
            ]
        });
    }

    public async queueTimer(context: BBTagContext, code: string, durationStr: string): Promise<void> {
        const duration = parse.duration(durationStr);

        if (duration === undefined || duration.asMilliseconds() <= 0)
            throw new BBTagRuntimeError('Invalid duration');
        await context.util.cluster.timeouts.insert('tag', {
            version: 4,
            source: context.guild.id,
            channel: context.channel.id,
            endtime: moment().add(duration).valueOf(),
            context: context.serialize(),
            content: code
        });
    }
}
