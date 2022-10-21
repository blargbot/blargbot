import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotANumberError, UserNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.warn;

export class WarnSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'warn',
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['user?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx, [user]) => this.warnUser(ctx, user.value, '1', '')
                },
                {
                    parameters: ['user', 'count:1', 'reason?'],
                    description: tag.withReason.description,
                    exampleCode: tag.withReason.exampleCode,
                    exampleOut: tag.withReason.exampleOut,
                    returns: 'number',
                    execute: (ctx, [user, count, reason]) => this.warnUser(ctx, user.value, count.value, reason.value)
                }
            ]
        });
    }

    public async warnUser(
        context: BBTagContext,
        userStr: string,
        countStr: string,
        reason: string
    ): Promise<number> {
        const count = parse.int(countStr);

        const member = await context.queryMember(userStr);

        if (member === undefined)
            throw new UserNotFoundError(userStr);

        if (count === undefined)
            throw new NotANumberError(countStr);

        return await context.util.warn(member, context.user, count, reason !== '' ? reason : 'Tag Warning');
    }
}
