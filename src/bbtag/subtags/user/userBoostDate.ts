import { Member } from 'eris';
import moment from 'moment-timezone';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.userBoostDate;

export class UserBoostDateSubtag extends CompiledSubtag {
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

    public getUserBoostDate(user: Member, format: string): string {
        if (typeof user.premiumSince !== 'number')
            throw new BBTagRuntimeError('User not boosting');

        return moment(user.premiumSince).utcOffset(0).format(format);
    }
}
