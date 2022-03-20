import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { BBTagRuntimeError } from '../../errors';
import { SubtagType } from '../../utils';

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
        await context.util.setTimeout(context, code, duration);
    }
}
