/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:19:10
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-13 08:48:14
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = require('express').Router();
const showdown = require('showdown');
const converter = new showdown.Converter();
converter.setFlavor('github');
converter.setOption('disableForced4SpacesIndentedSublists', true);
const xss = require('xss');
const hbs = require('hbs');
const moment = require('moment-timezone');

async function getOutput(id) {
    let m = await bu.cclient.execute(`SELECT * FROM message_outputs WHERE id = :id`, {
        id
    }, { prepare: true });

    return m.rows[0];
}

router.get('/:id/raw', async function (req, res) {
    let id = req.params.id.split('.');
    let output = await getOutput(id[0]);
    res.set('content-type', 'text/plain');
    res.send(output.content);
});

let whiteList = xss.whiteList;
for (let i = 1; i < 7; i++) {
    whiteList['h' + i].push('id');
}

router.get('/:id', async function (req, res) {
    res.locals.user = req.user;

    let id = req.params.id.split('.');

    let output = await getOutput(id[0]);

    if (id[1] === 'txt') {
        res.set('content-type', 'text/plain');
        res.end(output.content, 'utf8');
    } else {
        let date = moment(bu.unmakeSnowflake(output.id)).add(7, 'days');
        let diff = moment.duration(-1 * (moment() - date));
        output.expiry = date.tz('etc/utc').format('MMMM Do, YYYY')
        output.diff = diff.humanize(true);

        if (output.content) {
            let html = converter.makeHtml(output.content);
            html = xss(html, {
                whiteList
            });
            output.content = html;
        }

        res.locals.msg = output;
        res.render('output');
    }
});

module.exports = router;