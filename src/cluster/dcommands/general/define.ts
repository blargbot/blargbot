import { BaseGlobalCommand, CommandContext } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { guard, humanize } from '@blargbot/core/utils';
import { mapping } from '@blargbot/mapping';
import { EmbedOptions } from 'eris';
import fetch, { RequestInit } from 'node-fetch';

export class DefineCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'define',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{word}',
                    description: 'Gets the definition for the specified word. The word must be in english.',
                    execute: (ctx, [word]) => this.define(ctx, word.asString)
                }
            ]
        }, true);
    }

    public async define(context: CommandContext, word: string): Promise<string | EmbedOptions> {
        const response = await fetchSafe(`https://wordsapiv1.p.rapidapi.com/words/${word}`, {
            headers: {
                'x-rapidapi-key': context.config.general.mashape,
                'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com'
            }
        });
        const details = wordApiMapping(response);
        if (!details.valid)
            return this.error('It seems I cant find the definition for that word at the moment!');

        const defaultIPA = details.value.pronunciation.all ?? '';

        return {
            author: context.util.embedifyAuthor(context.author),
            title: `Definition for ${word}`,
            description: defaultIPA !== '' ? `**Pronunciation** ${linkPronunciation(defaultIPA)}` : undefined,
            fields: details.value.results
                .slice(0, 15)
                .map((r, i) => {
                    const specificIPA = details.value.pronunciation[r.partOfSpeech] ?? defaultIPA;
                    return {
                        name: `${i + 1}. ${r.partOfSpeech}`,
                        value: [
                            specificIPA !== defaultIPA ? `**Pronunciation**: ${linkPronunciation(specificIPA)}` : undefined,
                            r.synonyms !== undefined ? `**Synonyms:** ${humanize.smartJoin(r.synonyms.map(s => `\`${s}\``), ', ', ' and ')}` : undefined,
                            r.definition
                        ].filter(guard.hasValue).join('\n'),
                        inline: true
                    };
                })
        };
    }
}

function linkPronunciation(phonetic: string): string {
    return `[🔈 ${phonetic}](http://ipa-reader.xyz/?text=${encodeURIComponent(phonetic.replace(/'/g, '&apos;'))})`;
}

async function fetchSafe(url: string, init?: RequestInit): Promise<unknown> {
    try {
        const response = await fetch(url, init);
        return await response.json() as unknown;
    } catch {
        return undefined;
    }
}

const wordApiMapping = mapping.object({
    word: mapping.string,
    results: mapping.array(mapping.object({
        definition: mapping.string,
        partOfSpeech: mapping.string,
        synonyms: mapping.array(mapping.string).optional
    })),
    frequency: mapping.number,
    pronunciation: mapping.record(mapping.choice(mapping.in(undefined), mapping.string))
});
