/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:19:10
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-08 13:55:40
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = require('express').Router();

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

router.get('/:id', async function (req, res) {
    res.locals.user = req.user;

    let id = req.params.id.split('.');

    let output = await getOutput(id[0]);

    res.locals.msg = output;

    if (id[1]) {
        res.set('content-type', 'text/plain');
        res.end(output.content, 'utf8');
    } else
        res.render('output');
});

module.exports = router;