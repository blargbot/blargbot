import { BaseSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';
import { TagV4StoredEventOptions } from '@core/types';
import moment from 'moment-timezone';

export class TimerSubtag extends BaseSubtag {
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
                    execute: async (context, [code, { value: durationStr }]): Promise<string | void> => {
                        const duration = parse.duration(durationStr);

                        if (duration === undefined || duration.asMilliseconds() <= 0)
                            throw new BBTagRuntimeError('Invalid duration');
                        try {
                            await context.util.cluster.timeouts.insert('tag', <TagV4StoredEventOptions>{
                                version: 4,
                                source: context.guild.id,
                                user: context.user.id,
                                channel: context.channel.id,
                                endtime: moment().add(duration).valueOf(),
                                context: context.serialize(),
                                content: code.raw
                            });
                        } catch (e: unknown) {
                            context.logger.error(e);
                        }
                    }
                }
            ]
        });
    }
}
