import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.capitalize;

export class CapitalizeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'capitalize',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.ignoreRest.description,
                    exampleCode: tag.ignoreRest.exampleCode,
                    exampleOut: tag.ignoreRest.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.capitalize(text.value, false)
                },
                {
                    parameters: ['text', 'lower'],
                    description: tag.restLower.description,
                    exampleCode: tag.restLower.exampleCode,
                    exampleOut: tag.restLower.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.capitalize(text.value, true)
                }
            ]
        });
    }

    public capitalize(text: string, lowercase: boolean): string {
        const rest = text.slice(1);
        return text.slice(0, 1).toUpperCase() + (lowercase ? rest.toLowerCase() : rest);
    }
}
