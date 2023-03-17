import type { BBTagScript } from '../../BBTagScript.js';
import type { BBTagStatement } from '../../BBTagStatement.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import type { MessageService } from '../../services/MessageService.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { overrides, SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.waitMessage;

const defaultCondition: BBTagStatement = {
    isEmpty: false,
    ast: {
        start: { line: 0, column: 0, index: 0 },
        end: { column: 0, index: 0, line: 0 },
        source: '',
        values: []
    },
    resolve: () => 'true'
};

@Subtag.id('waitMessage')
@Subtag.ctorArgs('users', 'channels', 'messages', 'arrayTools', 'converter')
export class WaitMessageSubtag extends CompiledSubtag {
    readonly #users: UserService;
    readonly #converter: BBTagValueConverter;
    readonly #channels: ChannelService;
    readonly #messages: MessageService;
    readonly #arrayTools: BBTagArrayTools;

    public constructor(users: UserService, channels: ChannelService, messages: MessageService, arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
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

        this.#users = users;
        this.#channels = channels;
        this.#messages = messages;
        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public async awaitMessage(
        context: BBTagScript,
        channelStr: string,
        userStr: string,
        condition: BBTagStatement,
        timeoutStr: string
    ): Promise<[channelId: string, messageId: string]> {
        const channels = await this.bulkLookup(channelStr, i => this.#channels.querySingle(context.runtime, i, { noLookup: true }), ChannelNotFoundError, this.#arrayTools, this.#converter)
            ?? [context.runtime.channel];

        const users = await this.bulkLookup(userStr, i => this.#users.querySingle(context.runtime, i, { noLookup: true }), UserNotFoundError, this.#arrayTools, this.#converter)
            ?? [context.runtime.user];

        let timeout = this.#converter.float(timeoutStr);
        if (timeout === undefined)
            throw new NotANumberError(timeoutStr);

        if (timeout < 0)
            timeout = 0;
        else if (timeout > 300)
            timeout = 300;

        if (condition.isEmpty)
            condition = defaultCondition;

        const userLookup = new Map(users.map(u => [u.id, u]));
        const channelLookup = new Map(channels.map(c => [c.id, c]));
        const result = await this.#messages.awaitMessage(context.runtime, channels.map(c => c.id), async message => {
            if (!userLookup.has(message.author.id))
                return false;

            const channel = channelLookup.get(message.channel_id);
            if (channel === undefined)
                return false;

            const user = userLookup.get(message.author.id);
            if (user === undefined)
                return false;

            const resultStr = await context.runtime.withMessage(message, channel, user, () => condition.resolve());
            const result = this.#converter.boolean(resultStr.trim());
            if (result === undefined)
                throw new BBTagRuntimeError('Condition must return \'true\' or \'false\'', `Actually returned ${JSON.stringify(resultStr)}`);
            return result;
        }, timeout * 1000);

        if (result === undefined)
            throw new BBTagRuntimeError(`Wait timed out after ${timeout * 1000}`);

        return [result.channel_id, result.id];

    }
}
