import { Member } from 'eris';
import moment from 'moment-timezone';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.userTimeout;

export class UserTimeoutSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'userTimeout',
            category: SubtagType.USER,
            aliases: ['timedoutUntil', 'userTimedoutUntil', 'memberTimeout', 'memberTimedoutUntil'],
            description: tag.description,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format]) => this.findUserTimeout(ctx, format.value, '', true)
                },
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format, userId, quiet]) => this.findUserTimeout(ctx, format.value, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async findUserTimeout(
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

        return this.#getUserCommunicationDisabledUntil(member, format);
    }

    #getUserCommunicationDisabledUntil(member: Member, format: string): string {
        if (typeof member.communicationDisabledUntil !== 'number')
            throw new BBTagRuntimeError('User not timed out');
        return moment(member.communicationDisabledUntil).utcOffset(0).format(format);
    }
}
