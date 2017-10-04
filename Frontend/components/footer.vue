<template>
    <footer class='page-footer'>
        <div class='container'>
            <div class='row'>
                <div class='col s12'>
                    <span class='grey-text text-lighten-2'>Cat Fact:</span> {{fact}}
                </div>
            </div>
        </div>
        <div class="footer-copyright">
            <div class="container">
                © 2016-2017 stupid cat
            </div>
        </div>
    </footer>
</template>

<script>
import axios from 'axios';

export default {
    data: () => ({
        fact: ''
    }),
    methods: {
    },
    mounted() {
        axios.get('/api/catfact').then(res => {
            this.fact = res.data;
        }).catch(err => {
            console.error(err);
        });
    }
};
</script>

<style scoped>

</style>