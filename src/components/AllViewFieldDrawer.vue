<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-12-16 09:57
 * @LastAuthor : itchaox
 * @LastTime   : 2024-01-24 00:02
 * @desc       : 所有视图字段配置的抽屉
-->

<script setup lang="ts">
  import { bitable } from '@lark-base-open/js-sdk';

  import { toast } from 'vue-sonner';
  import FieldIcon from './fieldIcon.jsx';

  import { PreviewOpen, PreviewClose } from '@icon-park/vue-next';

  const base = bitable.base;

  import { useI18n } from 'vue-i18n';
  const { t } = useI18n();

  interface Props {
    modelValue: Boolean;
    selectViewIdList: string[];
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
            // isShow: true,
            status: 'default',
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

    for (const id of props.selectViewIdList) {
      const view = await table.getViewById(id);

      // 字段配置
      const _showFieldIdList = [];
      const _hideFieldIdList = [];

      fieldTableList.value.map((item) => {
        // if (item.isShow) {
        //   _showFieldIdList.push(item.id);
        // } else {
        //   _hideFieldIdList.push(item.id);
        // }

        if (item.status === 'show') {
          _showFieldIdList.push(item.id);
        } else if (item.status === 'hide') {
          _hideFieldIdList.push(item.id);
        }
      });

      await view.showField(_showFieldIdList);
      await view.hideField(_hideFieldIdList);
    }

    toast.success(t('Field Configuration Successful'));
    emits('confirmAddView');

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
      toast.warning(t('Please check the fields first'));
      return;
    }

    fieldTableList.value = fieldTableList.value.map((item) => {
      if (selectFieldIdList.value.includes(item.id)) {
        // item.isShow = true;
        item.status = 'show';
      }

      return item;
    });

    toast.success(t('Batch Display Configuration Success'));
  }

  function batchHide() {
    if (selectFieldIdList.value.length === 0) {
      toast.warning(t('Please check the fields first'));
      return;
    }

    fieldTableList.value = fieldTableList.value.map((item) => {
      if (selectFieldIdList.value.includes(item.id)) {
        // item.isShow = false;
        item.status = 'hide';
      }

      return item;
    });

    toast.success(t('Batch Hide Configuration Successful'));
  }

  function cancel() {
    reset();
  }

  function reset() {
    emits('update:model-value', false);

    fieldTableList.value = [];
    drawerLoading.value = false;
  }

  function handleMouseOver(row, action) {
    // 鼠标悬停时修改颜色
    row.hoverColor = 'rgb(20, 86, 240)';
  }

  function handleMouseOut(row, action) {
    // 鼠标移出时恢复初始颜色
    row.hoverColor = null;
    row.hoverHideColor = null;
  }

  function getIconColor(row, action) {
    // 获取按钮颜色，考虑悬停时的颜色
    return row.hoverColor || '#333';
  }

  function handleMouseOverHide(row, action) {
    // 鼠标悬停时修改颜色
    row.hoverHideColor = 'rgb(20, 86, 240)';
  }

  function getIconHideColor(row, action) {
    // 获取按钮颜色，考虑悬停时的颜色
    return row.hoverHideColor || '#333';
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
          {{ $t('Batch configure field hiding') }}
        </div>
        <el-button
          @mousedown="(e) => e.preventDefault()"
          type="danger"
          @click="close"
        >
          <el-icon class="el-icon--left"><CircleCloseFilled /></el-icon>
          {{ $t('Close') }}
        </el-button>
      </template>

      <div class="addView">
        <div class="collapse-line-list">
          <el-table
            max-height="65vh"
            :data="fieldTableList"
            @selection-change="handleSelectionChange"
            :empty-text="$t('no data')"
          >
            <el-table-column
              :selectable="selectable"
              type="selection"
              width="30"
            />

            <el-table-column :label="$t('field name')">
              <template #default="scope">
                <div
                  :title="scope?.row?.name"
                  class="view-name"
                  :style="{ color: scope.row.status === 'hide' ? '#bbbfc4' : '#1f2329' }"
                >
                  <field-icon :fieldType="scope?.row?.type" />
                  <span>
                    {{ scope?.row?.name }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              label="显示状态"
              align="center"
            >
              <template #default="scope">
                <div :title="scope?.row?.status">
                  <span
                    v-if="scope?.row?.status === 'default'"
                    style="color: #1f2329"
                    >默认</span
                  >
                  <span
                    v-if="scope?.row?.status === 'show'"
                    style="color: rgb(20, 86, 240)"
                    >显示</span
                  >
                  <span
                    v-if="scope?.row?.status === 'hide'"
                    style="color: #bbbfc4"
                    >隐藏</span
                  >
                </div>
              </template>
            </el-table-column>
            <el-table-column
              property="name"
              align="center"
              :label="$t('operation')"
            >
              <template #default="scope">
                <div class="operate">
                  <el-button
                    @mousedown="(e) => e.preventDefault()"
                    v-show="scope.$index !== 0"
                    type="danger"
                    link
                    @click="() => (scope.row.status = 'show')"
                  >
                    <preview-open
                      class="operate-btn"
                      theme="outline"
                      size="20"
                      strokeLinecap="square"
                      :fill="getIconColor(scope.row, 'show')"
                      @mouseover="handleMouseOver(scope.row, 'show')"
                      @mouseout="handleMouseOut(scope.row, 'show')"
                    />
                  </el-button>

                  <el-button
                    @mousedown="(e) => e.preventDefault()"
                    v-show="scope.$index !== 0"
                    type="danger"
                    link
                    @click="() => (scope.row.status = 'hide')"
                  >
                    <preview-close
                      class="operate-btn"
                      theme="outline"
                      size="20"
                      strokeLinecap="square"
                      :fill="getIconHideColor(scope.row, 'hide')"
                      @mouseover="handleMouseOverHide(scope.row, 'hide')"
                      @mouseout="handleMouseOut(scope.row, 'hide')"
                    />
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="button">
            <el-button
              @mousedown="(e) => e.preventDefault()"
              type="primary"
              @click="batchShow"
            >
              <preview-open
                theme="outline"
                size="20"
                strokeLinecap="square"
              />
              <span>{{ $t('batch display') }}</span>
            </el-button>

            <el-button
              @mousedown="(e) => e.preventDefault()"
              type="primary"
              @click="batchHide"
            >
              <preview-close
                theme="outline"
                size="20"
                strokeLinecap="square"
              />
              <span>{{ $t('Batch hide') }}</span>
            </el-button>
          </div>
        </div>

        <div>
          <el-button
            @mousedown="(e) => e.preventDefault()"
            type="primary"
            @click="confirmAddView"
            :loading="drawerLoading"
            >{{ $t('Confirm') }}</el-button
          >

          <el-button
            @mousedown="(e) => e.preventDefault()"
            type="info"
            @click="cancel"
            >{{ $t('Cancel') }}</el-button
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

  .operate {
    display: flex;
  }

  .operate-btn {
    padding: 1px 4px;
    cursor: pointer;
    &:hover {
      background-color: #3370ff1a;
    }
  }
</style>
