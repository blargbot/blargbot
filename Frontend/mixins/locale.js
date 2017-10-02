const enUs = require('../../Locale/en_us.json');

module.exports = {
    data: () => ({
        locale: {}
    }),
    methods: {
    },
    created: function () {
        console.log(enUs);
        this.locale = enUs;
    },
    beforeMount: function () {
        if (!localStorage.locale) localStorage.locale = 'en_us';

        if (Object.keys(this.locale).length === 0)
            axios.get('/locale/en_us.json').then(res => {
                this.locale = res.data;
                return axios.get(`/locale/${localStorage.locale}.json`);
            }).then(res => {
                Object.assign(this.locale, res.data);
            });
    }
};