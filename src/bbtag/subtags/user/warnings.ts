import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.warnings;

export interface GetWarnings {
    (guildId: string, userId: string): Awaitable<number | undefined>;
}

export class WarningsSubtag extends CompiledSubtag {
    readonly #getWarnings: GetWarnings;
    public constructor({ getWarnings }: { getWarnings: GetWarnings; }) {
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
        this.#getWarnings = getWarnings;
    }

    public async getUserWarnings(context: BBTagContext, userQuery: string, quiet: boolean): Promise<number> {
        const user = await context.queryUser(userQuery, { noLookup: quiet });

        if (user === undefined)
            throw new UserNotFoundError(userQuery);

        return await this.#getWarnings(context.root.guildId, user.id) ?? 0;
    }
}
