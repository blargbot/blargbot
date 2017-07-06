/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:19:37
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-07-05 22:18:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = dep.express.Router();

router.get('/', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = req.path;

    res.render('index');
});

router.get('/main', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = req.path;

    res.render('bsod-netneut');
})

router.get('/editor', (req, res) => {
    res.redirect('/tags/editor');
});
module.exports = router;