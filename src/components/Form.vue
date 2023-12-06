<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-09-26 15:10
 * @LastAuthor : itchaox
 * @LastTime   : 2023-12-05 22:20
 * @desc       : 
-->
<script setup>
  import { bitable } from '@lark-base-open/js-sdk';
  import { onMounted, ref } from 'vue';

  const base = bitable.base;

  const fieldMetaList = ref();

  onMounted(async () => {
    const table = await base.getActiveTable();
    const view = await table.getActiveView();

    fieldMetaList.value = await view.getFieldMetaList();
    console.log('🚀  fieldMetaList.value:', fieldMetaList.value);
  });

  base.onSelectionChange(async () => {
    const table = await base.getActiveTable();
    const view = await table.getActiveView();
    fieldMetaList.value = await view.getFieldMetaList();
  });

  const multipleTableRef = ref();
  const multipleSelection = ref([]);
  const toggleSelection = (rows) => {
    if (rows) {
      rows.forEach((row) => {
        // TODO: improvement typing when refactor table
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        multipleTableRef.value.toggleRowSelection(row, undefined);
      });
    } else {
      multipleTableRef.value.clearSelection();
    }
  };
  const handleSelectionChange = (val) => {
    multipleSelection.value = val;
  };

  const tableData = [
    {
      date: '文本',
    },
    {
      date: '人员',
    },
    {
      date: '单选',
    },
  ];

  function handleFileName(value, id) {
    console.log(value, id);
  }
</script>

<template>
  <div class="field-manager">
    <div>字段管理器</div>
    <el-table
      ref="multipleTableRef"
      :data="fieldMetaList"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        type="selection"
        width="30"
      />
      <el-table-column label="字段名">
        <!-- <template #default="scope">{{ scope.row.name }}</template> -->
        <template #default="scope">
          <el-input
            :model-value="scope.row.name"
            @change="(value) => handleFileName(value, scope.row.id)"
            @input="(value) => (scope.row.name = value)"
            title=""
          />
        </template>
      </el-table-column>
      <el-table-column
        property="name"
        label="操作"
      >
        <template #default="scope">
          <el-button
            size="small"
            @click="handleEdit(scope.$index, scope.row)"
            link
            ><el-icon size="14"><View /></el-icon
          ></el-button>
          <el-button
            size="small"
            type="danger"
            link
            @click="handleDelete(scope.$index, scope.row)"
            ><el-icon size="16"><Delete /></el-icon
          ></el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
  .player {
    font-family: LarkHackSafariFont, LarkEmojiFont, LarkChineseQuote, -apple-system, BlinkMacSystemFont, Helvetica Neue,
      Tahoma, PingFang SC, Microsoft Yahei, Arial, Hiragino Sans GB, sans-serif, Apple Color Emoji, Segoe UI Emoji,
      Segoe UI Symbol, Noto Color Emoji;
    font-weight: 300;
  }
</style>
