/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:19:10
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 01:08:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = require('express').Router();

router.get('/:hex', async function (req, res) {
    if (req.params.hex.length > 6) req.params.hex = req.params.hex.substring(0, 6);
    let hex = Number('0x' + req.params.hex + 'ff');
    if (isNaN(hex)) {
        res.status(400).json({
            error: 'That is not a hex code, you scrub!'
        });
        return;
    }
    let code = bu.genEventCode();

    let buf = await bu.awaitEvent({
        cmd: 'img',
        command: 'color',
        code: code,
        hex
    });
    res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': buf.length
    });
    res.end(buf, 'binary');
});

module.exports = router;
