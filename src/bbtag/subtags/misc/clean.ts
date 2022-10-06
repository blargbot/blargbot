import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class CleanSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `clean`,
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: [`text`],
                    description: `Removes all duplicated whitespace from \`text\`, meaning a cleaner output.`,
                    exampleCode: `{clean;Hello!  \n\n  Im     here    to help}`,
                    exampleOut: `Hello!\nIm here to help`,
                    returns: `string`,
                    execute: (_, [text]) => this.clean(text.value)
                }
            ]
        });
    }

    public clean(text: string): string {
        return text.replace(/\s+/g, (match) => {
            if (match.includes(`\n`)) return `\n`;
            if (match.includes(`\t`)) return `\t`;
            return match[0];
        });
    }
}
