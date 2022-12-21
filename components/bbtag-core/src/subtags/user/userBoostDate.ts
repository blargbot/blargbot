import type * as Eris from 'eris';
import moment from 'moment-timezone';

import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class UserBoostDateSubtag extends Subtag {
    public constructor() {
        super({
            name: 'userBoostDate',
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    execute: (ctx, [format]) => this.getUserBoostDate(ctx.member!, format.value)
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (context, [format, user, quiet]) => this.findUserBoostDate(context, format.value, user.value, quiet.value !== '')
                }
            ]
        });
    }

    public async findUserBoostDate(context: BBTagContext, format: string, userStr: string, quiet: boolean): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userStr, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return this.getUserBoostDate(member, format);
    }

    public getUserBoostDate(user: Eris.Member, format: string): string {
        if (typeof user.premiumSince !== 'number')
            throw new BBTagRuntimeError('User not boosting');

        return moment(user.premiumSince).utcOffset(0).format(format);
    }
}
