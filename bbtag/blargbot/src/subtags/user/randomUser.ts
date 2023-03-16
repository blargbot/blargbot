import { randomInt } from 'node:crypto';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.randomUser;

@Subtag.id('randomUser', 'randUser')
@Subtag.ctorArgs('users')
export class RandomUserSubtag extends CompiledSubtag {
    readonly #users: UserService;

    public constructor(users: UserService) {
        super({
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

        this.#users = users;
    }

    public async randomUser(context: BBTagScript): Promise<string> {
        const users = await this.#users.getAll(context.runtime);
        return users[randomInt(users.length)].id;
    }
}
