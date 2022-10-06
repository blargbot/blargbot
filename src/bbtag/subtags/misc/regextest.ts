import { RegexSubtag } from '../../RegexSubtag';
import { SubtagType } from '../../utils';

export class RegexTestSubtag extends RegexSubtag {
    public constructor() {
        super({
            name: `regextest`,
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: [`text`, `~regex#50000`],
                    description: `Tests if the \`regex\` phrase matches the \`text\`, and returns a boolean (true/false). Any bbtag in \`regex\` will not be resolved. Please consider using \`{apply}\` for a dynamic regex. \`regex\` will only succeed to compile if it is deemed a safe regular expression (safe regexes do not run in exponential time for any input)`,
                    exampleCode: `{regextest;apple;/p+/i} {regextest;banana;/p+/i}`,
                    exampleOut: `true false`,
                    returns: `boolean`,
                    execute: (_, [text, regex]) => this.regexTest(text.value, regex.raw)
                }
            ]
        });
    }

    public regexTest(text: string, regexStr: string): boolean {
        const regex = this.createRegex(regexStr);
        return regex.test(text);
    }
}
