import { clamp, guard } from '@blargbot/core/utils/index.js';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities, BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { Statement } from '../../language/index.js';
import { parseBBTag } from '../../language/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { overrides, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.waitMessage;

const defaultCondition = parseBBTag('true');

@Subtag.id('waitMessage')
@Subtag.ctorArgs(Subtag.util(), Subtag.converter())
export class WaitMessageSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;
    readonly #converter: BBTagValueConverter;

    public constructor(util: BBTagUtilities, converter: BBTagValueConverter) {
        super({
            category: SubtagType.MESSAGE,
            description: tag.description({ disabled: overrides.waitmessage }),
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

        this.#util = util;
        this.#converter = converter;
    }

    public async awaitMessage(
        context: BBTagContext,
        channelStr: string,
        userStr: string,
        condition: Statement,
        timeoutStr: string
    ): Promise<[channelId: string, messageId: string]> {
        const channels = await context.bulkLookup(channelStr, i => context.queryChannel(i, { noLookup: true }), ChannelNotFoundError)
            ?? [context.channel];

        const users = await context.bulkLookup(userStr, i => context.queryUser(i, { noLookup: true }), UserNotFoundError)
            ?? [context.user];

        const timeout = clamp(this.#converter.float(timeoutStr) ?? NaN, 0, 300);
        if (isNaN(timeout))
            throw new NotANumberError(timeoutStr);

        if (condition.values.length === 0)
            condition = defaultCondition;

        const userSet = new Set(users.map(u => u.id));
        const result = await this.#util.awaitMessage(channels.map(c => c.id), async message => {
            if (!userSet.has(message.author.id) || !guard.isGuildMessage(message))
                return false;

            const resultStr = await context.withChild({ message }, async context => await context.eval(condition));
            const result = this.#converter.boolean(resultStr.trim());
            if (result === undefined)
                throw new BBTagRuntimeError('Condition must return \'true\' or \'false\'', `Actually returned ${JSON.stringify(resultStr)}`);
            return result;
        }, timeout * 1000);

        if (result === undefined)
            throw new BBTagRuntimeError(`Wait timed out after ${timeout * 1000}`);

        return [result.channel.id, result.id];

    }
}
