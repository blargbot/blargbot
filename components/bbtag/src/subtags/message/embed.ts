import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.embed;

export class EmbedSubtag extends CompiledSubtag {
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
