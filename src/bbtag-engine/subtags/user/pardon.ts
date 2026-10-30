import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToInteger } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.pardon;

export interface PardonOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly count: number;
    readonly reason: string;
}

export interface PardonFeature {
    pardonUser(options: PardonOptions): Promise<number>;
}

type Features = PardonFeature
export class PardonSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'pardon',
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['user?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx, [user]) => this.pardon(ctx, user.value, '1', '')
                },
                {
                    parameters: ['user', 'count:1', 'reason?'],
                    description: tag.withReason.description,
                    exampleCode: tag.withReason.exampleCode,
                    exampleOut: tag.withReason.exampleOut,
                    returns: 'number',
                    execute: (ctx, [user, count, reason]) => this.pardon(ctx, user.value, count.value, reason.value)
                }
            ]
        });
        this.#features = features;
    }

    public async pardon(
        context: BBTagContext,
        userStr: string,
        countStr: string,
        reason: string
    ): Promise<number> {
        const targetId = await UserIdSubtag.query(context, userStr)
            ?? new UserNotFoundError(userStr).throw();

        const count = convertToInteger(countStr);
        if (count === undefined)
            throw new NotANumberError(countStr);

        return await this.#features.pardonUser({
            guildId: context.root.guildId,
            targetId,
            moderatorId: context.root.userId,
            count,
            reason: reason !== '' ? reason : 'Tag Pardon'
        });
    }
}
