<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-12-16 09:57
 * @LastAuthor : itchaox
 * @LastTime   : 2024-01-20 10:08
 * @desc       : 抽屉
-->

<script setup lang="ts">
  import { bitable } from '@lark-base-open/js-sdk';
  import { Close } from '@element-plus/icons-vue';

  import { toast } from 'vue-sonner';
  import FieldIcon from './fieldIcon.jsx';

  import {
    AllApplication,
    Calendar,
    AlignTopTwo,
    AlignRightTwo,
    GridNine,
    CheckCorrect,
    ApplicationMenu,
    PreviewOpen,
    PreviewClose,
    ViewList,
    AlphabeticalSorting,
    Drag,
  } from '@icon-park/vue-next';

  import { VueDraggable } from 'vue-draggable-plus';

  const base = bitable.base;

  interface Props {
    modelValue: Boolean;
    getViewMetaList: () => {};
    viewList: any[];
  }

  const props = defineProps<Props>();

  const emits = defineEmits(['update:model-value', 'confirmAddView']);

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

          // _visibleFieldIdList.forEach((visibleFieldId) => {
          //   if (item.id === visibleFieldId) {
          //     item.isShow = true;
          //   }
          // });
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

  // 文本类字段的集合
  // 1 文本; 13 电话号码; 15 超链接; 22 地理位置; 99001 条形码; 99005 Email
  const textMap = ref([1, 13, 15, 22, 99001]);

  // 数字类字段的集合
  // 2 数字; 1005 自动编号; 99002 进度; 99003 货币; 99004 评分
  const numberMap = ref([2, 1005, 99002, 99003, 99004]);

  // 选择类字段的集合
  // 3 单选; 4多选;
  const selectMap = ref([3, 4]);

  // 引用类型
  // 11 人员; 18 单向关联; 23 群组;

  // 日期类型
  // 5 日期; 1001 创建时间; 1002 修改时间

  async function init() {
    table = await base.getActiveTable();
    view = await table.getActiveView();
    fieldList.value = await view.getFieldMetaList();

    filterFieldList.value = fieldList.value.filter((item) =>
      [1, 3, 4, 13, 15, 22, 99001, 2, 1005, 99002, 99003, 99004].includes(item.type),
    );
    groupFieldList.value = fieldList.value;
    sortFieldList.value = fieldList.value;
  }

  const addViewName = ref();
  const addViewType = ref(1);

  watch(
    () => addViewType.value,
    (newValue, oldValue) => {
      // 默认字段都展示
      fieldTableList.value = fieldTableList.value.map((item) => ({ ...item, isShow: true }));

      // 画册
      if (newValue === 4) {
        fieldTableList.value = fieldTableList.value.map((item, index) => {
          if (index < 4) {
            item.isShow = true;
          } else {
            item.isShow = false;
          }

          return item;
        });
      }

      // 甘特图
      if (newValue === 5) {
        fieldTableList.value = fieldTableList.value.map((item) => ({ ...item, isShow: false }));
      }

      // 日历
      if (newValue === 7) {
        fieldTableList.value = fieldTableList.value.map((item, index) => {
          // 默认显示日期字段
          if (item.type === 5) {
            item.isShow = true;
          } else {
            item.isShow = false;
          }

          return item;
        });
      }
    },
  );

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

      toast.success('新增成功');

      // 筛选
      if (filterList.value?.length > 0) {
        // FIXME 多选时, 数组需要拷贝一下,否则会报错; 数字类型需转换一下
        await view.addFilterCondition(
          filterList.value.map((item) => ({
            fieldId: item.id,
            value: Array.isArray(item.value)
              ? [...item.value]
              : numberMap.value.includes(item.type)
              ? +item.type
              : item.value,
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

      // 同步配置
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
      emits('confirmAddView');
    } else {
      toast.error('视图名字已存在，请重新输入！');
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
    fieldTableList.value = [];
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

    // 文本项\数字类,不需要再掉数据
    if (textMap.value.includes(_activeItem?.type) || numberMap.value.includes(_activeItem?.type)) {
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

  // 文本类条件列表
  const textFilterOperatorList = ref([
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

  // 全部过滤条件
  const allFilterOperatorList = [
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
      id: 'isGreater',
      name: '大于',
    },
    {
      id: 'isGreaterEqual',
      name: '大于或等于',
    },
    {
      id: 'isLess',
      name: '小于',
    },
    {
      id: 'isLessEqual',
      name: '小于或等于',
    },
    {
      id: 'isEmpty',
      name: '为空',
    },
    {
      id: 'isNotEmpty',
      name: '不为空',
    },
  ];

  // 数字类条件列表
  const numberFilterOperatorList = [
    {
      id: 'is',
      name: '等于',
    },
    {
      id: 'isNot',
      name: '不等于',
    },
    {
      id: 'isGreater',
      name: '大于',
    },
    {
      id: 'isGreaterEqual',
      name: '大于或等于',
    },
    {
      id: 'isLess',
      name: '小于',
    },
    {
      id: 'isLessEqual',
      name: '小于或等于',
    },
    {
      id: 'isEmpty',
      name: '为空',
    },
    {
      id: 'isNotEmpty',
      name: '不为空',
    },
  ];

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
      _text = '选项顺序';
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
      _text = '选项倒序';
    } else {
      _text = 'Z → A';
    }
    return _text;
  };

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

  const el = ref();
  const el2 = ref();
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
          新增视图
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
        <div class="addView-line">
          <div class="addView-line-label theme-view-text-color">视图名字:</div>
          <el-input
            style="width: 60%"
            clearable
            v-model="addViewName"
            placeholder="请输入视图名字"
          />
        </div>

        <div class="addView-line">
          <div class="addView-line-label theme-view-text-color">视图类型:</div>
          <el-select
            v-model="addViewType"
            placeholder="请选择视图类型"
            style="width: 60%"
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
              <span
                v-if="filterList.length > 0"
                style="color: #5c82f3"
                >（{{ filterList.length }}）</span
              >
            </template>
            <div v-if="filterList.length > 1">
              符合以下
              <el-select
                v-model="conjunction"
                size="small"
                style="width: 60px"
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
                    >
                      <field-icon :fieldType="field.type" />
                      <span>
                        {{ field.name }}
                      </span>
                    </el-option>
                  </el-select>
                </div>
                <div class="collapse-line-other">
                  <!-- 条件 -->
                  <el-select
                    v-model="item.operator"
                    size="small"
                    style="width: 105px"
                  >
                    <template v-if="textMap.includes(item.type) || selectMap.includes(item.type)">
                      <el-option
                        v-for="item in textFilterOperatorList"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id"
                      />
                    </template>

                    <template v-if="numberMap.includes(item.type)">
                      <el-option
                        v-for="item in numberFilterOperatorList"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id"
                      />
                    </template>
                  </el-select>
                  <!-- 值 -->
                  <div
                    class="collapse-line-value"
                    style="width: 50%"
                  >
                    <el-input
                      v-if="showInput(item.operator) && (textMap.includes(item.type) || numberMap.includes(item.type))"
                      v-model="item.value"
                      :title="item.value"
                      size="small"
                      :placeholder="`请输入${item.name}`"
                      suffix-icon="x"
                    />

                    <!-- FIXME 多选操作,暂时有问题 -->
                    <el-select
                      v-if="showInput(item.operator) && selectMap.includes(item.type)"
                      :multiple="item.type === 4"
                      :collapse-tags="item.type === 4"
                      :collapse-tags-tooltip="item.type === 4"
                      v-model="item.value"
                      :title="item?.options?.find((i) => i.id === item.value)?.name"
                      size="small"
                      :placeholder="`请选择${item.name}`"
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
              <ViewList
                theme="outline"
                strokeLinejoin="bevel"
              />
              <span class="collapse-title">设置分组条件</span>
              <span
                v-if="groupList.length > 0"
                style="color: #dd742f"
                >（{{ groupList.length }}）</span
              >
            </template>
            <VueDraggable
              ref="el"
              v-model="groupList"
              animation="150"
              handle=".handle"
              class="collapse-line-list"
            >
              <!-- <div class="collapse-line-list"> -->
              <div
                class="collapse-line"
                v-for="(item, index) in groupList"
                :key="item.id"
              >
                <div class="drag">
                  <Drag
                    class="handle cursor-move"
                    theme="outline"
                    size="18"
                    fill="#333"
                    strokeLinejoin="miter"
                    strokeLinecap="butt"
                  />
                  <!-- 字段名 -->
                  <div class="collapse-line-filed">
                    <el-select
                      :style="{ width: 'auto' }"
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
                      >
                        <field-icon :fieldType="field.type" />
                        <span>
                          {{ field.name }}
                        </span>
                      </el-option>
                    </el-select>
                  </div>
                </div>
                <div class="collapse-line-other">
                  <!-- 值 -->
                  <div class="collapse-line-value">
                    <el-button-group size="small">
                      <el-button
                        class="collapse-btn"
                        type="primary"
                        :plain="item.desc"
                        @click="() => (item.desc = !item.desc)"
                        >{{ getGroupTextOrder(item.type) }}</el-button
                      >
                      <el-button
                        class="collapse-btn"
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
              <!-- </div> -->
            </VueDraggable>
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
              <AlphabeticalSorting theme="outline" />
              <span class="collapse-title">设置排序条件</span>
              <span
                v-if="sortList.length > 0"
                style="color: #4493c5"
                >（{{ sortList.length }}）</span
              >
            </template>
            <VueDraggable
              ref="el2"
              v-model="sortList"
              animation="150"
              handle=".handle2"
              class="collapse-line-list"
            >
              <!-- <div class="collapse-line-list"> -->

              <div
                class="collapse-line"
                v-for="(item, index) in sortList"
                :key="item.id"
              >
                <div class="drag2">
                  <Drag
                    class="handle2 cursor-move"
                    theme="outline"
                    size="18"
                    fill="#333"
                    strokeLinejoin="miter"
                    strokeLinecap="butt"
                  />
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
                      >
                        <field-icon :fieldType="field.type" />
                        <span>
                          {{ field.name }}
                        </span>
                      </el-option>
                    </el-select>
                  </div>
                </div>

                <div class="collapse-line-other">
                  <!-- 值 -->
                  <div class="collapse-line-value">
                    <el-button-group size="small">
                      <el-button
                        class="collapse-btn"
                        type="primary"
                        :plain="item.desc"
                        @click="() => (item.desc = !item.desc)"
                        >{{ getGroupTextOrder(item.type) }}</el-button
                      >
                      <el-button
                        class="collapse-btn"
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
              <!-- </div> -->
            </VueDraggable>
            <el-button
              v-if="sortFieldList.length > sortList.length"
              text
              @click="addSort"
            >
              <el-icon><Plus /></el-icon>添加条件
            </el-button>
          </el-collapse-item>

          <!-- FIXME 字段配置 -->
          <el-collapse-item name="4">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span class="collapse-title">字段配置</span>
            </template>
            <div class="collapse-line-list">
              <el-table
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
