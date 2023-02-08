import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities, BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.modLog;

@Subtag.names('modLog')
@Subtag.ctorArgs(Subtag.util(), Subtag.converter(), Subtag.service('user'))
export class ModLogSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;
    readonly #converter: BBTagValueConverter;
    readonly #users: UserService;

    public constructor(util: BBTagUtilities, converter: BBTagValueConverter, users: UserService) {
        super({
            category: SubtagType.BOT,
            description: tag.description,
            definition: [
                {
                    parameters: ['action', 'user', 'moderator?', 'reason?', 'color?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [action, user, moderator, reason, color]) => this.createModLog(ctx, action.value, user.value, moderator.value, reason.value, color.value)
                }
            ]
        });

        this.#util = util;
        this.#converter = converter;
        this.#users = users;
    }

    public async createModLog(
        context: BBTagContext,
        action: string,
        userStr: string,
        modStr: string,
        reason: string,
        colorStr: string
    ): Promise<void> {
        const user = await this.#users.querySingle(context, userStr);
        if (user === undefined)
            throw new UserNotFoundError(userStr);

        const color = this.#converter.color(colorStr);

        //TODO no user found for this?
        const mod = await this.#users.querySingle(context, modStr) ?? context.user;

        await this.#util.addModLog(context.guild, action, user, mod, reason, color);
    }
}
