import { GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, randChoose } from '@blargbot/cluster/utils';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.insult;

export class InsultCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `insult`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: `{name+}`,
                    description: cmd.someone.description,
                    execute: (_, [name]) => this.insult(`${name.asString}'s`)
                },
                {
                    parameters: ``,
                    description: cmd.default.description,
                    execute: () => this.insult(`Your`)
                }
            ]
        });
    }

    public insult(who: string): CommandResult {
        return `${who} ${randChoose(nouns)} ${randChoose(verbs)} ${randChoose(adjectives)}`;
    }
}

const verbs = [
    `smells like`,
    `looks like`,
    `is`,
    `sounds like`,
    `appears to be`,
    `wants to be`,
    `looks just like`,
    `smells oddly similar to`,
    `is jealous of`,
    `is as stupid as`,
    `laughs like`
];
const nouns = [
    `mother`,
    `mom`,
    `father`,
    `dad`,
    `goat`,
    `cheese`,
    `dick`,
    `boob`,
    `eye`,
    `mouth`,
    `nose`,
    `ear`,
    `sister`,
    `sis`,
    `brother`,
    `bro`,
    `seagull`,
    `tea`,
    `mother-in-law`,
    `rabbit`,
    `dog`,
    `cat`,
    `left foot`,
    `body`,
    `brain`,
    `face`,
    `favourite thing`
];
const adjectives = [
    `a piece of cheese`,
    `a smelly fish`,
    `jam`,
    `tea`,
    `a skunk`,
    `a fart`,
    `a piece of toast`,
    `my mom`,
    `your mom`,
    `my dad`,
    `your dad`,
    `my sister`,
    `your sister`,
    `my brother`,
    `your brother`,
    `my cat`,
    `my dog`,
    `my lizard`,
    `my seagull`,
    `gross`,
    `farts`,
    `ugly`,
    `Captain America`,
    `javascript`,
    `C#`,
    `LUA`,
    `python3.5`,
    `a furry`,
    `an anthropomorphic horse`,
    `a tentacle monster`,
    `fuck`,
    `meow`,
    `mississippi`,
    `the entire UK`,
    `Japan`,
    `anime`,
    `dickgirls`,
    `a really stupid cat`,
    `a sentient robot`,
    `teaching a robot to love`,
    `anime girls with really large boobs who want to eat all of your cream`,
    `salty`,
    `smegma`,
    `mouldy cheese`,
    `obesity`,
    `Donald Trump`,
    `stupid people`,
    `crabcakes`,
    `firepoles`,
    `blue waffle`,
    `a really bad random insult generators`,
    `a terrible AI`,
    `cleverbot`,
    `b1nzy`,
    `a drunken goblin`,
    `poorly censored porn`,
    `an egg left in the sun for too long`,
    `#BREXIT`,
    `leaving the EU`
];
