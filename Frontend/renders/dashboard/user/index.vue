<template>
  <div>
    <h4>{{$t('website.dashboard.userheader')}}</h4>
      <div class="switch">
    <div class='col s12'>
      {{$t('website.dashboard.user.dmerrors')}}
    <label>
      Off
      <input type="checkbox">
      <span class="lever"></span>
      On
    </label>
    </div>
  </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data: () => ({ data: {} }),
  mounted() {
    axios
      .get("/api/user/settings")
      .then(res => {
        this.data = res.data;
      })
      .catch(err => {
        console.error(err);
      });
  }
};
</script>

<style scoped>

</style>
