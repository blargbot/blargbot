import { BaseSubtag, SubtagType } from '../core';

export class CleanSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'clean',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Removes all duplicated whitespace from `text`, meaning a cleaner output.',
                    exampleCode: '{clean;Hello!  \n\n  Im     here    to help}',
                    exampleOut: 'Hello!\nIm here to help',
                    execute: (_, [text]) => this.clean(text.value)
                }
            ]
        });
    }

    public clean(text: string): string {
        return text.replace(/\s+/g, (match) => {
            if (match.includes('\n')) return '\n';
            if (match.includes('\t')) return '\t';
            return match.substr(0, 1);
        });
    }
}
