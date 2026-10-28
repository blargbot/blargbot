import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { BBTagExpression } from '../../language/index.js';
import { templates } from '../../text.js';
import type { MessageEvent } from '../../types.js';
import { convertToBoolean, convertToNumber, convertToString } from '../../utils/converters.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';
import { UserIdSubtag } from '../user/userId.js';

const tag = templates.subtags.waitMessage;

const defaultCondition = bbtag.parse('true');

export interface StreamMessagesFeature {
    streamMessages(channelIds: Iterable<string>, timeoutMs: number): AsyncIterable<MessageEvent>;
}

type Features = StreamMessagesFeature
export class WaitMessageSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async awaitMessage(
        context: BBTagContext,
        channelStr: string,
        userStr: string,
        condition: BBTagExpression,
        timeoutStr: string
    ): Promise<[channelId: string, messageId: string]> {
        const channels = await this.#bulkLookup(channelStr, i => ChannelIdSubtag.query(context, i, { noLookup: true }), ChannelNotFoundError)
            ?? [context.local.channelId];

        const users = await this.#bulkLookup(userStr, i => UserIdSubtag.query(context, i, { noLookup: true, global: true }), UserNotFoundError)
            ?? [context.local.userId];

        const timeout = Math.max(0, Math.min(convertToNumber(timeoutStr) ?? NaN, 300));
        if (isNaN(timeout))
            throw new NotANumberError(timeoutStr);

        if (condition.values.length === 0)
            condition = defaultCondition;

        const userSet = new Set(users);
        for await (const event of this.#features.streamMessages(channels, timeout * 1000)) {
            if (!userSet.has(event.authorId) || event.guildId !== context.root.guildId)
                continue;
            using scope = context.enterScope();
            scope.messageId = event.messageId;
            scope.channelId = event.channelId;
            scope.userId = event.authorId;
            const resultStr = await context.eval(condition);
            switch (convertToBoolean(resultStr.trim())) {
                case undefined:
                    throw new BBTagRuntimeError('Condition must return \'true\' or \'false\'', `Actually returned ${JSON.stringify(resultStr)}`);
                case true:
                    return [event.channelId, event.messageId];
            }
        }

        throw new BBTagRuntimeError(`Wait timed out after ${timeout * 1000}`);
    }

    async #bulkLookup<T>(source: string, lookup: (value: string) => Awaitable<T | undefined>, error: new (term: string) => BBTagRuntimeError): Promise<T[] | undefined> {
        if (source === '')
            return undefined;

        const flatSource = bbtag.tagArray.flattenArray([source])
            .map(convertToString)
            .map(async input => {
                const element = await lookup(input);
                if (element === undefined)
                    throw new error(input);
                return element;
            });
        return await Promise.all(flatSource);
    }
}
