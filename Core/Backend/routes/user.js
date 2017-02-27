const router = dep.express.Router();



router.get('/:id', async function(req, res) {
    let id = req.params.id;
    let user = bot.users.get(id) || await bot.getRESTUser(id);
    res.locals.username = bu.getFullName(user);
    res.locals.gotUser = user;
    let nicks = bot.guilds.filter(g => g.members.get(id) && g.members.get(id).nick)
        .map(g => '<li class="collection-item blue-grey darken-3">' + g.members.get(id).nick + '</li>');
    res.locals.nicks = new dep.hbs.handlebars.SafeString(nicks.join('\n'));
    res.locals.createdAt = dep.moment(user.createdAt).format('lll');
    res.locals.user = req.user;
    req.session.returnTo = req.path;
    res.locals.shared = bot.guilds.filter(g => g.members.get(id)).length;

    res.render('user');
});
module.exports = router;