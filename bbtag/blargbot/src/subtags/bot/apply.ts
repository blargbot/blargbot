import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';
import { parse } from '@blargbot/core/utils/index.js';

import { BBTagRuntimeError, UnknownSubtagError } from '@bbtag/engine';
import type { SubtagCall } from '../../language/index.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class ApplySubtag extends Subtag {
    public constructor() {
        super({
            name: 'apply',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['subtag', 'args*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [subtagName, ...args], subtag) => this.defaultApply(ctx, subtagName.value, args.map(a => a.value), subtag)
                }
            ]
        });
    }

    public async defaultApply(
        context: BBTagContext,
        subtagName: string,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        try {
            context.getSubtag(subtagName.toLowerCase());
        } catch (error: unknown) {
            if (error instanceof UnknownSubtagError)
                throw new BBTagRuntimeError('No subtag found');
            throw error;
        }

        const flatArgs = args
            .flatMap(arg => bbtag.tagArray.deserialize(arg)?.v ?? [arg])
            .map(v => parse.string(v));

        const source = `{${[subtagName, ...flatArgs].join(';')}}`;

        return await context.eval({
            values: [{
                name: {
                    start: subtag.start,
                    end: subtag.start,
                    values: [subtagName],
                    source: subtagName
                },
                args: flatArgs.map(arg => ({
                    start: subtag.start,
                    end: subtag.start,
                    values: [arg],
                    source: arg
                })),
                start: subtag.start,
                end: subtag.end,
                source
            }],
            start: subtag.start,
            end: subtag.end,
            source
        });
    }
}
