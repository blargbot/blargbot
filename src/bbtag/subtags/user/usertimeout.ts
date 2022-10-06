import { Member } from 'eris';
import moment from 'moment-timezone';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class UserTimeoutSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `usertimeout`,
            category: SubtagType.USER,
            aliases: [`timedoutuntil`, `usertimedoutuntil`, `membertimeout`, `membertimedoutuntil`],
            description: `See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information about formats. If user has never been timed out in the guild, returns \`User not timed out\``,
            definition: [
                {
                    parameters: [`format?:YYYY-MM-DDTHH:mm:ssZ`],
                    description: `Returns the executing user's timeout date using \`format\` for the output, in UTC+0.`,
                    exampleCode: `You have been timed out until {usertimeout;YYYY/MM/DD HH:mm:ss}`,
                    exampleOut: `You have been timed out until 2021/01/01 00:00:00`,
                    returns: `string`,
                    execute: (ctx, [format]) => this.findUserTimeout(ctx, format.value, ``, true)
                },
                {
                    parameters: [`format?:YYYY-MM-DDTHH:mm:ssZ`, `user`, `quiet?`],
                    description: `Returns a \`user\`'s timeout date using \`format\` for the outpt, in UTC+0. If \`quiet\` is specified, if \`user\` can't be found it will simply return nothing.`,
                    exampleCode: `stupid cat is timed out until {usertimeout;YYYY/MM/DD HH:mm:ss;stupid cat}`,
                    exampleOut: `stupid cat is timed out until 2021/01/01 00:00:00`,
                    returns: `string`,
                    execute: (ctx, [format, userId, quiet]) => this.findUserTimeout(ctx, format.value, userId.value, quiet.value !== ``)
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
                .withDisplay(quiet ? `` : undefined);
        }

        return this.#getUserCommunicationDisabledUntil(member, format);
    }

    #getUserCommunicationDisabledUntil(member: Member, format: string): string {
        if (typeof member.communicationDisabledUntil !== `number`)
            throw new BBTagRuntimeError(`User not timed out`);
        return moment(member.communicationDisabledUntil).utcOffset(0).format(format);
    }
}
