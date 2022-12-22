import { UserNotFoundError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';
import moment from 'moment-timezone';

export class UserJoinedAtSubtag extends Subtag {
    public constructor() {
        super({
            name: 'userJoinedAt',
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format]) => this.getUserJoinDate(ctx, format.value, '', false)
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format, userId, quiet]) => this.getUserJoinDate(ctx, format.value, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserJoinDate(
        context: BBTagContext,
        format: string,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userId, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        return moment(member.joinedAt).utcOffset(0).format(format);
    }
}
