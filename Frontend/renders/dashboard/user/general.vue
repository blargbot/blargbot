<template>
  <div>
    General Settings {{data}}
  </div>
</template>

<script>
import axios from "axios";

export default {
  data: () => ({ data: "" }),
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
