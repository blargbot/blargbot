import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';

export class CapitalizeSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'capitalize',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Capitalizes the first letter of `text`, leaves the rest of the text untouched.',
                    exampleCode: '{capitalize;hello world!}\n{capitalize;hELLO world}',
                    exampleOut: 'Hello world!\nHELLO world',
                    execute: (_, [{ value: text }]) => text[0].toUpperCase() + text[0].substr(1)
                },
                {
                    parameters: ['text', 'lower'],
                    description: 'Capitalizes the first letter of `text`, and converts the rest to lowercase.',
                    exampleCode: '{capitalize;hELLO WORLD;true}\n{capitalize;hello WORLD;anything goes here}\n{capitalize;foo BAR;}',
                    exampleOut: 'Hello world\nHello world\nFoo bar',
                    execute: (_, [{ value: text }]) => text[0].toUpperCase() + text.substr(1).toLowerCase()
                }
            ]
        });
    }
}
