import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class CapitalizeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'capitalize',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Capitalizes the first letter of `text`, leaves the rest of the text untouched.',
                    exampleCode: '{capitalize;hello world!}\n{capitalize;hELLO world}',
                    exampleOut: 'Hello world!\nHELLO world',
                    returns: 'string',
                    execute: (_, [text]) => text.value[0].toUpperCase() + text.value[0].substr(1)
                },
                {
                    parameters: ['text', 'lower'],
                    description: 'Capitalizes the first letter of `text`, and converts the rest to lowercase.',
                    exampleCode: '{capitalize;hELLO WORLD;true}\n{capitalize;hello WORLD;anything goes here}\n{capitalize;foo BAR;}',
                    exampleOut: 'Hello world\nHello world\nFoo bar',
                    returns: 'string',
                    execute: (_, [text]) => text.value[0].toUpperCase() + text.value.substr(1).toLowerCase()
                }
            ]
        });
    }
}
