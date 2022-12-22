import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class EscapeBBTagSubtag extends Subtag {
    public constructor() {
        super({
            name: 'escapeBBTag',
            category: SubtagType.MISC,
            aliases: ['escape'],
            definition: [
                {
                    parameters: ['~input*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, items) => this.escape(items.map(i => i.code.source).join(';'))
                }
            ]
        });
    }

    public escape(text: string): string {
        return text;
    }
}
