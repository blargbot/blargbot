import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToColor } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from '../user/userId.js';

const tag = templates.subtags.modLog;

export interface AddModLogOptions {
    readonly guildId: string;
    readonly action: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly reason?: string;
    readonly color?: number;
}

export interface AddModLogFeature {
    addModLog(options: AddModLogOptions): Promise<void>;
}

type Features = AddModLogFeature;
export class ModLogSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'modLog',
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
        this.#features = features;
    }

    public async createModLog(
        context: BBTagContext,
        action: string,
        userStr: string,
        modStr: string,
        reason: string,
        colorStr: string
    ): Promise<void> {
        const targetId = await UserIdSubtag.query(context, userStr, { global: true })
            ?? new UserNotFoundError(userStr).throw();

        const color = convertToColor(colorStr);

        //TODO no user found for this?
        const moderatorId = await UserIdSubtag.query(context, modStr, { global: true })
            ?? context.root.userId;

        await this.#features.addModLog({
            guildId: context.root.guildId,
            action,
            targetId,
            moderatorId,
            reason,
            color
        });
    }
}
