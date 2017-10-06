const { CatCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const superagent = require('superagent');
const fs = require('fs');
const path = require('path');
const writeFile = util.promisify(fs.writeFile);

class PoeCommand extends CatCommand {
    constructor(client) {
        super(client, {
            name: 'translation',
            aliases: ['trans', 'crowdin', 'poe'],
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
            'key': _config.api.crowdin.key
        };
        let res = await superagent.post('https://api.crowdin.com/api/project/blargbot/status').query(args).query({ json: true });
        let message = 'Importing languages from crowdin -> local...\n\n';
        let msg2 = await ctx.send(message);
        for (const lang of res.body) {
            if (!(ctx.input._[0] && ctx.input._[0] === 'en') && lang.code === 'en') continue;
            if (lang.translated_progress >= 0) {
                try {
                    let res2 = await superagent.post('https://api.crowdin.com/api/project/blargbot/export-file').query(args)
                        .query({
                            file: 'rewrite/Locale/en.json',
                            language: lang.code
                        });
                    console.log(res2.body);
                    let code = lang.code.replace(/\-/g, '_').toLowerCase();
                    let parsed = JSON.parse(res2.text);
                    if (code !== 'en_us')
                        parsed.specs.perc = lang.percentage;
                    await writeFile(path.join(__dirname, '..', '..', '..', 'Locale', code + '.json'), JSON.stringify(parsed, null, 2));
                    msg2 = await msg2.edit(msg2.content + `\n:white_check_mark: Imported \`${code}\` ${lang.name} (${lang.translated_progress}%)`);

                } catch (err) {
                    lang.error = err.message;
                    msg2 = await msg2.edit(msg2.content + `\n:x: Failed \`${lang.code}\` ${lang.name} (${lang.percentage}%): ${err.message}`);
                }
            }
        }
        await msg2.edit(msg2.content + `\n\nImport complete!`);

        this.client.LocaleManager.init();
    }
}

module.exports = PoeCommand;