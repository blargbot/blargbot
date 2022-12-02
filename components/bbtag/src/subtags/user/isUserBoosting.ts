import Eris from 'eris';

import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.isUserBoosting;

export class IsUserBoostingSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'isUserBoosting',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    execute: (ctx) => this.isUserBoosting(ctx.member!)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [user, quiet]) => this.findIsUserBoosting(ctx, user.value, quiet.value !== '')
                }
            ]
        });
    }

    public async findIsUserBoosting(context: BBTagContext, userStr: string, quiet: boolean): Promise<boolean> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userStr, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return this.isUserBoosting(member);
    }

    public isUserBoosting(member: Eris.Member): boolean {
        return typeof member.premiumSince === 'number';
    }
}
