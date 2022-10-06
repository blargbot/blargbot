import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class CapitalizeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `capitalize`,
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: [`text`],
                    description: `Capitalizes the first letter of \`text\`, leaves the rest of the text untouched.`,
                    exampleCode: `{capitalize;hello world!}\n{capitalize;hELLO world}`,
                    exampleOut: `Hello world!\nHELLO world`,
                    returns: `string`,
                    execute: (_, [text]) => this.capitalize(text.value, false)
                },
                {
                    parameters: [`text`, `lower`],
                    description: `Capitalizes the first letter of \`text\`, and converts the rest to lowercase.`,
                    exampleCode: `{capitalize;hELLO WORLD;true}\n{capitalize;hello WORLD;anything goes here}\n{capitalize;foo BAR;}`,
                    exampleOut: `Hello world\nHello world\nFoo bar`,
                    returns: `string`,
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
