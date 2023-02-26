import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { Statement } from '../../language/index.js';
import { parseBBTag } from '../../language/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import type { MessageService } from '../../services/MessageService.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { overrides, SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.waitMessage;

const defaultCondition = parseBBTag('true');

@Subtag.names('waitMessage')
@Subtag.ctorArgs(Subtag.service('user'), Subtag.service('channel'), Subtag.service('message'), Subtag.converter())
export class WaitMessageSubtag extends CompiledSubtag {
    readonly #users: UserService;
    readonly #converter: BBTagValueConverter;
    readonly #channels: ChannelService;
    readonly #messages: MessageService;

    public constructor(users: UserService, channels: ChannelService, messages: MessageService, converter: BBTagValueConverter) {
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
        this.#converter = converter;
    }

    public async awaitMessage(
        context: BBTagContext,
        channelStr: string,
        userStr: string,
        condition: Statement,
        timeoutStr: string
    ): Promise<[channelId: string, messageId: string]> {
        const channels = await context.bulkLookup(channelStr, i => this.#channels.querySingle(context, i, { noLookup: true }), ChannelNotFoundError)
            ?? [context.channel];

        const users = await context.bulkLookup(userStr, i => this.#users.querySingle(context, i, { noLookup: true }), UserNotFoundError)
            ?? [context.user];

        let timeout = this.#converter.float(timeoutStr);
        if (timeout === undefined)
            throw new NotANumberError(timeoutStr);

        if (timeout < 0)
            timeout = 0;
        else if (timeout > 300)
            timeout = 300;

        if (condition.values.length === 0)
            condition = defaultCondition;

        const userSet = new Set(users.map(u => u.id));
        const result = await this.#messages.awaitMessage(context, channels.map(c => c.id), async message => {
            if (!userSet.has(message.author.id))
                return false;

            const resultStr = await context.withChild({ message }, async context => await context.eval(condition));
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
