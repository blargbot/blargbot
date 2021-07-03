const BaseCommand = require('../structures/BaseCommand');
const Wolken = require('wolken');
const newbutils = require('../newbu');

const actions = {
    awoo: {
        type: 1,
        text: 'awoos',
        desc: 'Awoooooooooo!'
    },
    bang: {
        type: 1,
        text: 'bangs',
        desc: 'Bang bang!'
    },
    blush: {
        type: 1,
        text: 'blushes',
        desc: 'Show everyone that you\'re blushing.'
    },
    cry: {
        type: 1,
        text: 'cries',
        desc: 'Show everyone that you\'re crying.'
    },
    cuddle: {
        type: 2,
        text: 'cuddles with',
        desc: 'Cuddle with someone.'
    },
    dance: {
        type: 1,
        text: 'dances',
        desc: 'Break out some sweet, sweet dance moves.'
    },
    hug: {
        type: 2,
        text: 'hugs',
        desc: 'Give somebody a hug.'
    },
    jojo: {
        type: 0,
        desc: 'This must be the work of an enemy stand!'
    },
    kiss: {
        type: 2,
        text: 'kisses',
        desc: 'Give someone a kiss!'
    },
    lewd: {
        type: 1,
        text: 'is lewd 😳',
        desc: 'T-that\'s lewd...'
    },
    lick: {
        type: 2,
        text: 'licks',
        desc: 'Give someone a lick. Sluurrpppp!'
    },
    megumin: {
        type: 0,
        desc: 'Darkness blacker than black and darker than dark, I beseech thee, combine with my deep crimson. The time of awakening cometh. Justice, fallen upon the infallible boundary, appear now as an intangible distortion! Dance, Dance, Dance! I desire for my torrent of power a destructive force: a destructive force without equal! Return all creation to cinders, and come from the abyss!'
    },
    nom: {
        type: 2,
        text: 'noms on',
        desc: 'Nom on somebody.'
    },
    owo: {
        type: 1,
        text: 'owos',
        desc: 'owo whats this?'
    },
    pat: {
        type: 2,
        text: 'pats',
        desc: 'Give somebody a lovely pat.'
    },
    poke: {
        type: 2,
        text: 'pokes',
        desc: 'Gives somebody a poke.'
    },
    pout: {
        type: 1,
        text: 'pouts',
        desc: 'Let everyone know that you\'re being pouty.'
    },
    rem: {
        type: 0,
        desc: 'Worst girl.'
    },
    shrug: {
        type: 1,
        text: 'shrugs',
        desc: 'Let everyone know that you\'re a bit indifferent.'
    },
    slap: {
        type: 2,
        text: 'slaps',
        desc: 'Slaps someone.'
    },
    sleepy: {
        type: 1,
        text: 'is sleepy',
        desc: 'Let everyone know that you\'re feeling tired.'
    },
    smile: {
        type: 1,
        text: 'smiles',
        desc: 'Smile!'
    },
    smug: {
        type: 1,
        text: 'is smug',
        desc: 'Let out your inner smugness.'
    },
    stare: {
        type: 1,
        text: 'stares',
        desc: 'Staaaaaaaaare'
    },
    thumbsup: {
        type: 1,
        text: 'gives a thumbs up',
        desc: 'Give a thumbs up!'
    },
    wag: {
        type: 1,
        text: 'wags',
        desc: 'Wagwagwagwag'
    },
    bite: {
        type: 2,
        text: 'bites',
        desc: 'Give someone a bite!'
    },
    punch: {
        type: 2,
        text: 'punches',
        desc: 'Punch someone. They probably deserved it.'
    }
};

let commands = [];

let usage = {
    0: '',
    1: '',
    2: '[user]'
};


for (const key in actions) {
    let action = actions[key];
    let command = class SocialCommand extends BaseCommand {
        constructor(cluster) {
            super({
                name: key,
                category: newbutils.commandTypes.SOCIAL,
                usage: key + ' ' + usage[action.type],
                info: action.desc
            });

            this.wolken = new Wolken(cluster.config.wolke, 'Wolke', 'blargbot/6.0.0');
        }

        static get name() {
            return key;
        }


        async request(type) {
            let res = await this.wolken.getRandom({ type, allowNSFW: false, filetype: 'gif' });
            return res.url;
        }

        async execute(msg, words, text) {
            let message;
            switch (action.type) {
                case 1:
                    message = `**${bu.getFullName(msg.author)}**  ${action.text}!`;
                    break;
                case 2:
                    let u2 = 'themself';
                    if (words.length > 1) {
                        let user = await bu.getUser(msg, words.slice(1).join(' '));
                        if (user) u2 = bu.getFullName(user);
                    }
                    message = `**${bu.getFullName(msg.author)}** ${action.text} **${u2}**!`;
                    break;
            }
            await bu.send(msg, {
                embed: {
                    description: message,
                    image: {
                        url: await request(key)
                    },
                    footer: {
                        text: 'Powered by weeb.sh'
                    }
                }
            });
        }
    };
    commands.push(command);
}

module.exports = commands;
