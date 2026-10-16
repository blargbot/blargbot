import { clamp, guard, parse } from '@blargbot/core';
import type eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { BBTagExpression } from '../../language/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.waitMessage;

const defaultCondition = bbtag.parse('true');

export interface StreamMessagesThunk {
    (channelIds: Iterable<string>, timeoutMs: number): AsyncIterable<eris.KnownMessage>;
}

export class WaitMessageSubtag extends CompiledSubtag {
    readonly #streamMessages: StreamMessagesThunk;
    public constructor({ streamMessages }: { streamMessages: StreamMessagesThunk; }) {
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
        this.#streamMessages = streamMessages;
    }

    public async awaitMessage(
        context: BBTagContext,
        channelStr: string,
        userStr: string,
        condition: BBTagExpression,
        timeoutStr: string
    ): Promise<[channelId: string, messageId: string]> {
        const channels = await this.bulkLookup(channelStr, i => context.queryChannel(i, { noLookup: true }), ChannelNotFoundError)
            ?? [context.local.message.channel];

        const users = await this.bulkLookup(userStr, i => context.queryUser(i, { noLookup: true }), UserNotFoundError)
            ?? [context.local.message.author];

        const timeout = clamp(parse.float(timeoutStr) ?? NaN, 0, 300);
        if (isNaN(timeout))
            throw new NotANumberError(timeoutStr);

        if (condition.values.length === 0)
            condition = defaultCondition;

        const userSet = new Set(users.map(u => u.id));
        for await (const message of this.#streamMessages(channels.map(c => c.id), timeout * 1000)) {
            if (!userSet.has(message.author.id) || !guard.isGuildMessage(message))
                continue;
            using scope = context.enterScope();
            scope.message = message;
            const resultStr = await context.eval(condition);
            switch (parse.boolean(resultStr.trim())) {
                case undefined:
                    throw new BBTagRuntimeError('Condition must return \'true\' or \'false\'', `Actually returned ${JSON.stringify(resultStr)}`);
                case true:
                    return [message.channel.id, message.id];
            }
        }

        throw new BBTagRuntimeError(`Wait timed out after ${timeout * 1000}`);
    }
}
