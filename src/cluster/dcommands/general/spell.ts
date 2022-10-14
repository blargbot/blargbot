import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, guard, randChoose } from '@blargbot/cluster/utils';
import spellsJson from '@blargbot/res/spells.json';

import templates, { literal } from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.spell;

export class SpellCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `spell`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: `{name?}`,
                    description: cmd.default.description,
                    execute: (ctx, [name]) => this.getSpell(ctx, name.asOptionalString)
                }
            ]
        });
    }

    public async getSpell(context: CommandContext, name: string | undefined): Promise<CommandResult> {
        const spell = name === undefined ? randChoose(Object.values(spells)) : await this.#findSpell(context, name);
        if (spell === undefined)
            return cmd.default.notFound;

        const normSchool = spell.school.toLowerCase();
        const components = spell.components
            .split(/,\s*/g)
            .map(c => ({ component: c, norm: c.toLowerCase() }))
            .map(c => componentKeys.has<string>(c.norm) ? componentMap[c.norm] : c.component)
            .join(`, `);

        return {
            embeds: [
                {
                    title: literal(spell.name),
                    color: schoolKeys.has<string>(normSchool) ? schools[normSchool] : undefined,
                    description: cmd.default.embed.description({
                        level: literal(spell.level),
                        description: literal(spell.desc),
                        school: literal(spell.school)
                    }),
                    fields: [
                        {
                            name: cmd.default.embed.field.duration.name,
                            value: literal(spell.duration),
                            inline: true
                        },
                        {
                            name: cmd.default.embed.field.range.name,
                            value: literal(spell.range),
                            inline: true
                        },
                        {
                            name: cmd.default.embed.field.castingTime.name,
                            value: literal(spell.casting_time),
                            inline: true
                        },
                        {
                            name: cmd.default.embed.field.components.name,
                            value: literal(components),
                            inline: true
                        }
                    ]
                }
            ]
        };
    }

    async #findSpell(context: CommandContext, name: string): Promise<typeof spellsJson[number] | undefined> {
        const exact = spells[name.toLowerCase()];
        if (exact !== undefined)
            return exact;

        const result = await context.queryChoice({
            context: context.message,
            actors: context.author,
            prompt: cmd.default.query.prompt,
            placeholder: cmd.default.query.placeholder,
            choices: Object.values(spells)
                .filter(guard.hasValue)
                .filter(s => s.name.toLowerCase().includes(name.toLowerCase()))
                .map(s => ({
                    label: literal(s.name),
                    description: cmd.default.query.choice.description({
                        level: literal(s.level),
                        school: literal(s.school)
                    }),
                    value: s
                }))
        });

        return result.state === `SUCCESS` ? result.value : undefined;
    }
}

const spells: Record<string, typeof spellsJson[number] | undefined> = {};
for (const spell of spellsJson) {
    spells[spell.name.toLowerCase()] = {
        ...spell,
        desc: spell.desc
            .replace(/<\/?p>/gi, `\n`)
            .replace(/<\/?br>/gi, `\n\n`)
            .replace(/\n{3,}/, `\n\n`)
            .replace(/<\/?b>/gi, `**`)
            .trim()
    };
}

const componentMap = {
    v: `Verbal`,
    s: `Somantic`,
    m: `Material`,
    f: `Focus`,
    df: `Divine Focus`,
    xp: `XP Cost`
} as const;
const componentKeys = new Set(Object.keys(componentMap));

const schools = {
    abjuration: 0x5fbae8,
    conjuration: 0x30e52d,
    divination: 0x100547,
    enchantment: 0xf79ee2,
    evocation: 0xff951c,
    illusion: 0x672cf9,
    necromancy: 0x1e0500,
    transmutation: 0xf2f259
} as const;
const schoolKeys = new Set(Object.keys(schools));
