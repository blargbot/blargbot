const { CatCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const superagent = require('superagent');

class EvalCommand extends CatCommand {
    constructor(client) {
        super(client, {
            name: 'poe',
            subcommands: {
                import: {},
                export: { aliases: ['sync'] }
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
        let res = await superagent.get('https://poeditor.com/api/webhooks/github')
            .query({
                api_token: args.api_token,
                id_project: args.id,
                language: 'en-us',
                operation: 'sync_terms_and_translations',
                overwrite_translations: 1,
                fuzzy_trigger: 1
            });

        return 'Terms have been exported from GitHub -> POEditor.';
    }

    async sub_import(ctx) {
        let args = {
            'api_token': _config.api.poeditor.key,
            'id': _config.api.poeditor.id
        };
        let res = await superagent.post('https://api.poeditor.com/v2/languages/list').type('form').send(args);
        if (res.body.response.status === 'success') {
            let langList = [];
            let failedList = [];
            let message = 'Importing languages from POEditor -> GitHub...\n\n';
            let msg2 = await ctx.send('Importing languages from POEditor -> GitHub...');
            for (const lang of res.body.result.languages) {
                if (lang.percentage >= 60) {
                    await msg2.edit(message + `Importing \`${lang.code}\` ${lang.name}`);
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
            await msg2.edit(message + `Exported the following languages:
${langList.map(l => ' - `' + l.code + '` ' + l.name + ' (' + l.percentage + '%)').join('\n')}

The following languages failed to export:
${failedList.map(l => ' - `' + l.code + '` ' + l.name + ' (' + l.percentage + '%) - ' + l.error).join('\n')}

You should do an update now.`);
        } else return 'Failed to use tha API: ' + JSON.stringify(res.body.response);
    }
}

module.exports = EvalCommand;