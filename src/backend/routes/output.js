/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:19:10
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-08-07 10:06:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = require('express').Router();

router.get('/:id', async function (req, res) {
    res.locals.user = req.user;

    let id = req.params.id.split('.');

    let m = await bu.cclient.execute(`SELECT * FROM message_outputs WHERE id = :id`, {
        id: id[0]
    }, { prepare: true });

    res.locals.msg = m.rows[0];

    if (id[1]) {
        res.end(m.rows[0].content, 'utf8');
    } else
        res.render('output');
});

module.exports = router;