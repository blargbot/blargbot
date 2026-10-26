import { parse } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotABooleanError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.userMention;

export class UserMentionSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'userMention',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.userMention(ctx, ctx.local.message.author.id, false, 'false')
                },
                {
                    parameters: ['user', 'quiet?', 'noPing?:false'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet, noPing]) => this.userMention(ctx, userId.value, quiet.value !== '', noPing.value)
                }
            ]
        });
    }

    public async userMention(
        context: BBTagContext,
        userStr: string,
        quiet: boolean,
        noPingStr: string
    ): Promise<string> {
        quiet ||= context.local.quiet ?? false;
        const noPing = parse.boolean(noPingStr);
        if (noPing === undefined)
            throw new NotABooleanError(noPing);

        const userId = await UserIdSubtag.query(context, userStr, { noLookup: quiet, global: true })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();

        if (!noPing)
            context.root.allowedMentions.users.add(userId);
        return `<@${userId}>`;
    }
}
