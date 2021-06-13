import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType } from '../utils';

export class JsonSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'json',
            category: SubtagType.ARRAY,
            aliases: ['j'],
            definition: [{
                args: ['~input'],
                description: 'Defines a raw JSON object. Usage of subtags is disabled in `input`, inside `input` all brackets are required to match.',
                exampleCode: '{json;{\n  "key": "value"\n}}',
                exampleOut: '{\n  "key": "value"\n}',
                execute: async (ctx, [value], subtag) => this.getJSON(ctx, value.raw, subtag),
            }]
        })
    }

    public getJSON(context: BBTagContext, input: string, subtag: SubtagCall) {
        try {
            return JSON.stringify(JSON.parse(input));
        } catch (err) {
            return this.customError('Invalid JSON provided', context, subtag);
        }
    }
}