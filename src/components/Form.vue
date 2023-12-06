<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-09-26 15:10
 * @LastAuthor : itchaox
 * @LastTime   : 2023-12-06 23:41
 * @desc       : 
-->
<script setup>
  import { bitable } from '@lark-base-open/js-sdk';
  import { nextTick, onMounted, ref, toRaw } from 'vue';

  const base = bitable.base;

  const viewList = ref();
  const table = ref();

  const selectViewIdList = ref([]);

  onMounted(async () => {
    getViewMetaList();
  });

  base.onSelectionChange(async () => {
    getViewMetaList();
  });

  async function getViewMetaList() {
    table.value = await base.getActiveTable();
    const viewList = await toRaw(table.value).getViewMetaList();
    handlerViewList(viewList);
  }

  function handlerViewList(_viewList) {
    viewList.value = _viewList.map((item) => ({ ...item, isEditing: false }));
  }

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
    selectViewIdList.value = val.map((item) => item.id);
  };

  /**
   * @desc  : 修改视图名
   * @param  {any} name 名字
   * @param  {any} id id
   */
  function handleFileName(name, id) {
    toRaw(table.value).setView(id, {
      name,
    });
  }

  /**
   * @desc  : 单个删除
   * @param  {any} index 索引
   * @param  {any} row 行数据
   */
  async function handleDelete(index, row) {
    await toRaw(table.value).deleteView(row.id);
    const viewList = await toRaw(table.value).getViewMetaList();
    handlerViewList(viewList);
  }

  /**
   * @desc  : 批量删除
   */
  async function batchDelete() {
    for (const id of selectViewIdList.value) {
      await toRaw(table.value).deleteView(id);
    }
    const viewList = await toRaw(table.value).getViewMetaList();
    handlerViewList(viewList);
  }

  // 编辑视图
  async function handleEdit(index, row) {
    console.log('🚀  row:', row);
    isEditing.value = true;
    activeButtonId.value = row.id;

    viewList.value = viewList.value.map((item) => {
      // viewList.value.map((item) => {
      if (item.id === row.id) {
        item.isEditing = true;
      }
      return item;
    });
    // 在下一轮事件循环中，将输入框聚焦
    nextTick(() => {
      editInput.value.focus();
    });
  }

  async function addView() {}

  const viewTypeList = ref([
    { value: 1, label: '表格视图' },
    { value: 2, label: '看板视图' },
    { value: 3, label: '表单视图' },
    { value: 4, label: '画册视图' },
    { value: 5, label: '甘特图视图' },
    // { value: 6, label: '层次结构视图' },
    { value: 7, label: '日历视图' },
    // { value: 100, label: '小部件视图' },
  ]);
  const newViewType = ref(1);
  const newViewName = ref();

  const isAdd = ref(false);

  async function confirmAddView() {
    const index = viewList.value.findIndex((item) => item.name === newViewName.value);
    if (index === -1) {
      await toRaw(table.value).addView({
        name: newViewName.value,
        type: newViewType.value,
      });

      const _viewList = await toRaw(table.value).getViewMetaList();
      handlerViewList(_viewList);
    } else {
      ElMessage({
        type: 'error',
        message: '视图名字已存在,请重新输入!',
      });
    }
  }

  function cancelAddView() {
    // 重置操作
    isAdd.value = false;
    newViewName.value = '';
    newViewType.value = 1;
  }

  // FIXME API 暂时不支持, 等支持了再做
  /**
   * @desc  : 修改视图类型
   * @param  {any} row
   * @param  {any} type
   * @return {any}
   */
  async function changeViewType(row, type) {
    await toRaw(table.value).setView({
      viewId: row.id,
      type: type,
    });

    viewList.value = await toRaw(table.value).getViewMetaList();
  }

  const isEditing = ref(false);

  /**
   * @desc  : 切换视图
   * @param  {any} row 行数据
   * @return {any}
   */
  async function switchView(row) {
    await bitable.ui.switchToView(toRaw(table.value).id, row.id);
  }

  const activeButtonId = ref();
  // 双击按钮开始编辑
  function startEditing(row) {
    // activeButtonId.value = row.id;
    // isEditing.value = true;
    viewList.value = viewList.value.map((item) => {
      // viewList.value.map((item) => {
      if (item.id === row.id) {
        item.isEditing = true;
      }
      return item;
    });
    console.log('🚀   viewList.value:', viewList.value);
    // debugger;
    // 在下一轮事件循环中，将输入框聚焦
    nextTick(() => {
      editInput.value.focus();
    });
  }

  // 结束编辑，例如在输入框失焦时调用
  function endEditing(row) {
    viewList.value = viewList.value.map((item) => {
      if (item.id === row.id) {
        item.isEditing = false;
      }
      return item;
    });

    activeButtonId.value = '';
    isEditing.value = false;
    // 在这里可以处理输入框的值
    // console.log('输入框的值:', this.inputValue);
  }

  const editInput = ref(null);

  function selectable(row, index) {
    // 第一个视图不能删除
    if (index === 0) {
      return false;
    } else {
      return true;
    }
  }
</script>

<template>
  <div class="field-manager">
    <div class="batch-button">
      <el-button
        @click="batchDelete"
        type="danger"
        size="small"
        >批量删除</el-button
      >
      <el-button
        @click="() => (isAdd = true)"
        type="primary"
        size="small"
        >新增视图</el-button
      >
    </div>
    <div
      class="addView"
      v-if="isAdd"
    >
      <div class="addView-line">
        <div class="addView-line-label">视图名称:</div>
        <el-input
          v-model="newViewName"
          size="small"
          placeholder="请输入视图名字"
          :prefix-icon="Search"
        />
      </div>

      <div class="addView-line">
        <div class="addView-line-label">视图类型:</div>
        <el-select
          v-model="newViewType"
          placeholder="请选择视图类型"
          size="small"
        >
          <el-option
            v-for="item in viewTypeList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>

      <div>
        <el-button
          type="primary"
          size="small"
          @click="confirmAddView"
          >确认</el-button
        >
        <el-button
          size="small"
          type="info"
          @click="cancelAddView"
          >取消</el-button
        >
      </div>
    </div>
    <el-table
      ref="multipleTableRef"
      :data="viewList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        :selectable="selectable"
        type="selection"
        width="30"
      />
      <el-table-column
        label="视图名字"
        :min-width="120"
      >
        <!-- <template #default="scope">{{ scope.row.name }}</template> -->
        <template #default="scope">
          <div :title="scope.row.name">
            <el-button
              v-show="!item?.isEditing && activeButtonId !== scope.row.id"
              @click="switchView(scope.row)"
              >{{ scope.row.name }}</el-button
            >
            <!-- FIXME 双击直接编辑暂时不做 @dblclick="startEditing(scope.row)" -->
            <el-input
              v-show="(item?.isEditing && isEditing) || activeButtonId === scope.row.id"
              ref="editInput"
              @blur="endEditing(scope.row)"
              :model-value="scope.row.name"
              @change="(value) => handleFileName(value, scope.row.id)"
              @input="(value) => (scope.row.name = value)"
            />
          </div>
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
            ><el-icon size="14"><Edit /></el-icon
          ></el-button>
          <!-- FIXME API 不支持修改视图类型, 等支持了再做 -->
          <!-- <el-dropdown trigger="click">
            <el-button
              size="small"
              @click="handleEdit(scope.$index, scope.row)"
              link
              ><el-icon size="14"><Edit /></el-icon
            ></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="item in viewTypeList"
                  :key="item.value"
                  @click="changeViewType(scope.row, item.value)"
                  >{{ item.label }}</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown> -->

          <el-button
            v-if="scope.$index !== 0"
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

  .batch-button {
    margin-bottom: 14px;
  }

  .addView {
    margin: 10px 0;
  }

  .addView-line {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    .addView-line-label {
      margin-right: 10px;
      font-size: 14px;
      white-space: nowrap;
    }
  }
</style>
