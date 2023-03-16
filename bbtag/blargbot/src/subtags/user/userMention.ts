import { markup } from '@blargbot/discord-util';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotABooleanError, UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.userMention;

@Subtag.id('userMention')
@Subtag.ctorArgs('converter', 'users')
export class UserMentionSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #users: UserService;

    public constructor(converter: BBTagValueConverter, users: UserService) {
        super({
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.userMention(ctx, ctx.runtime.user.id, false, 'false')
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

        this.#converter = converter;
        this.#users = users;
    }

    public async userMention(
        context: BBTagScript,
        userId: string,
        quiet: boolean,
        noPingStr: string
    ): Promise<string> {
        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const noPing = this.#converter.boolean(noPingStr);
        if (noPing === undefined)
            throw new NotABooleanError(noPing);

        const user = await this.#users.querySingle(context.runtime, userId, { noLookup: quiet });

        if (user === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        if (!noPing)
            context.runtime.outputOptions.mentionUsers.add(user.id);

        return markup.user(user.id);
    }
}
