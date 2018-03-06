/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:36:29
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:37:14
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('emoji')
    .withArgs(a => [a.require('text'), a.optional('amount')])
    .withDesc('Gets `amount` (or 5 if `amount` isn\'t specified) emojis related to `text`. There\'s a limit of 10 emojis.')
    .withExample(
      '{emoji;I am hungry;5}',
      '🍔 🍕 😩 🍴 😐'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-3', async function(params) {
        let q = encodeURIComponent(params.args[1]);
        let amount = parseInt(params.args[2]) || parseInt(params.fallback);
        if (amount > 10) amount = 10;
        else if (amount < 1) amount = 1;
        let emojis = await new Promise((resolve, reject) => {
            dep.request(`https://emoji.getdango.com/api/emoji?q=${q}`, (req, res, body) => {
                body = JSON.parse(body);
                resolve(body.results.map(result => result.text));
            });
        });
        emojis.splice(amount);
        return emojis.join(' ');
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();