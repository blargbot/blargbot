import { Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class JsonSubtag extends Subtag {
    public constructor() {
        super({
            name: 'json',
            category: SubtagType.JSON,
            aliases: ['j'],
            definition: [{
                parameters: ['~input?:{}'],
                description: 'Defines a raw JSON object. Usage of subtags is disabled in `input`, inside `input` all brackets are required to match.',
                exampleCode: '{json;{\n  "key": "value"\n}}',
                exampleOut: '{\n  "key": "value"\n}',
                returns: 'json',
                execute: (_, [value]) => this.getJson(value.raw)
            }]
        });
    }

    public getJson(input: string): JToken {
        try {
            return JSON.parse(input);
        } catch (err: unknown) {
            throw new BBTagRuntimeError('Invalid JSON provided');
        }
    }
}