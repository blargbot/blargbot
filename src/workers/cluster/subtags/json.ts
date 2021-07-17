import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

export class JsonSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'json',
            category: SubtagType.ARRAY,
            aliases: ['j'],
            definition: [{
                parameters: ['~input'],
                description: 'Defines a raw JSON object. Usage of subtags is disabled in `input`, inside `input` all brackets are required to match.',
                exampleCode: '{json;{\n  "key": "value"\n}}',
                exampleOut: '{\n  "key": "value"\n}',
                execute: (ctx, [value], subtag) => this.getJson(ctx, value.raw, subtag)
            }]
        });
    }

    public getJson(context: BBTagContext, input: string, subtag: SubtagCall): string {
        try {
            return JSON.stringify(JSON.parse(input));
        } catch (err: unknown) {
            return this.customError('Invalid JSON provided', context, subtag);
        }
    }
}
