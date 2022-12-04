import res from '@blargbot/res';
import type { Snowflake } from 'catflake';
import * as Eris from 'eris';
import twemoji from 'twemoji';

import { snowflake } from './utils/index.js';

export class Emote {
    public static findAll(this: void, text: string): Emote[] {
        return Emote.#findAll(text)[0];
    }

    public static parse(this: void, text: string): Emote {
        const [result, success] = Emote.#findAll(text);
        if (!success || result.length !== 1)
            throw new Error(`${JSON.stringify(text)} is not an emote`);

        return result[0];
    }

    public static create(this: void, data: Eris.PartialEmoji): Emote {
        if (data.id === null)
            return Emote.parse(data.name);
        return Emote.parse(`<${data.animated === true ? 'a' : ''}:${data.name}:${data.id}>`);
    }

    static #findAll(this: void, text: string): [results: Emote[], strict: boolean] {
        const initial = text;
        const emotes: Emote[] = [];
        guildEmoteRegex.lastIndex = 0;
        text = text.replaceAll(guildEmoteRegex, (_, animated: string, name: string, id: Snowflake) => {
            emotes.push(new Emote(name, id, animated !== ''));
            return '';
        }).replaceAll(guildApiEmoteRegex, (_, name: string, id: Snowflake) => {
            emotes.push(new Emote(name, id));
            return '';
        }).replaceAll(discordEmoteRegex, emote => {
            emotes.push(new Emote(emote));
            return '';
        }).replaceAll(keycapEmote, emote => {
            emotes.push(new Emote(emote));
            return '';
        }).replaceAll(otherEmotes, emote => {
            emotes.push(new Emote(emote));
            return '';
        });
        twemoji.parse(text, {
            callback(codepoint) {
                const emote = twemoji.convert.fromCodePoint(codepoint);
                emotes.push(new Emote(emote));
                return text = text.replace(emote, '');
            }
        });

        const result = emotes
            .map(m => ({ emote: m, index: initial.indexOf(m.toApi()) }))
            .sort((a, b) => a.index - b.index)
            .map(x => x.emote);

        return [result, text.length === 0];
    }

    public constructor(name: string);
    public constructor(name: string, id: Snowflake, animated?: boolean);
    public constructor(
        public readonly name: string,
        public readonly id?: Snowflake,
        public readonly animated = false) {
        if (id !== undefined && !snowflake.test(id))
            throw new Error(`${id as string} is not a valid emote id`);
    }

    public toApi(): `${string}:${Snowflake}` | string {
        return this.id === undefined ? this.name : `${this.name}:${this.id}`;
    }

    public toString(): `<${'a' | ''}:${string}:${Snowflake}>` | string {
        if (this.id === undefined)
            return this.name;
        if (this.animated)
            return `<a:${this.name}:${this.id}>`;
        return `<:${this.name}:${this.id}>`;
    }
}

const guildEmoteRegex = /<(?<animated>a?):(?<name>[\w_]{1,32}):(?<id>\d{17,23})>/g;
const guildApiEmoteRegex = /(?<name>[\w_]{1,32}):(?<id>\d{17,23})/g;
const keycapEmote = /[#*0-9]\uFE0F?\u20E3/g;
const otherEmotes = /©️/g;
const discordEmoteData = await res.discordEmoteData.load();
const discordEmotes = Object.values(discordEmoteData)
    .flat()
    .flatMap(entry => 'diversityChildren' in entry ? [entry, ...entry.diversityChildren ?? []] : [entry])
    .map(entry => entry.surrogates);

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
