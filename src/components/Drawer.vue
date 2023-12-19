<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-12-16 09:57
 * @LastAuthor : itchaox
 * @LastTime   : 2023-12-20 00:25
 * @desc       : 抽屉
-->

<script setup lang="ts">
  import { bitable } from '@lark-base-open/js-sdk';
  import { Close } from '@element-plus/icons-vue';
  import {
    AllApplication,
    Calendar,
    AlignTopTwo,
    AlignRightTwo,
    GridNine,
    CheckCorrect,
    ApplicationMenu,
  } from '@icon-park/vue-next';

  const base = bitable.base;

  interface Props {
    modelValue: Boolean;
    getViewMetaList: () => {};
    viewList: any[];
  }

  const props = defineProps<Props>();

  const emits = defineEmits(['update:model-value']);

  let table;
  let view;

  // 字段列表
  const fieldList = ref([]);

  // 筛选的字段列表
  const filterFieldList = ref([]);

  // 分组的字段列表
  const groupFieldList = ref([]);

  // 排序的字段列表
  const sortFieldList = ref([]);

  // watch(
  //   () => props.modelValue,
  //   async (newValue, _) => {
  //     if (newValue) {
  //     }
  //   },
  // );

  onMounted(async () => {
    table = await base.getActiveTable();
    view = await table.getActiveView();
    fieldList.value = await view.getFieldMetaList();

    // 1 文本; 3 单选; 4多选; 11 人员; 18 单向关联; 23 群组
    filterFieldList.value = fieldList.value.filter((item) => [1, 3, 4].includes(item.type));
    groupFieldList.value = fieldList.value;
    sortFieldList.value = fieldList.value;
  });

  const addViewName = ref();
  const addViewType = ref(1);

  /**
   * @desc  : 确认新增视图
   */
  async function confirmAddView() {
    const index = props.viewList.findIndex((item) => item.view_name === addViewName.value);
    if (index === -1) {
      drawerLoading.value = true;
      const { viewId } = await table.addView({
        name: addViewName.value,
        type: addViewType.value,
      });
      const view = await table.getViewById(viewId);

      // addViewName.value = '';
      // addViewType.value = 1;
      // emits('update:model-value', false);

      ElMessage({
        type: 'success',
        message: '新增成功',
        duration: 1500,

        showClose: true,
      });

      // 筛选
      if (filterList.value?.length > 0) {
        // FIXME 多选时, 数组需要拷贝一下,否则会报错
        await view.addFilterCondition(
          filterList.value.map((item) => ({
            fieldId: item.id,
            value: Array.isArray(item.value) ? [...item.value] : item.value,
            operator: item.operator,
          })),
        );
        await view.setFilterConjunction(conjunction.value);
      }

      // 分组
      if (groupList.value?.length > 0) {
        await view.addGroup(
          groupList.value.map((item) => ({
            fieldId: item.id,
            desc: item.desc,
          })),
        );
      }

      // 筛选
      if (sortList.value?.length > 0) {
        await view.addSort(
          sortList.value.map((item) => ({
            fieldId: item.id,
            desc: item.desc,
          })),
        );
      }

      if (sync.value) {
        await view.applySetting();
      }

      // props.getViewMetaList();

      await bitable.ui.switchToView(table.id, viewId);

      // filterList.value = [];
      // collapse.value = '';
      // drawerLoading.value = false;
      // sync.value = false;
      reset();
    } else {
      ElMessage({
        type: 'error',
        message: '视图名字已存在,请重新输入!',
        duration: 1500,
        showClose: true,
      });
    }
  }

  function cancel() {
    reset();
  }

  function reset() {
    emits('update:model-value', false);

    addViewName.value = '';
    addViewType.value = 1;
    filterList.value = [];
    groupList.value = [];
    sortList.value = [];
    collapse.value = '';
    drawerLoading.value = false;
    sync.value = false;
  }

  // 查询类型下拉, 对齐 js-sdk
  const addViewTypeList = ref([
    { value: 1, label: '表格视图' },
    { value: 2, label: '看板视图' },
    { value: 3, label: '表单视图' },
    { value: 4, label: '画册视图' },
    { value: 5, label: '甘特视图' },
    { value: 7, label: '日历视图' },
  ]);

  // FIXME 筛选
  const filterList = ref([]);

  const addFilter = () => {
    filterList.value.push({
      id: filterFieldList.value?.[0]?.id,
      name: filterFieldList.value?.[0]?.name,
      type: filterFieldList.value?.[0]?.type,
      operator: 'is',
      value: '',
    });
  };

  const filterFiledChange = async (item, index) => {
    let _activeItem = filterFieldList.value.find((i) => i.id === item.id);

    // 文本项,不需要再掉数据
    if (_activeItem?.type === 1) {
      filterList.value[index] = {
        name: _activeItem.name,
        type: _activeItem.type,
        id: _activeItem.id,
        operator: 'is',
        value: '',
      };
    }

    if (_activeItem?.type === 3 || _activeItem?.type === 4) {
      // 单选/多选
      const selectField = await table.getField(item.id);
      let options = await selectField.getOptions();
      // 更新选项
      filterList.value[index] = {
        options,
        name: _activeItem.name,
        type: _activeItem.type,
        id: _activeItem.id,
        operator: 'is',
        value: '',
      };
    }
  };

  const conjunction = ref('and');

  const filterOperatorList = ref([
    {
      id: 'is',
      name: '等于',
    },
    {
      id: 'isNot',
      name: '不等于',
    },
    {
      id: 'contains',
      name: '包含',
    },
    {
      id: 'doesNotContain',
      name: '不包含',
    },
    {
      id: 'isEmpty',
      name: '为空',
    },
    {
      id: 'isNotEmpty',
      name: '不为空',
    },
  ]);

  const showInput = (type) => {
    return ['is', 'isNot', 'contains', 'doesNotContain'].includes(type);
  };

  // FIXME 分组
  const groupList = ref([]);

  const addGroup = () => {
    const idsInGroup = groupList.value.map((item) => item.id);
    const _list = groupFieldList.value.filter((item) => !idsInGroup.includes(item.id));

    if (_list?.[0]) {
      groupList.value.push({
        id: _list?.[0]?.id,
        name: _list?.[0]?.name,
        type: _list?.[0]?.type,
        desc: false,
      });
    }
  };

  const groupFiledChange = async (item, index) => {
    let _activeItem = groupFieldList.value.find((i) => i.id === item.id);

    groupList.value[index] = {
      name: _activeItem.name,
      type: _activeItem.type,
      id: _activeItem.id,
      desc: false,
    };
  };

  // FIXME 排序
  const sortList = ref([]);

  const addSort = () => {
    const idsInGroup = sortList.value.map((item) => item.id);
    const _list = sortFieldList.value.filter((item) => !idsInGroup.includes(item.id));

    if (_list?.[0]) {
      sortList.value.push({
        id: _list?.[0]?.id,
        name: _list?.[0]?.name,
        type: _list?.[0]?.type,
        desc: false,
      });
    }
  };

  const sortFiledChange = async (item, index) => {
    let _activeItem = sortFieldList.value.find((i) => i.id === item.id);

    sortList.value[index] = {
      name: _activeItem.name,
      type: _activeItem.type,
      id: _activeItem.id,
      desc: false,
    };
  };

  // 折叠面板
  const collapse = ref();

  const sync = ref(false);

  const drawerLoading = ref(false);

  /**
   * @desc  : 顺序
   * @param  {any} type：字段类型
   * @return {any} 文本
   */
  const getGroupTextOrder = (type) => {
    let textList = [1, 11, 13, 15, 17, 18, 19, 20, 21, 22, 23, 403, 1003, 1004, 99001];
    let numberList = [2, 5, 1001, 1002, 1005, 99002, 99003, 99004];
    let optionList = [3, 4, 7];

    let _text;
    if (textList.includes(type)) {
      _text = 'A → Z';
    } else if (numberList.includes(type)) {
      _text = '0 → 9';
    } else if (optionList.includes(type)) {
      _text = '顺序';
    } else {
      _text = 'A → Z';
    }

    return _text;
  };

  /**
   * @desc  : 倒序
   * @param  {any} type：字段类型
   * @return {any} 文本
   */
  const getGroupTextReverseOrder = (type) => {
    let textList = [1, 11, 13, 15, 17, 18, 19, 20, 21, 22, 23, 403, 1003, 1004, 99001];
    let numberList = [2, 5, 1001, 1002, 1005, 99002, 99003, 99004];
    let optionList = [3, 4, 7];

    let _text;
    if (textList.includes(type)) {
      _text = 'Z → A';
    } else if (numberList.includes(type)) {
      _text = '9 → 0';
    } else if (optionList.includes(type)) {
      _text = '倒序';
    } else {
      _text = 'Z → A';
    }
    return _text;
  };
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
        <div :id="titleId">新增视图</div>
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
        <div class="addView-line">
          <div class="addView-line-label theme-view-text-color">视图名字:</div>
          <el-input
            style="width: 160px"
            v-model="addViewName"
            size="small"
            placeholder="请输入视图名字"
          />
        </div>

        <div class="addView-line">
          <div class="addView-line-label theme-view-text-color">视图类型:</div>
          <el-select
            v-model="addViewType"
            placeholder="请选择视图类型"
            size="small"
            style="width: 160px"
          >
            <el-option
              v-for="item in addViewTypeList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
              <all-application
                v-if="item.value === 4"
                class="view-name-icon"
                theme="outline"
                size="14"
              />

              <calendar
                v-if="item.value === 7"
                class="view-name-icon"
                theme="outline"
                size="14"
                strokeLinejoin="bevel"
                strokeLinecap="square"
              />

              <align-top-two
                v-if="item.value === 2"
                class="view-name-icon"
                theme="outline"
                size="14"
              />

              <align-right-two
                v-if="item.value === 5"
                theme="outline"
                class="view-name-icon"
                size="14"
              />

              <grid-nine
                v-if="item.value === 1"
                theme="outline"
                class="view-name-icon"
                size="14"
                strokeLinejoin="bevel"
              />
              <check-correct
                v-if="item.value === 3"
                theme="outline"
                class="view-name-icon"
                size="14"
                strokeLinejoin="bevel"
              />
              {{ item.label }}
            </el-option>
          </el-select>
        </div>

        <el-collapse
          v-if="addViewType !== 3"
          v-model="collapse"
          class="collapse"
        >
          <!-- FIXME 筛选 -->
          <el-collapse-item name="1">
            <template #title>
              <el-icon><Filter /></el-icon>
              <span class="collapse-title">设置筛选条件</span>
            </template>
            <div v-if="filterList.length > 1">
              符合以下
              <el-select
                v-model="conjunction"
                size="small"
                style="width: 25%"
              >
                <el-option
                  key="and"
                  label="所有"
                  value="and"
                />
                <el-option
                  key="or"
                  label="任一"
                  value="or"
                />
              </el-select>
              条件
            </div>
            <div class="collapse-line-list">
              <div
                class="collapse-line"
                v-for="(item, index) in filterList"
                :key="item.id"
              >
                <!-- 字段名 -->
                <div class="collapse-line-filed">
                  <el-select
                    size="small"
                    v-model="item.id"
                    :title="item.name"
                    @change="filterFiledChange(item, index)"
                  >
                    <el-option
                      v-for="field in filterFieldList"
                      :key="field.id"
                      :label="field.name"
                      :title="field.name"
                      :value="field.id"
                    />
                  </el-select>
                </div>
                <div class="collapse-line-other">
                  <!-- 条件 -->
                  <el-select
                    v-model="item.operator"
                    size="small"
                  >
                    <el-option
                      v-for="item in filterOperatorList"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                  <!-- 值 -->
                  <div class="collapse-line-value">
                    <el-input
                      v-if="showInput(item.operator) && item.type === 1"
                      v-model="item.value"
                      size="small"
                      placeholder="请输入"
                    />

                    <!-- FIXME 多选操作,暂时有问题 -->
                    <el-select
                      v-if="showInput(item.operator) && item.type !== 1"
                      :multiple="item.type === 4"
                      :collapse-tags="item.type === 4"
                      :collapse-tags-tooltip="item.type === 4"
                      v-model="item.value"
                      size="small"
                      placeholder="请选择选项"
                    >
                      <el-option
                        v-for="j in item.options"
                        :key="j.id"
                        :label="j.name"
                        :value="j.id"
                      />
                    </el-select>
                  </div>
                  <el-button
                    :icon="Close"
                    class="collapse-delete"
                    @click="() => filterList.splice(index, 1)"
                    text
                  />
                </div>
              </div>
            </div>
            <el-button
              text
              @click="addFilter"
            >
              <el-icon><Plus /></el-icon>添加条件
            </el-button>
          </el-collapse-item>

          <!-- FIXME 分组 -->
          <el-collapse-item
            name="2"
            v-if="addViewType === 1 || addViewType === 5"
          >
            <template #title>
              <el-icon><SetUp /></el-icon>
              <span class="collapse-title">设置分组条件</span>
            </template>
            <div class="collapse-line-list">
              <div
                class="collapse-line"
                v-for="(item, index) in groupList"
                :key="item.id"
              >
                <!-- 字段名 -->
                <div class="collapse-line-filed">
                  <el-select
                    size="small"
                    v-model="item.id"
                    :title="item.name"
                    @change="groupFiledChange(item, index)"
                  >
                    <el-option
                      v-for="field in groupFieldList"
                      :key="field.id"
                      :label="field.name"
                      :title="field.name"
                      :value="field.id"
                      :disabled="groupList.map((j) => j.id).includes(field.id)"
                    />
                  </el-select>
                </div>
                <div class="collapse-line-other">
                  <!-- 值 -->
                  <div class="collapse-line-value">
                    <el-button-group size="small">
                      <el-button
                        type="primary"
                        :plain="item.desc"
                        @click="() => (item.desc = !item.desc)"
                        >{{ getGroupTextOrder(item.type) }}</el-button
                      >
                      <el-button
                        type="primary"
                        :plain="!item.desc"
                        @click="() => (item.desc = !item.desc)"
                      >
                        {{ getGroupTextReverseOrder(item.type) }}
                      </el-button>
                    </el-button-group>
                  </div>
                  <el-button
                    :icon="Close"
                    class="collapse-delete"
                    @click="() => groupList.splice(index, 1)"
                    text
                  />
                </div>
              </div>
            </div>
            <el-button
              v-if="groupList.length < 3"
              text
              @click="addGroup"
            >
              <el-icon><Plus /></el-icon>添加条件
            </el-button>
          </el-collapse-item>

          <!-- FIXME 排序 -->
          <el-collapse-item
            name="3"
            v-if="addViewType !== 7"
          >
            <template #title>
              <el-icon><Sort /></el-icon>
              <span class="collapse-title">设置排序条件</span>
            </template>
            <div class="collapse-line-list">
              <div
                class="collapse-line"
                v-for="(item, index) in sortList"
                :key="item.id"
              >
                <!-- 字段名 -->
                <div class="collapse-line-filed">
                  <el-select
                    size="small"
                    v-model="item.id"
                    :title="item.name"
                    @change="sortFiledChange(item, index)"
                  >
                    <el-option
                      v-for="field in sortFieldList"
                      :key="field.id"
                      :label="field.name"
                      :title="field.name"
                      :value="field.id"
                      :disabled="sortList.map((j) => j.id).includes(field.id)"
                    />
                  </el-select>
                </div>
                <div class="collapse-line-other">
                  <!-- 值 -->
                  <div class="collapse-line-value">
                    <el-button-group size="small">
                      <el-button
                        type="primary"
                        :plain="item.desc"
                        @click="() => (item.desc = !item.desc)"
                        >{{ getGroupTextOrder(item.type) }}</el-button
                      >
                      <el-button
                        type="primary"
                        :plain="!item.desc"
                        @click="() => (item.desc = !item.desc)"
                      >
                        {{ getGroupTextReverseOrder(item.type) }}
                      </el-button>
                    </el-button-group>
                  </div>
                  <el-button
                    :icon="Close"
                    class="collapse-delete"
                    @click="() => sortList.splice(index, 1)"
                    text
                  />
                </div>
              </div>
            </div>
            <el-button
              v-if="sortFieldList.length > sortList.length"
              text
              @click="addSort"
            >
              <el-icon><Plus /></el-icon>添加条件
            </el-button>
          </el-collapse-item>
        </el-collapse>

        <div
          class="sync"
          v-if="filterList.length > 0 || groupList.length > 0 || sortList.length > 0"
        >
          <span> 是否同步给所有人</span>
          <el-switch
            v-model="sync"
            size="small"
          />
        </div>
        <div>
          <el-button
            type="primary"
            size="small"
            @click="confirmAddView"
            :loading="drawerLoading"
            >确定</el-button
          >

          <el-button
            type="info"
            size="small"
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
  }

  .collapse-line-list {
    margin: 10px 0;
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
    display: flex;
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
</style>