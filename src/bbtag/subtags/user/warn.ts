import { parse } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.warn;

export interface WarnOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly count: number;
    readonly reason: string;
}

export interface WarnFeature {
    warnUser(options: WarnOptions): Promise<number>;
}

type Features = WarnFeature
export class WarnSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'warn',
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['user?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx, [user]) => this.warnUser(ctx, user.value, '1', '')
                },
                {
                    parameters: ['user', 'count:1', 'reason?'],
                    description: tag.withReason.description,
                    exampleCode: tag.withReason.exampleCode,
                    exampleOut: tag.withReason.exampleOut,
                    returns: 'number',
                    execute: (ctx, [user, count, reason]) => this.warnUser(ctx, user.value, count.value, reason.value)
                }
            ]
        });
        this.#features = features;
    }

    public async warnUser(
        context: BBTagContext,
        userStr: string,
        countStr: string,
        reason: string
    ): Promise<number> {
        const count = parse.int(countStr);

        const targetId = await UserIdSubtag.query(context, userStr)
            ?? new UserNotFoundError(userStr).throw();

        if (count === undefined)
            throw new NotANumberError(countStr);

        return await this.#features.warnUser({
            guildId: context.root.guildId,
            targetId,
            moderatorId: context.root.message.author.id,
            count,
            reason: reason !== '' ? reason : 'Tag Warning'
        });
    }
}
