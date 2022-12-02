import { CommandContext, GlobalCommand } from '../../command/index.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import { mapping } from '@blargbot/mapping';
import fetch, { RequestInit } from 'node-fetch';

import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.define;

export class DefineCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'define',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{word}',
                    description: cmd.default.description,
                    execute: (ctx, [word]) => this.define(ctx, word.asString)
                }
            ]
        }, true);
    }

    public async define(context: CommandContext, word: string): Promise<CommandResult> {
        const response = await fetchSafe(`https://wordsapiv1.p.rapidapi.com/words/${word}`, {
            headers: {
                'x-rapidapi-key': context.config.general.mashape,
                'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com'
            }
        });
        const details = wordApiMapping(response);
        if (!details.valid)
            return cmd.default.unavailable;

        const defaultIPA = details.value.pronunciation.all ?? '';

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.author),
                    title: cmd.default.embed.title({ word }),
                    description: defaultIPA !== '' ? cmd.default.embed.description(pronunciation(defaultIPA)) : undefined,
                    fields: details.value.results
                        .slice(0, 15)
                        .map((r, i) => {
                            const specificIPA = details.value.pronunciation[r.partOfSpeech] ?? defaultIPA;
                            return {
                                name: cmd.default.embed.field.name({ index: i + 1, type: r.partOfSpeech }),
                                value: cmd.default.embed.field.value.default({
                                    pronunciation: specificIPA !== defaultIPA ? cmd.default.embed.field.value.pronunciation(pronunciation(defaultIPA)) : undefined,
                                    synonyms: r.synonyms !== undefined ? cmd.default.embed.field.value.synonyms({ synonyms: r.synonyms }) : undefined,
                                    definition: r.definition
                                }),
                                inline: true
                            };
                        })
                }
            ]
        };
    }
}

function pronunciation(phonetic: string): { phonetic: string; pronunciation: string; } {
    return {
        phonetic,
        pronunciation: `http://ipa-reader.xyz/?text=${encodeURIComponent(phonetic.replace(/'/g, '&apos;'))})`
    };
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
    }, { strict: false })),
    frequency: mapping.number,
    pronunciation: mapping.record(mapping.choice(mapping.in(undefined), mapping.string))
}, { strict: false });
