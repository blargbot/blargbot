const { CatCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const superagent = require('superagent');
const fs = require('fs');
const path = require('path');
const writeFile = util.promisify(fs.writeFile);

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
      let message = 'Importing languages from POEditor -> GitHub...\n\n';
      let msg2 = await ctx.send('Importing languages from POEditor -> GitHub...');
      for (const lang of res.body.result.languages) {
        if (lang.code === 'en-us') continue;
        if (lang.percentage >= 60) {
          try {
            let res2 = await superagent.post('https://api.poeditor.com/v2/projects/export').type('form').send({
              api_token: args.api_token,
              id: args.id,
              language: lang.code,
              type: 'key_value_json'
            });
            let code = lang.code.replace(/\-/g, '_');
            let res3 = await superagent.get(res2.body.result.url).buffer();
            await writeFile(path.join(__dirname, '..', '..', '..', 'Locale', code + '.json'), JSON.stringify(JSON.parse(res3.text), null, 2));
            msg2 = await msg2.edit(msg2.content + `\n:white_check_mark: Imported \`${code}\` ${lang.name} (${lang.percentage}%)`);

          } catch (err) {
            lang.error = err.message;
            msg2 = await msg2.edit(msg2.content + `\n:x: Failed \`${lang.code}\` ${lang.name} (${lang.percentage}%): ${err.message}`);
          }
        }
      }
      await msg2.edit(msg2.content + `\n\nImport complete!`);

      this.client.LocaleManager.init();

    } else return 'Failed to use tha API: ' + JSON.stringify(res.body.response);
  }
}

module.exports = EvalCommand;