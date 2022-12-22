import { Subtag } from '@bbtag/subtag';
import htmlEntities from 'html-entities';

import { p } from '../p.js';

export class HtmlEncodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'htmlEncode',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.htmlEncode(text.value) // TODO: use subtag.source
                }
            ]
        });
    }

    public htmlEncode(html: string): string {
        return htmlEntities.encode(html);
    }
}
