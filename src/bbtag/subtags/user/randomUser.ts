import { random } from '@blargbot/util';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { ListGuildMembersThunk } from '../guild/guildMembers.js';

const tag = templates.subtags.randomUser;

export class RandomUserSubtag extends CompiledSubtag {
    readonly #listGuildMembers: ListGuildMembersThunk;
    public constructor({ listGuildMembers }: { listGuildMembers: ListGuildMembersThunk; }) {
        super({
            name: 'randomUser',
            aliases: ['randUser'],
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: ctx => this.randomUser(ctx)
                }
            ]
        });
        this.#listGuildMembers = listGuildMembers;
    }

    public async randomUser(context: BBTagContext): Promise<string> {
        const userIds = await this.#listGuildMembers(context.root.guildId);
        return random.pick(userIds);
    }
}
