var e = module.exports = {};

var http = require('http');
const emoji = require('node-emoji');

e.init = () => {
    
    

    e.category = bu.CommandType.GENERAL;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'rr [bullets] [emote]';
e.info = 'Plays russian roulette with a specified number of bullets. If `emote` is specified, uses that specific emote.';
e.longinfo = `<p>Plays russian roulette with a specified number of bullets. If <code>emote</code> is specified, uses that specific emote.</p>`;

var numMap = ['zero', 'one', 'two', 'three', 'four', 'five'];

var mojiList =
    ':grinning: :grimacing: :joy: :smiley: :smile: :wink: :fearful: :persevere: :confounded: :tired_face: :triumph: :flushed: :neutral_face: :expressionless: :mask: :sob: :sleepy: :stuck_out_tongue_winking_eye: :blush: :smiley_cat:'
        .split(' ');

var deathMsg = [
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

var liveMsg = [
    'The gun clicks, empty. You get to live another day.',
    'You breath a sign of relief as you realize that you aren\'t going to die today.',
    'As if it would ever go off! Luck is on your side.',
    'You thank RNGesus as you lower the gun.',
    ':angel::pray::no_entry_sign::coffin::ok_hand::thumbsup::angel:',
    'You smirk as you realize you survived.'
];

e.execute = (msg, words) => {
    let bullets = parseInt(words[1]) || 1;
    if (isNaN(bullets)) {
        bullets = 1;
    }
    logger.debug(bullets);
    if (bullets == 6) {
        bu.send(msg.channel.id, 'Do you have a deathwish or something? Your revolver can only hold 6 bullets, that\'s guaranteed death!');
        return;
    } else if (bullets > 6) {
        bu.send(msg.channel.id, 'That\'s gutsy, but your revolver can only hold 6 bullets!');
        return;
    } else if (bullets <= 0) {
        bu.send(msg.channel.id, 'Wimp! You need to load at least one bullet.');
        return;
    }
    let dead = bu.getRandomInt(1, 6) <= bullets;
    let message = `You load ${bullets == 1 ? 'a' : numMap[bullets]} bullet${bullets == 1 ? '' : 's'} into your revolver, give it a spin, and place it against your head.`;
    bu.send(msg.channel.id, message).then(msg2 => {
        bu.send(msg.channel.id, `${words[2] || mojiList[bu.getRandomInt(0, mojiList.length - 1)]}:gun:`).then(msg3 => {
            setTimeout(() => {
                if (dead) {
                    bot.editMessage(msg2.channel.id, msg2.id, emoji.emojify(message + `\n***BOOM!*** ${deathMsg[bu.getRandomInt(0, deathMsg.length - 1)]}`));
                    bot.editMessage(msg3.channel.id, msg3.id, emoji.emojify(`:boom::gun:`));
                } else {
                    bot.editMessage(msg2.channel.id, msg2.id, emoji.emojify(msg2.content + `\n*Click!* ${liveMsg[bu.getRandomInt(0, liveMsg.length - 1)]}`));
                    bot.editMessage(msg3.channel.id, msg3.id, emoji.emojify(`:relieved::gun:`));
                }
            }, 4000);
        });
    });
};
