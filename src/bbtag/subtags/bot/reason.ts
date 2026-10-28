import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { GetUserNameFeature } from '../user/userName.js';

const tag = templates.subtags.reason;

type Features = GetUserNameFeature;
export class ReasonSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'reason',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['reason?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [reason]) => this.setReason(ctx, reason.value)
                }
            ]
        });
        this.#features = features;
    }

    public setReason(context: BBTagContext, reason: string): void {
        context.local.reason = reason;
    }

    public static async get(context: BBTagContext): Promise<string> {
        return await context.engine.getSubtag(ReasonSubtag).get(context);
    }

    public async get(context: BBTagContext): Promise<string> {
        const reason = context.local.reason ?? '';
        const username = await this.#features.getUserName(context.root.userId) ?? 'deleted-user';
        return reason.length > 0
            ? `[@${username}]${reason}`
            : `[@${username}]`;
    }
}
