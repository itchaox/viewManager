<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-09-25 20:55
 * @LastAuthor : itchaox
 * @LastTime   : 2024-01-20 08:57
 * @desc       : 
-->
<script setup>
  import Form from './components/Form.vue';
  import { Toaster } from 'vue-sonner';
</script>

<template>
  <main>
    <!-- 消息提示 -->
    <Toaster
      position="top-center"
      richColors
      closeButton
      :duration="1500"
      :toastOptions="{
        style: { width: '50vw', margin: '0 auto' },
      }"
    />

    <Form />
  </main>
</template>

<style scoped>
  main {
    padding: 1rem;
    padding-top: 0;
    height: 95vh;
  }

  h4 {
    font-size: calc(1.275rem + 0.3vw);
    margin-bottom: 1rem;
  }
  code {
    font-size: 0.875em;
    color: #d63384;
    word-wrap: break-word;
  }
</style>
