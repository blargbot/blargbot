<template>
  <div>
    <div class='row' v-if='$store.state.user != undefined'>
      <ul class='tabs col s12 tabs-fixed-width'>
        <li class='tab'>
          <router-link to='/dashboard/user' :class='active === "user" ? "active" : ""'>
            {{$t('website.dashboard.userheader')}}
          </router-link>
        </li>
        <li class='tab'>
          <router-link to='/dashboard/guild' :class='active === "guild" ? "active" : ""'>
            {{$t('website.dashboard.guildheader')}}
          </router-link>
        </li>
    </ul>
      <router-view></router-view>
    </div>
    <div v-else>
       <vue-markdown :source="$t('website.dashboard.notauthed')"></vue-markdown>
    </div>
  </div>
</template>

<script>
import VueMarkdown from "vue-markdown";

export default {
  data: () => ({
    active: ""
  }),
  components: { VueMarkdown },
  mounted() {
    $(document).ready(() => {
      $("ul.tabs").tabs();
    });
    this.active = this.$route.path.split("/")[2];
  }
};
</script>

<style scoped>

</style>
