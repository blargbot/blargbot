import { parse } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.pardon;

export interface PardonOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly count: number;
    readonly reason: string;
}

export interface PardonThunk {
    (options: PardonOptions): Promise<number>;
}

export class PardonSubtag extends CompiledSubtag {
    readonly #pardon: PardonThunk;
    public constructor({ pardon }: { pardon: PardonThunk; }) {
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
        this.#pardon = pardon;
    }

    public async pardon(
        context: BBTagContext,
        userStr: string,
        countStr: string,
        reason: string
    ): Promise<number> {
        const member = await context.queryMember(userStr);
        if (member === undefined)
            throw new UserNotFoundError(userStr);

        const count = parse.int(countStr);
        if (count === undefined)
            throw new NotANumberError(countStr);

        return await this.#pardon({
            guildId: context.root.guildId,
            targetId: member.id,
            moderatorId: context.root.message.author.id,
            count,
            reason: reason !== '' ? reason : 'Tag Pardon'
        });
    }
}
