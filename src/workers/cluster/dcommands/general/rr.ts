import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType, pluralise as p, randChoose, randInt } from '@cluster/utils';

export class RussianRouletteCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'rr',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{bullets:number=1} {emote?}',
                    description: 'Plays russian roulette with a specified number of bullets. If `emote` is specified, uses that specific emote.',
                    execute: (ctx, [bullets, emote]) => this.play(ctx, bullets, emote)
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
            users: context.author,
            prompt: `You load ${p(bullets, 'a', numMap[bullets])} ${p(bullets, 'bullet')} into your revolver, give it a spin, and place it against your head`,
            confirm: { label: 'Put the gun down', emoji: '😅' },
            cancel: { label: 'Pull the trigger', emoji: '😖' },
            fallback: true // "cancel" is the positive action here
        });

        if (query.prompt === undefined) {
            query.cancel();
            return this.error('Your revolver jams when you try to close the barrel. Maybe you should try somewhere else...');
        }

        const you = await context.reply(`${emote}🔫`);
        if (await query.getResult()) {
            await Promise.all([
                query.prompt.edit({ content: 'You chicken out and put the gun down', components: [] }),
                you?.edit('🐔')
            ]);
        } else if (randInt(1, 6) <= bullets) {
            await Promise.all([
                you?.edit('💥🔫'),
                query.prompt.edit({ content: `${query.prompt.content}\n***BOOM!*** ${randChoose(deathMsg)}`, components: [] })
            ]);
        } else {
            await Promise.all([
                you?.edit('😌🔫'),
                query.prompt.edit({ content: `${query.prompt.content}\n*Click!* ${randChoose(liveMsg)}`, components: [] })
            ]);
        }

        return undefined;
    }
}

const numMap = ['zero', 'one', 'two', 'three', 'four', 'five'] as const;
const mojiList = [
    '😀',
    '😬',
    '😂',
    '😃',
    '😄',
    '😉',
    '😨',
    '😣',
    '😖',
    '😫',
    '😤',
    '😳',
    '😐',
    '😑',
    '😷',
    '😭',
    '😪',
    '😜',
    '😊',
    '😺'
];
const deathMsg = [
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
];
const liveMsg = [
    'The gun clicks, empty. You get to live another day.',
    'You breath a sign of relief as you realize that you aren\'t going to die today.',
    'As if it would ever go off! Luck is on your side.',
    'You thank RNGesus as you lower the gun.',
    ':angel::pray::no_entry_sign::coffin::ok_hand::thumbsup::angel:',
    'You smirk as you realize you survived.'
];
