const express = require('express');
const router = express.Router();
const Jimp = require('jimp');

router.get('/:hex', async function(req, res) {
    while (req.params.hex.length > 6) req.params.hex = req.params.hex.substring(0, 6);
    let hex = Number('0x' + req.params.hex);
    if (isNaN(hex)) {
        res.status(400).json({
            error: 'That is not a hex code, you scrub!'
        });
        return;
    }
    let img = new Jimp(128, 128, hex);
    img.toBuffer(Jimp.MIME_PNG, (err, buff) => {
        logger.website(req.params.hex, hex, buf.length);

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': buf.length
        });
        res.end(buf, 'binary');

    })
});

module.exports = router;