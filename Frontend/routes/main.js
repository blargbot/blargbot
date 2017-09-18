const router = require('express').Router();

router.get('/', (req, res, next) => {
    res.renderVue('main', {}, {});
});

module.exports = router;