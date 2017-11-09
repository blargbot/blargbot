const { GeneralCommand } = require('../../../Core/Structures/Command');
const moment = require('moment');

class RussianRouletteCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'rr',
            info: 'Plays a game of russian roulette. By default, your revolver can hold 6 bullets.',
            usage: '[bullets]',
            aliases: ['russianroulette'],
            flags: [
                { flag: 'c', name: 'capacity', info: 'Sets how many bullets your revolver can hold.' },
                { flag: 'e', name: 'emote', info: 'Specifies what emote (or text) should be the one playing russian roulette.' }
            ],
            keys: {
                liveMessages: {
                    key: '.livemessages', value: [
                        'The gun clicks, empty. You get to live another day.',
                        'You breath a sign of relief as you realize that you aren\'t going to die today.',
                        'As if it would ever go off! Luck is on your side.',
                        'You thank RNGesus as you lower the gun.',
                        ':angel::pray::no_entry_sign::coffin::ok_hand::thumbsup::angel:',
                        'You smirk as you realize you survived.'
                    ]
                },
                deathMessages: {
                    key: '.deathmessages', value: [
                        'The gun goes off, splattering your brains across the wall. Unlucky!',
                        ':skull_crossbones::boom::coffin::dizzy_face::skull::skull::skull_crossbones:',
                        'Before you know it, it\'s all over.',
                        'At least you had chicken!',
                        'I\'m ***not*** cleaning that up.',
                        'Guns are not toys!',
                        'Well, you can\'t win them all!',
                        'W-well... If every porkchop were perfect, we wouldn\'t have hotdogs? Too bad you\'re dead either way.',
                        'Blame it on the lag!',
                        'Today just wasn\'t your lucky day.',
                        'Pssh, foresight is for losers.'
                    ]
                },
                capacityLow: {
                    key: '.capacitylow', value: 'Your revolver must be able to hold at least two bullets, any lower would be guaranteed death!'
                },
                bulletsLow: {
                    key: '.bulletslow', value: 'You can\'t load less than one bullet, you wimp.'
                },
                bulletsHigh: {
                    key: '.bulletshigh', value: 'Whoa, your revolver can only hold {{capacity}} bullets! That would be guaranteed death! Do you have a deathwish or something?'
                },
                begin: {
                    key: '.begin', value: 'You load {{bullets}} bullet(s) into your {{capacity}}-shot revolver, give it a spin, and place it against your head.'
                },
                death: { key: '.death', value: '{{content}}\n\n***BOOM!*** [[command.general.rr.deathmessages]]' },
                life: { key: '.life', value: '{{content}}\n\n*Click!* [[command.general.rr.livemessages]]' }
            }
        });

        this.deathwish = {};
    }

    get emote() {
        return this.client.Helpers.Random.choose([':grinning:', ':grimacing:', ':joy:', ':smiley:',
            ':smile:', ':wink:', ':fearful:', ':persevere:',
            ':confounded:', ':tired_face:', ':triumph:', ':flushed:',
            ':neutral_face:', ':expressionless:', ':mask:', ':sob:',
            ':sleepy:', ':stuck_out_tongue_winking_eye:', ':blush:', ':smiley_cat:']);
    }

    async doDeathwish(ctx, code, args) {
        if (!this.deathwish[ctx.author.id])
            this.deathwish[ctx.author.id] = [];
        this.deathwish[ctx.author.id].push(moment());

        for (const wish of this.deathwish[ctx.author.id]) {
            if (moment.duration(moment() - wish).asMinutes() > 1)
                this.deathwish[ctx.author.id].shift();
            else break;
        }
        if (this.deathwish[ctx.author.id].length >= 5) {
            this.deathwish[ctx.author.id].length = 0;
            return '**<https://suicideprevention.ca/need-help/>**\n\nhttps://media.giphy.com/media/l4Ki2obCyAQS5WhFe/giphy.gif';
        } else {
            return await ctx.decodeAndSend(code, args);
        }
    }

    async execute(ctx) {
        let capacity = parseInt((ctx.input.c || { raw: [] }).raw.join(''));
        if (isNaN(capacity)) capacity = 6;
        if (capacity < 2)
            return await this.doDeathwish(ctx, this.keys.capacityLow);

        let bullets = parseInt(ctx.input._.raw.join(''));
        if (isNaN(bullets)) bullets = 1;
        if (bullets <= 0)
            return await ctx.decodeAndSend(this.keys.bulletsLow);
        else if (bullets >= capacity)
            return await this.doDeathwish(ctx, this.keys.bulletsHigh, { capacity });

        let emote = ctx.input.e ? ctx.input.e.raw.join('') : this.emote;
        let dead = this.client.Helpers.Random.randInt(1, capacity) <= bullets;
        let msg1 = await ctx.decodeAndSend(this.keys.begin, { bullets, capacity });
        let msg2 = await ctx.send(emote + ':gun:');
        await this.sleep(4000);
        await msg1.edit(await ctx.decode(dead ? this.keys.death : this.keys.life, { content: msg1.content }));
        if (dead)
            await msg2.edit(':boom::gun:');
        else {
            if (!ctx.input.e)
                await msg2.edit(':relieved::gun:');
        }
        return msg1;
    }

    sleep(time = 1000) {
        return new Promise(res => {
            setTimeout(res, time);
        });
    }
}

module.exports = RussianRouletteCommand;