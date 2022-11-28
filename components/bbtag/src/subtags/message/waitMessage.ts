import { clamp, guard, parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import { BBTagRuntimeError, ChannelNotFoundError, NotANumberError, UserNotFoundError } from '../../errors/index';
import { Statement } from '../../language/index';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils/index';

const tag = templates.subtags.waitMessage;

const defaultCondition = bbtag.parse('true');

export class WaitMessageSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'waitMessage',
            category: SubtagType.MESSAGE,
            description: tag.description({ disabled: bbtag.overrides.waitmessage }),
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id[]',
                    execute: (ctx) => this.awaitMessage(ctx, '', '', defaultCondition, '60')
                },
                {
                    parameters: ['channelIDs', 'userIDs?', '~condition?:true', 'timeout?:60'],
                    description: tag.filtered.description,
                    exampleCode: tag.filtered.exampleCode,
                    exampleOut: tag.filtered.exampleOut,
                    returns: 'id[]',
                    execute: (ctx, [channelIDs, userIDs, condition, timeout]) => this.awaitMessage(ctx, channelIDs.value, userIDs.value, condition.code, timeout.value)
                }
            ]
        });
    }

    public async awaitMessage(
        context: BBTagContext,
        channelStr: string,
        userStr: string,
        condition: Statement,
        timeoutStr: string
    ): Promise<[channelId: string, messageId: string]> {
        const channels = await this.bulkLookup(channelStr, i => context.queryChannel(i, { noLookup: true }), ChannelNotFoundError)
            ?? [context.channel];

        const users = await this.bulkLookup(userStr, i => context.queryUser(i, { noLookup: true }), UserNotFoundError)
            ?? [context.user];

        const timeout = clamp(parse.float(timeoutStr) ?? NaN, 0, 300);
        if (isNaN(timeout))
            throw new NotANumberError(timeoutStr);

        if (condition.values.length === 0)
            condition = defaultCondition;

        const userSet = new Set(users.map(u => u.id));
        const result = await context.util.awaitMessage(channels.map(c => c.id), async message => {
            if (!userSet.has(message.author.id) || !guard.isGuildMessage(message))
                return false;

            const resultStr = await context.withChild({ message }, async context => await context.eval(condition));
            const result = parse.boolean(resultStr.trim());
            if (result === undefined)
                throw new BBTagRuntimeError('Condition must return \'true\' or \'false\'', `Actually returned ${JSON.stringify(resultStr)}`);
            return result;
        }, timeout * 1000);

        if (result === undefined)
            throw new BBTagRuntimeError(`Wait timed out after ${timeout * 1000}`);

        return [result.channel.id, result.id];

    }
}
