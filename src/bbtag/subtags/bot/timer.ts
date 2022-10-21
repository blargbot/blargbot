import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.timer;

export class TimerSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'timer',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['~code', 'duration'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
