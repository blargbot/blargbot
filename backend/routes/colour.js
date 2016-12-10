const express = require('express');
const router = express.Router();
const Jimp = require('jimp');
const Canvas = require('canvas');


router.get('/:hex', async function(req, res) {
    while (req.params.hex.length > 6) req.params.hex = req.params.hex.substring(0, 6);
    let hex = Number('0x' + req.params.hex);
    if (isNaN(hex)) {
        res.status(400).json({
            error: 'That is not a hex code, you scrub!'
        });
        return;
    }
    let canvas = new Canvas(128, 128);
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = '#' + req.params.hex;
    ctx.fillRect(0, 0, 128, 128);
    let buf = canvas.toBuffer();
    logger.website(req.params.hex, hex, buf.length);

    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': buf.length
    });
    res.end(buf, 'binary');
});

module.exports = router;