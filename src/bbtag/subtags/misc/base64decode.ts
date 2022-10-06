import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class Base64DecodeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `base64decode`,
            aliases: [`atob`],
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: [`text`],
                    description: `Converts the provided base64 to a UTF-8 string.`,
                    exampleCode: `{base64decode;RmFuY3kh}`,
                    exampleOut: `Fancy!`,
                    returns: `string`,
                    execute: (_, [text]) => this.decode(text.value)
                }
            ]
        });
    }

    public decode(base64: string): string {
        return Buffer.from(base64, `base64`).toString();
    }
}
