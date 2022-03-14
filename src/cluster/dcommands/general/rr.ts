import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType, pluralise as p, randChoose, randInt } from '@cluster/utils';

export class RussianRouletteCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'rr',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{bullets:integer=1} {emote?}',
                    description: 'Plays russian roulette with a specified number of bullets. If `emote` is specified, uses that specific emote.',
                    execute: (ctx, [bullets, emote]) => this.play(ctx, bullets.asInteger, emote.asOptionalString)
                }
            ]
        });
    }

    public async play(context: CommandContext, bullets: number, emote: string | undefined): Promise<string | undefined> {
        emote ??= randChoose(mojiList);
        if (bullets <= 0)
            return this.error('Wimp! You need to load at least one bullet.');
        if (bullets === 6)
            return this.warning('Do you have a deathwish or something? Your revolver can only hold 6 bullets, that\'s guaranteed death!');
        if (bullets > 6)
            return this.warning('That\'s gutsy, but your revolver can only hold 6 bullets!');

        const query = await context.util.createConfirmQuery({
            context: context.message,
            actors: context.author,
            prompt: `You load ${p(bullets, 'a', numMap[bullets])} ${p(bullets, 'bullet')} into your revolver, give it a spin, and place it against your head`,
            confirm: { label: 'Put the gun down', emoji: { name: '😅' } },
            cancel: { label: 'Pull the trigger', emoji: { name: '😖' } },
            fallback: true // "cancel" is the positive action here
        });

        if (query.prompt === undefined) {
            await query.cancel();
            return this.error('Your revolver jams when you try to close the barrel. Maybe you should try somewhere else...');
        }

        const you = await context.send(context.channel, `${emote}🔫`);
        if (await query.getResult()) {
            await Promise.all([
                query.prompt.edit({ content: `You chicken out and put the gun down.\n${randChoose(chickenMsg)}`, components: [] }),
                you?.edit('🐔')
            ]);
        } else if (randInt(1, 6) <= bullets) {
            await Promise.all([
                you?.edit('💥🔫'),
                query.prompt.edit({ content: `***BOOM!*** ${randChoose(deathMsg)}`, components: [] })
            ]);
        } else {
            await Promise.all([
                you?.edit('😌🔫'),
                query.prompt.edit({ content: `*Click!* ${randChoose(liveMsg)}`, components: [] })
            ]);
        }

        return undefined;
    }
}

const numMap = ['zero', 'one', 'two', 'three', 'four', 'five'] as const;
const mojiList = ['😀', '😬', '😂', '😃', '😄', '😉', '😨', '😣', '😖', '😫', '😤', '😳', '😐', '😑', '😷', '😭', '😪', '😜', '😊', '😺'
];
const deathMsg = [
    'The gun goes off, splattering your brains across the wall. Unlucky!',
    '☠️💥⚰️😵💀💀☠️',
    'Before you know it, it\'s all over.',
    'At least you had chicken!',
    'I\'m ***not*** cleaning that up.',
    'Guns are not toys!',
    'Well, you can\'t win them all!',
    'W-well... If every porkchop were perfect, we wouldn\'t have hotdogs? Too bad you\'re dead either way.',
    'Blame it on the lag!',
    'Today just wasn\'t your lucky day.',
    'Pssh, foresight is for losers.'
];
const liveMsg = [
    'The gun clicks, empty. You get to live another day.',
    'You breath a sign of relief as you realize that you aren\'t going to die today.',
    'As if it would ever go off! Luck is on your side.',
    'You thank RNGesus as you lower the gun.',
    '👼🙏🚫⚰️👌👍👼',
    'You smirk as you realize you survived.'
];
const chickenMsg = [
    'Maybe try again when youre not feeling so wimpy.',
    'Its ok, fun isnt for everyone!'
];
