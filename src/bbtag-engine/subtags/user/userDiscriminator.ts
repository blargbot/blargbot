import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.userDiscriminator;

export class UserDiscriminatorSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'userDiscriminator',
            aliases: ['userDiscrim'],
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getUserDiscrim(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserDiscrim(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserDiscrim(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.local.quiet ?? false;
        void (await UserIdSubtag.query(context, userId, { noLookup: quiet, global: true })
            ?? new UserNotFoundError(userId).withDisplay(quiet ? '' : undefined).throw());

        return '0000';
    }
}
