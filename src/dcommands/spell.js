const BaseCommand = require('../structures/BaseCommand');
const jsonSpells = require('../../res/spells.json');
const { Collection } = require('eris');

const spells = new Collection(Object);
for (let key in jsonSpells) {
    let temp = jsonSpells[key];
    temp.id = key;
    spells.add(temp);
}
const components = {
    V: 'Verbal',
    S: 'Somantic',
    M: 'Material',
    F: 'Focus',
    DF: 'Divine Focus',
    XP: 'XP Cost'
};
const schools = {
    abjuration: 0x5fbae8,
    conjuration: 0x30e52d,
    divination: 0x100547,
    enchantment: 0xf79ee2,
    evocation: 0xff951c,
    illusion: 0x672cf9,
    necromancy: 0x1e0500,
    transmutation: 0xf2f259
};

class SpellCommand extends BaseCommand {
    constructor() {
        super({
            name: 'spell',
            category: bu.CommandType.GENERAL,
            usage: 'spell [name]',
            info: 'Gives you a description for a D&D 5e spell.'
        });
    }

    async execute(msg, words, text) {
        let spell;
        if (words.length == 1) {
            spell = spells.random();
        } else {
            let filteredSpells = spells.filter(m => {
                return m.id.toLowerCase().indexOf(words.slice(1).join(' ').toLowerCase()) > -1;
            });
            if (filteredSpells.length == 0) {
                bu.send(msg, 'Spell not found!');
                return;
            } else if (filteredSpells.length == 1) {
                spell = filteredSpells[0];
            } else {
                let moreFilters = filteredSpells.filter(m => m.id.toLowerCase() == words.slice(1).join(' ').toLowerCase());
                if (moreFilters.length == 1) {
                    spell = moreFilters[0];
                } else {
                    bu.send(msg, `Multiple spells found!\n\`\`\`${filteredSpells.map(m => m.id).join('\n')}\`\`\``);
                    return;
                }
            }
        }
        let colour = schools[spell.school.toLowerCase()] || 0xaaaaaa;
        let embed = {
            title: spell.id,
            color: colour,
            description: `*Level ${spell.level} ${spell.school}*

${spell.description}`,
            fields: [{
                name: 'Duration',
                value: spell.duration,
                inline: true
            }, {
                name: 'Range',
                value: spell.range,
                inline: true
            }, {
                name: 'Casting Time',
                value: spell.casting_time,
                inline: true
            }, {
                name: 'Components',
                value: spell.components.split(/,[\s]+/).map(m => {
                    return (components[m.split(' ')[0]] || m.split(' ')[0]) + ' ' + m.split(' ').slice(1).join(' ');
                }).join(', '),
                inline: true
            }]
        };
        bu.send(msg, {
            embed
        });
    }
}

module.exports = SpellCommand;
