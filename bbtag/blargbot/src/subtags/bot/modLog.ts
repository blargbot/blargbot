import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import type { ModLogService } from '../../services/ModLogService.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.modLog;

@Subtag.id('modLog')
@Subtag.ctorArgs('modLog', 'converter', 'users')
export class ModLogSubtag extends CompiledSubtag {
    readonly #modLog: ModLogService;
    readonly #converter: BBTagValueConverter;
    readonly #users: UserService;

    public constructor(modLog: ModLogService, converter: BBTagValueConverter, users: UserService) {
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

        this.#modLog = modLog;
        this.#converter = converter;
        this.#users = users;
    }

    public async createModLog(
        context: BBTagScript,
        action: string,
        userStr: string,
        modStr: string,
        reason: string,
        colorStr: string
    ): Promise<void> {
        const user = await this.#users.querySingle(context.runtime, userStr);
        if (user === undefined)
            throw new UserNotFoundError(userStr);

        const color = this.#converter.color(colorStr);

        //TODO no user found for this?
        const mod = await this.#users.querySingle(context.runtime, modStr) ?? context.runtime.user;

        await this.#modLog.addModLog(context.runtime.guild, action, user, mod, reason, color);
    }
}
