const express = require('express');
const router = express.Router();
const path = require('path');
const hbs = require('hbs');
const moment = require('moment');

router.get('/', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = '/tags' + req.path;
    res.render('tags');
});

router.get('/variables', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = '/tags' + req.path;
    res.render('variables');
});

router.get('/arrays', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = '/tags' + req.path;
    res.render('arrays');
});


router.get('/editor', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = '/tags' + req.path;

    res.locals.startText = `{//;Start by typing an opening brace.
Documentation is available here: https://blargbot.xyz/tags/ }`;
    renderEditor(req, res);
});

router.post('/editor', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = '/tags' + req.path;
    res.locals.startText = `{//;Start by typing an opening brace.
Documentation is available here: https://blargbot.xyz/tags/ }`;
    renderEditor(req, res);
});

async function renderEditor(req, res) {
    if (!req.user) {
        res.locals.message = 'You are not logged in. In order to use the save, rename, and delete features, please log in! \nNote: this will delete any work done in the editor.';
        res.redirect('/login');
        return;
    }
    if (req.body && req.body.action) {
        logger.website('Tag editor:', req.body);
        let title, storedTag;
        switch (req.body.action) {
            case 'load':
                logger.website(req.body);
                let tagName = req.body.tagName;
                if (tagName) {
                    let tag = await r.table('tag').get(tagName).run();
                    logger.website(tag);
                    if (tag) res.locals.startText = tag.content;
                }
                res.locals.tagName = req.body.tagName;
                break;
            case 'save':
                res.locals.startText = req.body.content;
                res.locals.tagName = req.body.tagName;
                title = req.body.tagName.replace(/[^\d\w .,\/#!$%\^&\*;:{}=\-_~()@\[\]]/gi, '');
                if (title == '') {
                    res.locals.error = 'Blank is not a name!';
                } else {
                    storedTag = await r.table('tag').get(title).run();
                    if (storedTag) {
                        if (storedTag.author != req.user.id)
                            res.locals.error = 'You do not own this tag!';
                        else {
                            await r.table('tag').get(title).update({
                                content: req.body.content,
                                lastmodified: r.now()
                            }).run();
                            res.locals.message = 'Your tag has been edited! It has been saved as \'' + title + '\'.';
                            logChange(req.user, 'Edit (WI)', {
                                user: `${req.user.username} (${req.user.id})`,
                                tag: title,
                                content: req.body.content
                            });
                        }
                    } else {
                        await r.table('tag').get(title).replace({
                            name: title,
                            author: req.user.id,
                            content: req.body.content,
                            lastmodified: r.now(),
                            uses: 0
                        }).run();
                        res.locals.message = 'Your tag has been created! It has been saved as \'' + title + '\'.';
                        logChange(req.user, 'Create (WI)', {
                            user: `${req.user.username} (${req.user.id})`,
                            tag: title,
                            content: req.body.content
                        });
                    }
                }
                break;
            case 'rename':
                res.locals.startText = req.body.content;
                res.locals.tagName = req.body.tagName;
                title = req.body.tagName.replace(/[^\d\w .,\/#!$%\^&\*;:{}=\-_~()@\[\]]/gi, '');
                let newTitle = req.body.newname.replace(/[^\d\w .,\/#!$%\^&\*;:{}=\-_~()@\[\]]/gi, '');
                if (newTitle == '') {
                    res.locals.error = 'Blank is not a name!';
                } else {
                    storedTag = await r.table('tag').get(title).run();
                    if (storedTag) {
                        if (storedTag.author != req.user.id)
                            res.locals.error = 'You do not own this tag!';
                        else {
                            let otherStoredTag = await r.table('tag').get(newTitle).run();
                            if (otherStoredTag)
                                res.locals.error = 'There is already a tag with that name!';
                            else {
                                storedTag.name = newTitle;
                                await r.table('tag').insert(storedTag).run();
                                await r.table('tag').get(title).delete().run();
                                res.locals.message = 'Tag successfully renamed to \'' + newTitle + '\'. Note: Only the name has changed. You still need to save if you made changes to the contents.';
                                res.locals.tagName = newTitle;
                                logChange(req.user, 'Rename (WI)', {
                                    user: `${req.user.username} (${req.user.id})`,
                                    oldName: title,
                                    newName: newTitle
                                });
                            }
                        }
                    } else {
                        res.locals.error = 'You cannot rename a tag that doesn\'t exist!';
                    }
                }
                break;
            case 'delete':
                res.locals.startText = req.body.content;
                res.locals.tagName = req.body.tagName;
                title = req.body.tagName.replace(/[^\d\w .,\/#!$%\^&\*;:{}=\-_~()@\[\]]/gi, '');

                storedTag = await r.table('tag').get(title).run();
                if (storedTag) {
                    if (storedTag.author != req.user.id)
                        res.locals.error = 'You do not own this tag!';
                    else {
                        await r.table('tag').get(title).delete().run();
                        res.locals.startText = '';
                        res.locals.tagName = '';
                        res.locals.message = 'Tag successfully deleted! It\'s gone forever!';
                        logChange(req.user, 'Delete (WI)', {
                            user: `${req.user.username} (${req.user.id})`,
                            tag: title,
                            content: req.body.content
                        });
                    }
                } else {
                    res.locals.error = 'You cannot delete a tag that doesn\'t exist!';
                }
                break;
        }

    }
    res.render('editor');
}

/*function logChange(req.user, action, actionObj) {
    let output = `**__${action}__**\n`;
    let actionArray = [];
    for (let key in actionObj) {
        actionArray.push(`  **${key}**: ${actionObj[key]}`);
    }
    bu.send('230810364164440065', output + actionArray.join('\n'));
}*/

async function logChange(user, action, actionObj) {
    user = await bot.getRESTUser(user.id);
    let actionArray = [];
    for (let key in actionObj) {
        if (actionObj[key].length > 1000) actionObj[key] = actionObj[key].substring(0, 1000) + '... (too long)';
        actionArray.push({
            name: key,
            value: actionObj[key],
            inline: true
        });
    }
    let color = 0x000000;
    switch (action.split(' ')[0].toLowerCase()) {
        case 'create':
            color = 0x0eed24;
            break;
        case 'edit':
            color = 0x6b0eed;
            break;
        case 'delete':
            color = 0xf20212;
            break;
        case 'rename':
            color = 0x02f2ee;
            break;
    }
    bu.send('230810364164440065', {
        embed: {
            title: action,
            color: color,
            fields: actionArray,
            author: {
                name: bu.getFullName(user),
                icon_url: user.avatarURL,
                url: `https://blargbot.xyz/user/${user.id}`
            },
            timestamp: moment(),
            footer: {
                text: 'Web Interface'
            }
        }
    });
}

module.exports = router;