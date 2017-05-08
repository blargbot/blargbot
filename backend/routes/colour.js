/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:19:10
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:19:10
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = dep.express.Router();


router.get('/:hex', async function (req, res) {
    if (req.params.hex.length > 6) req.params.hex = req.params.hex.substring(0, 6);
    let hex = Number('0xff' + req.params.hex);
    if (isNaN(hex)) {
        res.status(400).json({
            error: 'That is not a hex code, you scrub!'
        });
        return;
    }
    let img = new dep.Jimp(128, 128, hex);
    img.getBuffer(dep.Jimp.MIME_JPEG, (err, buf) => {
        logger.website(req.params.hex, hex, buf.length);

        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': buf.length
        });
        res.end(buf, 'binary');

    });
});

module.exports = router;