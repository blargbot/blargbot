<template>
  <div>
    <div class='row'>
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
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  data: () => ({
    active: ""
  }),
  mounted() {
    $(document).ready(() => {
      $("ul.tabs").tabs();
    });
    this.active = this.$route.path.split("/")[2];
    console.log(this.$route);
  }
};
</script>

<style scoped>

</style>
