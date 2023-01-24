import type * as Eris from 'eris';
import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.userTimeout;

@Subtag.id('userTimeout', 'timedoutUntil', 'userTimedoutUntil', 'memberTimeout', 'memberTimedoutUntil')
@Subtag.ctorArgs()
export class UserTimeoutSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.USER,
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

    #getUserCommunicationDisabledUntil(member: Eris.Member, format: string): string {
        if (typeof member.communicationDisabledUntil !== 'number')
            throw new BBTagRuntimeError('User not timed out');
        return moment(member.communicationDisabledUntil).utcOffset(0).format(format);
    }
}
