const Airtable = require('airtable');
const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class RespondCommand extends BaseCommand {
    constructor(cluster) {
        super({
            name: 'respond',
            category: newbutils.commandTypes.SUPPORT
        });

        this.airtable = new Airtable({
            endpointUrl: 'https://api.airtable.com',
            apiKey: cluster.config.airtable.key
        }).base(cluster.config.airtable.base);
    }

    async execute(msg, words) {
        let support = (await r.table('vars').get('support')).value;
        if (support.includes(msg.author.id)) {
            if (words.length >= 3) {
                try {
                    let suggestion = await this.airtable('Suggestions').select({
                        maxRecords: 1,
                        filterByFormula: '{ID} = \'' + words[1] + '\''
                    }).firstPage();
                    suggestion = suggestion[0];
                    console.log(suggestion);

                    let author = await this.airtable('Suggestors').find(suggestion.fields.Author[0]);

                    let response = words.slice(2).join(' ');
                    let url = 'https://blargbot.xyz/feedback/' + suggestion.id;

                    await this.airtable('Suggestions').update(suggestion.id, {
                        Notes: `${response} (${msg.author.username}#${msg.author.discriminator})` + (suggestion.fields.Note ? '\n\n' + suggestion.fields.Note : '')
                    });
                    let message = `**Hi, <@${author.fields.ID}>!** You recently made this suggestion:

**${suggestion.fields.Title}**${suggestion.fields.Description ? '\n\n' + suggestion.fields.Description : ''}

**${msg.author.username}#${msg.author.discriminator}** has responded to your feedback with this:

${response}

If you have any further questions or concerns, please join my support guild so that they can talk to you directly. You can get a link by doing \`b!invite\`. Thanks for your time!

Your card has been updated here: <${url}>`;
                    console.log(suggestion.fields.Channel);
                    await bu.send(suggestion.fields.Channel, message);
                    bu.send(msg, 'Response successfully sent.');
                } catch (err) {
                    console.error(err);
                    bu.send(msg, 'An error has occured.');
                }
            }
        }
    }
}

module.exports = RespondCommand;
