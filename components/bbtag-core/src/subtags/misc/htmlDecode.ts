import htmlEntities from 'html-entities';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class HtmlDecodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'htmlDecode',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, text) => this.htmlDecode(text.map(arg => arg.value).join(';'))
                }
            ]
        });
    }

    public htmlDecode(text: string): string {
        return htmlEntities.decode(text);
    }
}
