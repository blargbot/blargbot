const BaseCommand = require('../structures/BaseCommand');

var cah = {};
var cad = {};

class CahCommand extends BaseCommand {
    constructor() {
        super({
            name: 'cah',
            category: bu.CommandType.IMAGE,
            usage: 'cah',
            info: 'Generates a set of CAH cards.'
        });

        if (dep.fs.existsSync(dep.path.join(__dirname, '..', '..', 'res', 'cah.json'))) {
            cah = JSON.parse(dep.fs.readFileSync(dep.path.join(__dirname, '..', '..', 'res', 'cah.json'), 'utf8'));
        }

        dep.request('https://api.cardcastgame.com/v1/decks/JJDFG/cards', (err, res, body) => {
            try {
                let tempCad = JSON.parse(body);
                cad.black = tempCad.calls.map(m => {
                    return m.text.join('______');
                });
                cad.white = tempCad.responses.map(m => {
                    return m.text.join('______');
                });
            } catch (err) {
                console.log(err.stack);
            }
        });
    }

    async execute(msg, words, text) {
        let val = await bu.guildSettings.get(msg.channel.guild.id, 'cahnsfw');
        let cont = true;
        if (val && val != 0) {
            cont = await bu.isNsfwChannel(msg.channel.id);
        }

        if (cont) {
            doit(msg, words);
        } else
            bu.send(msg, config.general.nsfwMessage);
    }
}

module.exports = CahCommand;
