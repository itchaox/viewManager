<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-12-16 09:57
 * @LastAuthor : itchaox
 * @LastTime   : 2024-01-18 23:41
 * @desc       : 所有视图字段配置的抽屉
-->

<script setup lang="ts">
  import { bitable } from '@lark-base-open/js-sdk';
  import { Close } from '@element-plus/icons-vue';

  import { toast } from 'vue-sonner';
  import FieldIcon from './fieldIcon.jsx';

  import { PreviewOpen, PreviewClose } from '@icon-park/vue-next';

  const base = bitable.base;

  interface Props {
    modelValue: Boolean;
  }

  const props = defineProps<Props>();

  const emits = defineEmits(['update:model-value', 'confirmAddView']);

  let table;
  let view;

  // 字段列表
  const fieldList = ref([]);

  // 字段表格列表
  const fieldTableList = ref([]);

  // 处理字段表格
  watch(
    () => props.modelValue,
    async (newValue, _) => {
      if (newValue) {
        // const _visibleFieldIdList = await view.getVisibleFieldIdList();
        table = await base.getActiveTable();
        view = await table.getActiveView();
        fieldList.value = await view.getFieldMetaList();

        // 处理字段显示隐藏
        fieldTableList.value = fieldList.value.map((item) => {
          item = {
            ...item,
            isShow: true,
          };

          return item;
        });
      }
    },
  );

  onMounted(async () => {
    init();
  });

  base.onSelectionChange(async (event) => {
    init();
  });

  async function init() {
    table = await base.getActiveTable();
    view = await table.getActiveView();
    fieldList.value = await view.getFieldMetaList();
  }

  /**
   * @desc  : 确认新增视图
   */
  async function confirmAddView() {
    drawerLoading.value = true;

    // const view: any = 'a';
    const viewList = await table.getViewList();
    // debugger;
    for (const view of viewList) {
      // 字段配置
      const _showFieldIdList = [];
      const _hideFieldIdList = [];

      fieldTableList.value.map((item) => {
        if (item.isShow) {
          _showFieldIdList.push(item.id);
        } else {
          _hideFieldIdList.push(item.id);
        }
      });

      await view.showField(_showFieldIdList);
      await view.hideField(_hideFieldIdList);
      // debugger;
    }

    reset();
  }

  const drawerLoading = ref(false);

  const selectFieldIdList = ref([]);

  const handleSelectionChange = (val) => {
    selectFieldIdList.value = val?.map((item) => item.id);
  };

  function selectable(row, index) {
    // 第一个字段不能编辑
    if (index === 0) {
      return false;
    } else {
      return true;
    }
  }

  function batchShow() {
    if (selectFieldIdList.value.length === 0) {
      toast.warning('请先勾选字段');
      return;
    }

    fieldTableList.value = fieldTableList.value.map((item) => {
      if (selectFieldIdList.value.includes(item.id)) {
        item.isShow = true;
      }

      return item;
    });

    toast.success('批量显示配置成功');
  }

  function batchHide() {
    if (selectFieldIdList.value.length === 0) {
      toast.warning('请先勾选字段');
      return;
    }

    fieldTableList.value = fieldTableList.value.map((item) => {
      if (selectFieldIdList.value.includes(item.id)) {
        item.isShow = false;
      }

      return item;
    });

    toast.success('批量隐藏配置成功');
  }

  function cancel() {
    reset();
  }

  function reset() {
    emits('update:model-value', false);

    fieldTableList.value = [];
    drawerLoading.value = false;
  }
</script>

<template>
  <div>
    <el-drawer
      :model-value="modelValue"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @closed="cancel"
      :show-close="false"
      size="85%"
    >
      <template #header="{ close, titleId }">
        <div
          :id="titleId"
          class="header"
        >
          显示 / 隐藏所有视图字段
        </div>
        <el-button
          type="danger"
          @click="close"
          size="small"
        >
          <el-icon class="el-icon--left"><CircleCloseFilled /></el-icon>
          关闭
        </el-button>
      </template>

      <div class="addView">
        <div class="collapse-line-list">
          <el-table
            max-height="70vh"
            :data="fieldTableList"
            @selection-change="handleSelectionChange"
            empty-text="暂无数据"
          >
            <el-table-column
              :selectable="selectable"
              type="selection"
              width="30"
            />

            <el-table-column
              label="字段名字"
              :min-width="120"
            >
              <template #default="scope">
                <div
                  :title="scope?.row?.name"
                  class="view-name"
                  :style="{ color: scope.row.isShow ? '#1f2329' : '#bbbfc4' }"
                >
                  <field-icon :fieldType="scope?.row?.type" />
                  <span>
                    {{ scope?.row?.name }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              property="name"
              label="操作"
              width="60"
            >
              <template #default="scope">
                <el-button
                  v-show="scope.$index !== 0"
                  size="small"
                  type="danger"
                  link
                  @click="() => (scope.row.isShow = !scope?.row?.isShow)"
                >
                  <preview-open
                    v-if="scope.row.isShow"
                    theme="outline"
                    size="20"
                    fill="#333"
                    strokeLinecap="square"
                  />
                  <preview-close
                    v-else
                    theme="outline"
                    size="20"
                    fill="#333"
                    strokeLinecap="square"
                  />
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="button">
            <el-button
              type="primary"
              size="small"
              @click="batchShow"
            >
              <preview-open
                theme="outline"
                size="20"
                strokeLinecap="square"
              />
              <span>批量显示</span>
            </el-button>

            <el-button
              type="primary"
              size="small"
              @click="batchHide"
            >
              <preview-close
                theme="outline"
                size="20"
                strokeLinecap="square"
              />
              <span>批量隐藏</span>
            </el-button>
          </div>
        </div>

        <div>
          <el-button
            type="primary"
            @click="confirmAddView"
            :loading="drawerLoading"
            >确定</el-button
          >

          <el-button
            type="info"
            @click="cancel"
            >取消</el-button
          >
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
  .addView {
    /* margin: 10px 0; */
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

    .addView-line-labelDialog {
      width: 125px;
    }
  }

  .collapse {
    margin: 20px 0;
  }

  .collapse-title {
    margin-left: 5px;
    position: relative;
    bottom: 1px;
  }

  .collapse-line-list {
    margin-bottom: 30px;
  }

  .collapse-line {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    margin-bottom: 10px;
    height: 24px;
  }

  .collapse-line-filed {
    margin-right: 10px;
  }

  .collapse-line-other {
    width: 75%;
    display: flex;
    justify-content: flex-end;
  }

  .collapse-line-value {
    margin: 0 5px;
  }

  .collapse-delete {
    padding: 5px;
    height: 24px;
  }

  .sync {
    display: flex;
    align-items: center;
    font-size: 14px;
    margin-bottom: 10px;
    span {
      margin-right: 5px;
    }
  }

  .view-name-icon {
    position: relative;
    top: 2px;
  }

  .button {
    margin-top: 10px;

    span {
      margin-left: 5px;
    }
  }

  :deep(.el-collapse-item__content) {
    padding-bottom: 12px;
  }

  :deep(.el-drawer__header) {
    margin-bottom: 12px;
  }

  .header {
    color: rgb(20, 86, 240);
    font-weight: 500;
  }

  .cursor-move {
    cursor: grab;
  }

  .drag {
    display: flex;
    justify-content: center;
    align-items: center;

    .handle {
      position: relative;
      padding-top: 5px;
      margin-right: 10px;
    }
  }

  .drag2 {
    display: flex;
    justify-content: center;
    align-items: center;

    .handle2 {
      position: relative;
      padding-top: 5px;
      margin-right: 10px;
    }
  }

  .collapse-btn {
    width: 65px;
  }
</style>
