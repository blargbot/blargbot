import { parse } from '@blargbot/core/utils/index.js';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class EmbedSubtag extends Subtag {
    public constructor() {
        super({
            name: 'embed',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['embed+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, embeds) => this.setEmbed(ctx, embeds.map(e => e.value))
                }
            ]
        });
    }

    public setEmbed(context: BBTagContext, embedStr: string[]): void {
        context.data.embeds = embedStr.flatMap(e => parse.embed(e) ?? []);

    }
}
