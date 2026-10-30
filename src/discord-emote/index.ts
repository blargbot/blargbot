import { rawEmoteJson } from './data.js';

export default class Emote {
    public static findAll(this: void, text: string): Emote[] {
        return Emote.#findAll(text)[0];
    }

    public static parse(this: void, text: string): Emote {
        const [result, success] = Emote.#findAll(text);
        if (!success || result.length !== 1)
            throw new Error(`${JSON.stringify(text)} is not an emote`);

        return result[0];
    }

    static #findAll(this: void, text: string): [results: Emote[], strict: boolean] {
        const initial = text;
        const emotes: Emote[] = [];
        guildEmoteRegex.lastIndex = 0;
        text = text.replaceAll(guildEmoteRegex, (_, animated: string, name: string, id: string) => {
            emotes.push(new Emote(name, BigInt(id), animated !== ''));
            return '';
        }).replaceAll(guildApiEmoteRegex, (_, name: string, id: string) => {
            emotes.push(new Emote(name, BigInt(id)));
            return '';
        }).replaceAll(discordEmoteRegex, emote => {
            emotes.push(new Emote(emote));
            return '';
        });

        const result = emotes
            .map(m => ({ emote: m, index: initial.indexOf(m.toApi()) }))
            .sort((a, b) => a.index - b.index)
            .map(x => x.emote);

        return [result, text.length === 0];
    }

    public constructor(name: string);
    public constructor(name: string, id?: bigint, animated?: boolean);
    public constructor(
        public readonly name: string,
        public readonly id?: bigint,
        public readonly animated = false
    ) { }

    public toApi(): string {
        return this.id === undefined ? this.name : `${this.name}:${this.id}`;
    }

    public toString(): string {
        if (this.id === undefined)
            return this.name;
        if (this.animated)
            return `<a:${this.name}:${this.id}>`;
        return `<:${this.name}:${this.id}>`;
    }
}

const guildEmoteRegex = /<(?<animated>a?):(?<name>[\w_]{1,32}):(?<id>\d{17,23})>/g;
const guildApiEmoteRegex = /(?<name>[\w_]{1,32}):(?<id>\d{17,23})/g;
const discordEmotes = (JSON.parse(rawEmoteJson) as { emojis: Array<{ surrogates: string; }>; }).emojis.map(x => x.surrogates);

const isLeaf: unique symbol = Symbol();
interface CodepointTree {
    [key: string]: CodepointTree;
}

const codepointTree = {} as CodepointTree;
for (const emote of discordEmotes) {
    let node = codepointTree;
    for (const char of emote.split('')) {
        const code = char.codePointAt(0) ?? 0;
        node = node[code.toString(16).padStart(4, '0')] ??= {};
    }
    Object.assign(node, { [isLeaf]: true });
}

function buildRegexStr(tree: CodepointTree): string[] {
    return Object.entries(tree)
        .map(([codepoint, children]) => {
            const innerRegex = buildRegexStr(children);
            if (innerRegex.length === 0)
                return `\\u${codepoint}`;
            if (innerRegex.length === 1)
                return isLeaf in children
                    ? `\\u${codepoint}(?:${innerRegex[0]})?`
                    : `\\u${codepoint}${innerRegex[0]}`;
            return isLeaf in children
                ? `\\u${codepoint}(?:${innerRegex.join('|')})?`
                : `\\u${codepoint}(?:${innerRegex.join('|')})`;
        }).sort((a, b) => b.length - a.length);
}
const discordEmoteRegex = new RegExp(buildRegexStr(codepointTree).join('|'), 'g');
