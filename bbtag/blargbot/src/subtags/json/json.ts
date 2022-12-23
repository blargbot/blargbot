import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { bbtag, SubtagType } from '../../utils/index.js';
import { p } from '../p.js';

export class JsonSubtag extends Subtag {
    public constructor() {
        super({
            name: 'json',
            category: SubtagType.JSON,
            aliases: ['j'],
            definition: [
                {
                    parameters: ['~input?:{}'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json',
                    execute: (_, [value]) => this.getJson(value.raw)
                }
            ]
        });
    }

    public getJson(input: string): JToken {
        const result = bbtag.json.parse(input);
        if (result === undefined)
            throw new BBTagRuntimeError('Invalid JSON provided');
        return result;
    }
}
