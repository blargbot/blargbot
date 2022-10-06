import { GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

export class NatoCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `nato`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: `{text+}`,
                    description: `Translates the given text into the NATO phonetic alphabet.`,
                    execute: (_, [text]) => this.natoify(text.asString)
                }
            ]
        });
    }

    public natoify(text: string): string {
        const result = [];
        let other = ``;
        for (const char of text) {
            const lower = char.toLowerCase();
            if (chars.includes<string>(lower)) {
                if (other !== ``) {
                    result.push(other);
                    other = ``;
                }
                result.push(natoMap[lower]);
            } else {
                other += char;
            }
        }
        if (other !== ``)
            result.push(other);

        return result.join(` `);
    }
}

const natoMap = {
    a: `Alpha`,
    b: `Bravo`,
    c: `Charlie`,
    d: `Delta`,
    e: `Echo`,
    f: `Foxtrot`,
    g: `Golf`,
    h: `Hotel`,
    i: `India`,
    j: `Juliett`,
    k: `Kilo`,
    l: `Lima`,
    m: `Mike`,
    n: `November`,
    o: `Oscar`,
    p: `Papa`,
    q: `Quebec`,
    r: `Romeo`,
    s: `Sierra`,
    t: `Tango`,
    u: `Uniform`,
    v: `Victor`,
    w: `Whiskey`,
    x: `Xray`,
    y: `Yankee`,
    z: `Zulu`
} as const;
const chars = Object.keys(natoMap);
