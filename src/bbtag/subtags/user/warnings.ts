import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.warnings;

export interface GetWarningsFeature {
    getWarnings(guildId: string, userId: string): Awaitable<number | undefined>;
}

type Features = GetWarningsFeature;
export class WarningsSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'warnings',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user?', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (context, [user, quiet]) => this.getUserWarnings(context, user.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getUserWarnings(context: BBTagContext, userQuery: string, quiet: boolean): Promise<number> {
        const userId = await UserIdSubtag.query(context, userQuery, { noLookup: quiet, global: true })
            ?? new UserNotFoundError(userQuery).throw();

        return await this.#features.getWarnings(context.root.guildId, userId) ?? 0;
    }
}
