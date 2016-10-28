const express = require('express');
const router = express.Router();
const path = require('path');
const hbs = require('hbs');


router.get('/', (req, res) => {
    res.render('tags');
});


router.get('/editor', (req, res) => {
    res.locals.startText = `{//;Start by typing an opening brace.
Documentation is available here: https://blargbot.xyz/tags/ }`;
    renderEditor(req, res);
});

router.post('/editor', (req, res) => {
    res.locals.startText = "you suck";
    renderEditor(req, res);
});

async function renderEditor(req, res) {
    if (req.body) {
        logger.debug(req.body);
        let tagName = req.body.tagName;
        if (tagName) {
            let tag = await bu.r.table('tag').get(tagName).run();
            logger.debug(tag);
            if (tag) res.locals.startText = tag.content;
        }
    }
    res.render('editor');
}

module.exports = router;