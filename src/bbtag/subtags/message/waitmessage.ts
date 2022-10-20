import { clamp, guard, parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError, NotANumberError, UserNotFoundError } from '../../errors';
import { Statement } from '../../language';
import { bbtag, SubtagType } from '../../utils';

const defaultCondition = bbtag.parse('true');

export class WaitMessageSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'waitmessage',
            category: SubtagType.MESSAGE,
            description: `Pauses the command until one of the given users sends a message in any of the given channels. When a message is sent, \`condition\` will be run to determine if the message can be accepted. If no message has been accepted within \`timeout\` then the subtag returns \`Wait timed out\`, otherwise it returns an array containing the channel Id, then the message Id. \n\n\`channels\` defaults to the current channel.\n\`users\` defaults to the current user.\n\`condition\` must return \`true\` or \`false\`\n\`timeout\` is a number of seconds. This is limited to 300\n\n While inside the \`condition\` parameter, none of the following subtags may be used: \`${bbtag.overrides.waitmessage.join(', ')}\`\nAlso, the current message becomes the users message that is to be checked. This means that \`{channelid}\`, \`{messageid}\`, \`{userid}\` and all related subtags will change their values.`,
            definition: [
                {
                    parameters: [],
                    description: 'Pauses the command until the executing user sends a message in the current channel.',
                    exampleCode: '{waitmessage}',
                    exampleOut: '["111111111111111","2222222222222"]',
                    returns: 'id[]',
                    execute: (ctx) => this.awaitMessage(ctx, '', '', defaultCondition, '60')
                },
                {
                    parameters: ['channelIDs', 'userIDs?', '~condition?:true', 'timeout?:60'],
                    description: 'Pauses the command until `condition` returns true when one of `userIDs` sends a message in one of `channelIDs`.',
                    exampleCode: '{waitmessage;111111111111111;{userid;stupid cat};{bool;{username};startswith;stupid};50}',
                    exampleOut: '["111111111111111", "103347843934212096"]',
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
