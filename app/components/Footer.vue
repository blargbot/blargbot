<template>
    <footer>
        <div class='footer-content'>
        &copy; 2016-{{year}} | stupid cat
        </div>
    </footer>
</template>

<script>
import moment from 'moment';

export default {
    computed: {
        year() {
            return moment().year();
        }
    }
};
</script>


<style lang="scss" scoped>
footer {
  padding: 20px;
  text-align: center;

  .footer-content {
    max-width: 780px;
    margin: 0 auto;
  }
}
</style>
