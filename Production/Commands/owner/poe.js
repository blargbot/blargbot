const { CatCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const superagent = require('superagent');

class EvalCommand extends CatCommand {
    constructor(client) {
        super(client, {
            name: 'poe',
            subcommands: {
                export: {}
            }
        });
    }

    async execute(ctx) {
        return 'do export dumby';
    }

    async sub_export(ctx) {
        let args = {
            'api_token': _config.api.poeditor.key,
            'id': _config.api.poeditor.id
        };
        let res = await superagent.post('https://api.poeditor.com/v2/languages/list').type('form').send(args);
        if (res.body.response.status === 'success') {
            let langList = [];
            let failedList = [];
            for (const lang of res.body.result.languages) {
                if (lang.percentage >= 60) {
                    try {
                        let res2 = await superagent.get('https://poeditor.com/api/webhooks/github')
                            .query({
                                api_token: args.api_token,
                                id_project: args.id,
                                language: lang.code,
                                operation: 'export_terms_and_translations'
                            });
                        langList.push(lang);
                    } catch (err) {
                        lang.error = err.message;
                        failedList.push(lang);
                    }
                }
            }
            return `Exported the following languages:
${langList.map(l => ' - ' + l.name + ' (' + l.percentage + '%)').join('\n')}

The following languages failed to export:
${failedList.map(l => ' - ' + l.name + ' (' + l.percentage + '%)').join('\n')}

You should do an update now.`;
        } else return 'Failed to use tha API: ' + JSON.stringify(res.body.response);
    }
}

module.exports = EvalCommand;