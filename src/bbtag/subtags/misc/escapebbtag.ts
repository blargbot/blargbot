import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class EscapeBbtagSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `escapebbtag`,
            category: SubtagType.MISC,
            aliases: [`escape`],
            definition: [
                {
                    parameters: [`~input*`],
                    description: `Returns \`input\` without resolving any BBTagThis effectively returns the characters \`{\`, \`}\` and \`;\` as is, without the use of \`{rb}\`, \`{lb}\` and \`{semi}\`.\n**NOTE:** Brackets inside code must come in pairs. A \`{\` has to be followed by a \`}\` somewhere and a \`} has to have a {\` before it`,
                    exampleCode: `{escapebbtag;{set;~index;1}}`,
                    exampleOut: `{set;~index;1}`,
                    returns: `string`,
                    execute: (_, items) => this.escape(items.map(i => i.code.source).join(`;`))
                }
            ]
        });
    }

    public escape(text: string): string {
        return text;
    }
}
