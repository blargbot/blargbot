const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

const fonts = {
    arcena: 'ARCENA.ttf',
    arial: 'arial.ttf',
    animeace: 'animeace.ttf',
    annieuseyourtelescope: 'AnnieUseYourTelescope.ttf',
    comicjens: 'comicjens.ttf',
    impact: 'impact.ttf',
    sftoontime: 'SFToontime.ttf',
    delius: 'delius.ttf',
    indieflower: 'IndieFlower.ttf',
    roboto: 'Roboto-Regular.ttf',
    ubuntu: 'Ubuntu-Regular.ttf',
    comicsans: 'comicsans.ttf'
};

class CaptionCommand extends BaseCommand {
    constructor() {
        super({
            name: 'caption',
            category: newbutils.commandTypes.IMAGE,
            usage: 'caption [url] [flags]',
            info: 'Captions an image. If url isn\'t provided, you must give an attachment.',
            flags: [
                { flag: 't', word: 'top', desc: 'The top caption.' },
                { flag: 'b', word: 'bottom', desc: 'The bottom caption.' },
                {
                    flag: 'f',
                    word: 'font',
                    desc: 'The font to use (case insensitive). Use the command with the -l flag to view the available fonts. Defaults to impact.'
                },
                { flag: 'l', word: 'list', desc: 'Lists the available fonts.' }
            ],
            userRatelimit: true,
            channelRatelimit: true,
            cooldown: 5000
        });
    }

    async execute(msg, words, text) {
        let input = newbutils.parse.flags(this.flags, words);
        if (input.l) {
            let availFonts = Object.keys(fonts).sort().map(m => '**' + m.toUpperCase() + '**').join('\n - ');
            bu.send(msg, `Currently available fonts:\n - ${availFonts}`);
            return;
        }
        if ((!input.t || input.t.length == 0) && (!input.b || input.b.length == 0)) {
            bu.send(msg, 'You have to have at least one caption!');
            return;
        }
        if (!input.f) input.f = ['impact'];
        let font = fonts[input.f.join(' ').toLowerCase()];
        if (!font) font = fonts['impact'];
        bot.sendChannelTyping(msg.channel.id);
        let url;
        if (msg.attachments.length > 0) url = msg.attachments[0].url;
        else if (input.undefined.length > 0) url = input.undefined.join(' ');
        else {
            bu.send(msg, 'You must provide an image, either via url or attachment!');
            return;
        }
        if (/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(url)) {
            url = url.match(/(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/)[0];
        } else {
            bu.send(msg, 'That\'s not a valid url!');
            return;
        }
        let code = bu.genEventCode();
        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'caption',
            code: code,
            input: input,
            url,
            font
        });
        await bu.send(msg, undefined, {
            file: buffer,
            name: 'caption.jpeg'
        });
    }
}

module.exports = CaptionCommand;
