/**
 * @Author: RagingLink 
 * @Date: 2020-07-01 21:00:54
 * @Last Modified by: RagingLink
 * @Last Modified time: 2020-07-01 23:29:57
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = require('express').Router();

router.get('/', (req, res) => {
    res.locals.url = config.general.isbeta ? 'ws://localhost:8085' : 'wss://blargbot.xyz';

    res.render('shards');
});

router.get('/json', (req, res) => {
    res.type('json');
    res.send(JSON.stringify(spawner.shardCache, null, 2));
});

module.exports = router;