<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-09-26 15:10
 * @LastAuthor : Wang Chao
 * @LastTime   : 2025-05-07 16:43
 * @desc       : 
-->
<script setup>
  import { bitable } from '@lark-base-open/js-sdk';
  import { BASE_URL } from '@/config';
  import {
    AllApplication,
    Calendar,
    AlignTopTwo,
    AlignRightTwo,
    GridNine,
    CheckCorrect,
    ApplicationMenu,
    PreviewOpen,
    Config,
    Info,
  } from '@icon-park/vue-next';

  import { toast } from 'vue-sonner';

  import Drawer from './Drawer.vue';
  import AllViewFieldDrawer from './AllViewFieldDrawer.vue';

  import axios from 'axios';

  import { useI18n } from 'vue-i18n';
  const { t } = useI18n();

  const base = bitable.base;

  const viewList = ref([]);
  const table = ref();

  const selectViewIdList = ref([]);

  const baseId = ref();
  const tableId = ref();

  // 标签数组
  const tagsList = ref([]);

  // 标签筛选交集
  const tagOptionList = ref([]);

  // 新增视图抽屉
  const addViewDrawer = ref(false);

  onMounted(async () => {
    theme.value = await bitable.bridge.getTheme();
    setThemeColor();

    const selection = await bitable.base.getSelection();
    if (!selection.tableId) {
      isTable.value = false;
    }

    baseId.value = selection.baseId;
    tableId.value = selection.tableId;
    activeViewId.value = selection.viewId;

    await getViewMetaList();
    handleFilterViewList();

    // 监听 table 滚动事件
    const scrollDom = tableRef.value?.scrollBarRef?.wrapRef;
    await scrollDom.addEventListener('scroll', () => {
      // 滚动距离
      let scrollTop = scrollDom?.scrollTop;
      if (scrollTop > 200) {
        showTableTop.value = true;
      } else {
        showTableTop.value = false;
      }
    });

    const _index = viewList.value.findIndex((item) => item.view_id === activeViewId.value);
    const _height = document.querySelector('.el-table__row')?.offsetHeight;

    // FIXME 初始化 tags
    viewList.value = await toRaw(table.value).getViewMetaList();

    // FIXME 获取 tags 的缓存数据
    const res = await bitable.bridge.getData('viewManager' + tableId.value);

    if (typeof res === 'string') {
      if (JSON.parse(res).length > 0) {
        // 保证有完整的视图列表
        const _res = JSON.parse(res);
        tagsList.value = viewList.value.map((item) => {
          let data = _res.find((i) => i.viewId === item.id);

          return {
            viewId: item.id,
            tags: data ? data.tags : [],
          };
        });
      } else {
        tagsList.value = viewList.value.map((item) => ({ viewId: item.id, tags: [] }));
      }
    }

    // 获取 tags 并集
    const tagsUnion = [...new Set(tagsList.value.flatMap((item) => item.tags))];
    tagOptionList.value = tagsUnion;

    // 移动表格位置
    scrollTable(_index * _height);

    // 监听新增字段事件
    toRaw(table.value).onFieldAdd(async (event) => {
      console.log('新增字段');

      addViewDrawer.value = false;
      batchAllViewFieldDrawer.value = false;

      if (onlyShowActiveView.value === true) {
        const _addFieldId = event?.data?.fieldId;
        // 1. 当前视图以外的视图列表
        // 2. 新增字段的 id
        // 3. 批量隐藏新增字段 id

        const _viewList = await toRaw(table.value)?.getViewMetaList();
        const _activeView = await toRaw(table.value)?.getActiveView();
        const _otherViewIdList = _viewList?.filter((item) => item?.id !== _activeView?.id)?.map((item) => item?.id);

        // 隐藏其他视图中新增字段
        for (const id of _otherViewIdList) {
          const view = await toRaw(table.value)?.getViewById(id);
          await view?.hideField(_addFieldId);
        }
      }
    });

    toRaw(table.value).onFieldModify((event) => {
      addViewDrawer.value = false;
      batchAllViewFieldDrawer.value = false;
    });

    toRaw(table.value).onFieldDelete((event) => {
      addViewDrawer.value = false;
      batchAllViewFieldDrawer.value = false;
    });

    isInit.value = true;
  });

  /**
   * @desc  : 滚动表格
   */
  const scrollTable = (targetY) => {
    const scrollDom = tableRef.value?.scrollBarRef?.wrapRef;
    const startY = scrollDom?.scrollTop;

    // const targetY = 0;
    const duration = 500; // 动画持续时间，单位：毫秒
    let startTime;

    // 增加动画效果, 使回到顶部的过程更加丝滑、流畅
    const animateScroll = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const newY = easeInOutQuad(progress) * (targetY - startY) + startY;

      scrollDom?.scrollTo(0, newY);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  // 缓动函数，此处使用 easeInOutQuad，你可以根据需要选择其他缓动函数
  const easeInOutQuad = (t) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };

  // 主题颜色 LIGHT; DARK
  const theme = ref('');
  // 监听主题变化
  bitable.bridge.onThemeChange((event) => {
    theme.value = event.data.theme;
    setThemeColor();
  });

  const setThemeColor = () => {
    const el = document.documentElement;
    const main = document.querySelector('main');

    const themeStyles = {
      LIGHT: {
        '--el-color-primary': 'rgb(20, 86, 240)',
        '--el-bg-color': '#fff',
        '--el-border-color-lighter': '#dee0e3',
        '--el-fill-color-light': '#f5f7fa',
        '--el-fill-color-blank': '#fff',
        '--el-text-color-primary': '#303133',
        '--el-button-text-color': '#434343',
        '--el-text-color-regular': '#434343',
        // 加载中效果
        // '--el-mask-color': '#f5f6f7',
        '--el-bg-color-overlay': '#fff',
        color: '#434343',
        'background-color': '#fff',
      },
      DARK: {
        '--el-color-primary': '#4571e1',
        '--el-bg-color': '#252525',
        '--el-border-color-lighter': '#434343',
        '--el-fill-color-light': '#434343',
        '--el-fill-color-blank': '#434343',
        '--el-text-color-primary': '#fff',
        '--el-button-text-color': '#fff',
        '--el-text-color-regular': '#fff',
        // 加载中效果
        // '--el-mask-color': '#434343',
        '--el-bg-color-overlay': '#303133',
        color: '#fff',
        'background-color': '#1d1d1d',
      },
    };

    const currentThemeStyles = themeStyles[theme.value];

    // 设置样式变量
    Object.entries(currentThemeStyles).forEach(([property, value]) => {
      el.style.setProperty(property, value);
    });

    // 设置其他样式
    main.style.backgroundColor = currentThemeStyles['background-color'];

    // 设置文本颜色
    const themeViewTextColorElements = document.querySelectorAll('.theme-view-text-color');
    themeViewTextColorElements.forEach((element) => {
      element.style.color = currentThemeStyles.color;
    });
  };

  // 是不是数据表
  const isTable = ref(true);

  base.onSelectionChange(async (event) => {
    // 判断是否数据表
    if (event?.data?.tableId) {
      isTable.value = true;
    } else {
      isTable.value = false;
    }

    const hasView = viewList.value.findIndex((item) => item.view_id === event?.data?.viewId);
    // 新增视图或修改数据表, 则重新调用视图列表
    if (!event?.data?.fieldId && hasView === -1 && isTable.value) {
      searchViewName.value = '';
      searchViewType.value = 'all';
      addViewDrawer.value = false;

      activeViewId.value = event?.data?.viewId;
      await getViewMetaList();
      const _index = viewList.value.findIndex((item) => item.view_id === activeViewId.value);
      const _height = document.querySelector('.el-table__row')?.offsetHeight;

      // 新增视图后, 滚动到表格底部
      scrollTable(_index * _height);

      handleFilterViewList();
    }

    // 切换数据表
    if (event?.data?.tableId !== tableId.value && isTable.value) {
      const selection = await bitable.base.getSelection();
      if (!selection.tableId) {
        isTable.value = false;
      } else {
        tableId.value = selection.tableId;
      }

      // FIXME 初始化 tags
      viewList.value = await toRaw(table.value).getViewMetaList();
      // FIXME 获取 tags 的缓存数据
      const res = await bitable.bridge.getData('viewManager' + tableId.value);

      if (typeof res === 'string') {
        if (JSON.parse(res).length > 0) {
          const _res = JSON.parse(res);
          // 保证有完整的视图列表
          tagsList.value = viewList.value.map((item) => {
            let data = _res.find((i) => i.viewId === item.id);

            return {
              viewId: item.id,
              tags: data ? data.tags : [],
            };
          });
        } else {
          tagsList.value = viewList.value.map((item) => ({ viewId: item.id, tags: [] }));
        }
      }

      // 获取 tags 并集
      const tagsUnion = [...new Set(tagsList.value.flatMap((item) => item.tags))];
      tagOptionList.value = tagsUnion;

      searchViewName.value = '';
      searchViewType.value = 'all';
    }

    //FIXME 切换视图
    if (!event?.data?.fieldId && hasView !== -1 && isTable.value) {
      activeViewId.value = event?.data?.viewId;
      const _index = viewList.value.findIndex((item) => item.view_id === activeViewId.value);
      const _height = document.querySelector('.el-table__row')?.offsetHeight;

      // 移动表格位置
      scrollTable(_index * _height);
    }

    // 高亮当前视图按钮
    if (hasView !== -1 && hasView !== undefined) {
      activeViewId.value = event?.data?.viewId;
    }

    // handleFilterViewList();
  });

  const tenant_access_token = ref();

  // 是否验证成功
  const Verify = ref(false);

  // 获取 token
  async function getTenantAccessToken() {
    // const apiUrl = `${BASE_URL}/open-apis/auth/v3/tenant_access_token/internal`;
    const apiUrl =
      'https://viewmanger-test-bzsivtqqfc.cn-chengdu.fcapp.run/open-apis/auth/v3/tenant_access_token/internal';

    const data = {
      app_id: appId.value,
      app_secret: appSecret.value,
    };

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
    };

    try {
      const response = await axios.post(apiUrl, data, { headers });
      // 处理响应数据
      if (response?.data?.code === 0) {
        tenant_access_token.value = response?.data?.tenant_access_token;
        Verify.value = true;
        toast.success(t('Self-built application credentials called successfully'));
        openEnterprise.value = false;
      } else {
        toast.error(t('app_id or app_secret error'));
      }
    } catch (error) {
      toast.error(error?.message);
    }
    // expire 时间到了自动刷新问题, 分钟
  }

  // 表格的管理员 user_id 列表
  const fullAccessIdList = ref([]);

  /**
   * @desc  : 获取协作者列表
   */
  async function getMemberList() {
    // const apiUrl = `${BASE_URL}/open-apis/drive/permission/member/list`;
    const apiUrl = 'https://viewmanger-test-bzsivtqqfc.cn-chengdu.fcapp.run/open-apis/drive/permission/member/list';

    const data = {
      token: baseId.value,
      type: 'bitable',
      tenant_access_token: tenant_access_token.value,
    };

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${tenant_access_token.value}`,
    };

    try {
      const response = await axios.post(apiUrl, data, { headers });
      // 处理响应数据
      if (response?.status === 200) {
        const members = response?.data?.data?.members;

        members.forEach((item) => {
          if (item.perm === 'full_access') {
            fullAccessIdList.value.push(item.member_open_id);
          }
        });
      }
    } catch (error) {
      // 弹出提示用户错误信息

      console.error('Error:', error.message);
      throw error;
    }
  }

  /**
   * @desc  : 删除个人视图
   */
  async function deletePersonView(viewId) {
    // const apiUrl = `${BASE_URL}/open-apis/drive/permission/member/list`;
    const apiUrl = 'https://viewmanger-test-bzsivtqqfc.cn-chengdu.fcapp.run/open-apis/deleteView';

    const data = {
      baseId: baseId.value,
      tableId: tableId.value,
      viewId: viewId,
      tenant_access_token: tenant_access_token.value,
    };

    console.log('🚀 data:', data);

    // const headers = {
    //   'Content-Type': 'application/json; charset=utf-8',
    //   Authorization: `Bearer ${tenant_access_token.value}`,
    // };

    try {
      const response = await axios.post(apiUrl, data);
      // 处理响应数据
      console.log('🚀 response--删除个人视图:', response);

      // if (response?.status === 200) {
      //   const members = response?.data?.data?.members;

      //   members.forEach((item) => {
      //     if (item.perm === 'full_access') {
      //       fullAccessIdList.value.push(item.member_open_id);
      //     }
      //   });
      // }
    } catch (error) {
      // 弹出提示用户错误信息

      console.error('Error:', error.message);
      throw error;
    }
  }

  // 分页标记
  const page_token = ref();

  const total = ref();

  /**
   * @desc  : 获取完整视图列表
   */
  async function getViewAllList() {
    loading.value = true;
    const apiUrl1 = `${BASE_URL}/open-apis/bitable/v1/apps/${baseId.value}/tables/${tableId.value}/views?page_size=100`;

    const apiUrl2 = `${BASE_URL}/open-apis/bitable/v1/apps/${baseId.value}/tables/${tableId.value}/views?page_size=100&page_token=${page_token.value}`;

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${tenant_access_token.value}`,
    };

    try {
      // 发起带有 Authorization 头的 GET 请求
      // const response = await axios.get(page_token.value ? apiUrl2 : apiUrl1, { headers });
      let response;

      if (page_token.value) {
        // v2
        const data = {
          baseId: baseId.value,
          tableId: tableId.value,
          page_token: page_token.value,
          tenant_access_token: tenant_access_token.value,
        };

        response = await axios.post(
          'https://viewmanger-test-bzsivtqqfc.cn-chengdu.fcapp.run/open-apis/bitable/v1/apps-2',
          data,
          { headers },
        );
      } else {
        // v1

        const data = {
          baseId: baseId.value,
          tableId: tableId.value,
          tenant_access_token: tenant_access_token.value,
        };

        response = await axios.post(
          'https://viewmanger-test-bzsivtqqfc.cn-chengdu.fcapp.run/open-apis/bitable/v1/apps-1',
          data,
          { headers },
        );
      }

      console.log('🚀 response111:', response);

      if (response?.data?.code === 0) {
        const _list = response.data?.data?.items;

        // 追加元素
        viewList.value.push(..._list?.map((item) => item));

        console.log('🚀 viewList.value333:', viewList.value);

        if (response.data?.data?.has_more) {
          // 判断是否有更多项
          // 视图现在最多200项, page_size 100; 因此这里最多请求2次
          page_token.value = response.data?.data?.page_token;
          await getViewAllList();
        } else {
          toast.success(t('Successful query'));
        }
      }
    } catch (error) {
      // 处理错误
      console.error('Error:', error.message);
      throw error;
    }
  }

  const isInit = ref(false);

  async function getViewMetaList() {
    loading.value = true;
    table.value = await base.getActiveTable();

    viewList.value = await toRaw(table.value).getViewMetaList();

    console.log('🚀 viewList.value:', viewList.value);

    if (isInit.value) {
      toast.success(t('Successful query'));
    }

    handlerViewList();
  }

  function handlerViewList() {
    // 个人用户, 也统一字段名
    // 企业用户, 全部视图范围走 js api
    if (userType.value === 1 || viewRange.value === 1) {
      viewList.value = viewList.value?.map((item) => {
        return { view_id: item.id, view_name: item.name, view_type: mapViewType(item.type), isEditing: false };
      });
    } else {
      // 此处的数据, 都是视图全部类型, 有 private 视图等
      if (viewRange.value === 2) {
        // "管理员" 的个人视图
        viewList.value = viewList.value.filter(
          (item) => item.view_public_level === 'Private' && fullAccessIdList.value.includes(item.view_private_owner_id),
        );
      } else if (viewRange.value === 3) {
        // "非管理员" 的个人视图
        viewList.value = viewList.value.filter(
          (item) =>
            item.view_public_level === 'Private' && !fullAccessIdList.value.includes(item.view_private_owner_id),
        );
      }
      // viewList.value = viewList.value.map((item) => ({ ...item, isEditing: false }));
    }

    loading.value = false;
  }

  function mapViewType(type) {
    let _charType;
    switch (type) {
      case 1:
        _charType = 'grid';
        break;
      case 2:
        _charType = 'kanban';
        break;
      case 3:
        _charType = 'form';
        break;
      case 4:
        _charType = 'gallery';
        break;
      case 5:
        _charType = 'gantt';
        break;
      case 7:
        _charType = 'unknown';
        break;
    }
    return _charType;
  }

  const handleSelectionChange = (val) => {
    selectViewIdList.value = val?.map((item) => item.view_id);
  };

  /**
   * @desc  : 修改视图名
   * @param  {any} view_name 名字
   * @param  {any} view_id 视图 id
   */
  function handleFileName(view_name, view_id) {
    const _list = viewList.value.filter((item) => item.view_name === view_name);
    if (_list.length === 1) {
      toRaw(table.value).setView(view_id, {
        name: view_name,
      });
    }
  }

  /**
   * @desc  : 单个删除
   * @param  {any} index 索引
   * @param  {any} row 行数据
   */
  async function handleDelete(index, view_id) {
    loading.value = true;

    await deletePersonView(view_id);

    // await getViewMetaList();

    // try {
    //   // await bitable.base.getTableById('xxx');
    //   await toRaw(table.value).deleteView(view_id);
    // } catch (e) {
    //   const { message, code } = e;
    //   console.log('🚀 message3333:', message, code);
    //   // handle error
    //   // Toast.error(message);
    // }
    // // await toRaw(table.value).deleteView('vew16kDIqX');

    toast.success(t('Deleted successfully'));

    if (userType.value === 1 || viewRange.value === 1) {
      // 个人用户: 手动查询
      // 企业用户: 全部视图范围还是走手动查询
      await getViewMetaList();
    } else {
      // 先清空视图数组
      viewList.value = [];
      // 企业用户,通过掉接口
      await getViewAllList();
      await handlerViewList();
    }

    // 筛选视图类型和视图名字
    handleFilterViewList();
    page_token.value = '';
  }

  /**
   * @desc  : 批量删除
   */
  async function batchDelete() {
    if (selectViewIdList.value.length === viewList.value.length) {
      toast.warning(t('Please keep at least one view'));
      return;
    }

    if (selectViewIdList.value?.length === 0) {
      toast.warning(t('Please check View first'));
      return;
    }

    popconfirmVisible.value = true;
  }

  /**
   * @desc  : 批量删除
   */
  async function confirmBatchDelete() {
    loading.value = true;

    for (const view_id of selectViewIdList.value) {
      await toRaw(table.value).deleteView(view_id);
    }
    toast.success(t('Batch Delete Success'));
    // await getViewMetaList();

    if (userType.value === 1 || viewRange.value === 1) {
      // 个人用户: 手动查询
      // 企业用户: 全部视图范围还是走手动查询
      await getViewMetaList();
    } else {
      // 先清空视图数组
      viewList.value = [];
      // 企业用户,通过掉接口
      await getViewAllList();
      handlerViewList();
    }

    // 筛选视图类型和视图名字
    handleFilterViewList();
    page_token.value = '';
    popconfirmVisible.value = false;
  }

  // 编辑视图
  async function handleEdit(view_id) {
    isEditing.value = true;
    activeButtonId.value = view_id;

    viewList.value = viewList.value?.map((item) => {
      if (item.view_id === view_id) {
        item.isEditing = true;
      }
      return item;
    });
    // 在下一轮事件循环中，将输入框聚焦
    nextTick(() => {
      editInput.value.focus();
    });
  }

  const openAddView = ref(false);

  async function addView() {
    addViewDrawer.value = true;
    // openAddView.value = true;
  }

  const batchAllViewFieldDrawer = ref(false);

  async function batchAllViewField() {
    if (selectViewIdList.value?.length === 0) {
      toast.warning(t('Please check View first'));
      return;
    }

    batchAllViewFieldDrawer.value = true;
  }

  const newViewType = ref(1);
  const newViewName = ref();

  const addViewType = ref(1);
  const addViewName = ref();

  //  查询的类型下拉, 对齐字符串字典
  const searchViewTypeList = ref([
    { value: 'all', label: 'Full view' },
    { value: 'grid', label: 'table view' },
    { value: 'kanban', label: 'Kanban view' },
    { value: 'form', label: 'form view' },
    { value: 'gallery', label: 'Album view' },
    { value: 'gantt', label: 'Gantt view' },
    { value: 'unknown', label: 'calendar view' },
  ]);

  const searchViewType = ref('all');
  const searchViewName = ref();

  // 视图标签
  const viewTags = ref([]);

  // 新增字段仅显示于当前视图
  const onlyShowActiveView = ref(false);

  // 展示视频标签
  const showViewTag = ref(false);

  // 自动同步所有人
  const autoSyncAll = ref(false);

  const viewRangeList = ref([
    { value: 1, label: 'Full Role View Scope' },
    // { value: 2, label: '当前用户个人视图' },
    { value: 2, label: 'Personal view for administrators' },
    { value: 3, label: 'Non-administrator personal view' },
  ]);

  const viewRange = ref(1);

  function cancel() {
    addViewName.value = '';
    addViewType.value = 1;
    openAddView.value = false;
  }

  function cancelAddView() {
    // 重置操作
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
  // async function changeViewType(row, type) {
  //   await toRaw(table.value).setView({
  //     viewId: row.view_id,
  //     type: type,
  //   });

  //   viewList.value = await toRaw(table.value).getViewMetaList();
  // }

  const isEditing = ref(false);

  /**
   * @desc  : 切换视图
   */
  async function switchView(view_id) {
    await bitable.ui.switchToView(toRaw(table.value).id, view_id);
  }

  const activeButtonId = ref();

  const activeViewId = ref();

  // 结束编辑，例如在输入框失焦时调用
  async function endEditing(view_id, view_name) {
    // 包含当前修改的列
    const _list = viewList.value.filter((item) => item.view_name === view_name);

    if (_list.length > 1) {
      toast.error(t('The view name already exists'));
      return;
    }

    viewList.value = viewList.value?.map((item) => {
      if (item.view_id === view_id) {
        item.isEditing = false;
      }
      return item;
    });

    activeButtonId.value = '';
    isEditing.value = false;
  }

  const editInput = ref(null);

  function selectable(row, index) {
    // 第一个视图不能删除, 个人视图删除时不做显示
    if (index === 0 && viewRange.value === 1) {
      // return false;
      return true;
    } else {
      return true;
    }
  }

  /**
   * @desc  : 查询
   */
  async function searchView() {
    if (userType.value === 1 || viewRange.value === 1) {
      // 个人用户: 手动查询
      // 企业用户: 全部视图范围还是走手动查询
      await getViewMetaList();
    } else {
      // 先清空视图数组
      viewList.value = [];
      // 企业用户,通过掉接口
      await getViewAllList();
      handlerViewList();
    }

    // 筛选视图类型和视图名字
    handleFilterViewList();
    page_token.value = '';
  }

  function handleFilterViewList() {
    // 筛选视图类型和视图名字
    // viewList.value = viewList.value.filter((item) => {
    filterViewList.value = viewList.value.filter((item) => {
      const _data = tagsList.value.find((i) => i.viewId === item.view_id);
      const _tags = _data?.tags;

      const typeMatch = searchViewType.value === 'all' || item.view_type === searchViewType.value;
      const nameMatch = !searchViewName.value || item?.view_name?.includes(searchViewName.value);

      let tagMatch;

      if (viewTags.value.length === 0) {
        tagMatch = true;
      } else {
        tagMatch = viewTags.value?.some((item) => _tags?.includes(item));
      }

      return typeMatch && nameMatch && tagMatch;
    });
  }

  async function reset() {
    viewRange.value = 1;
    searchViewName.value = '';
    searchViewType.value = 'all';
    viewTags.value = [];

    await getViewMetaList();
    handleFilterViewList();
  }

  /**
   * @desc  : 确认自建应用凭证信息
   */
  async function confirmInfo() {
    await getTenantAccessToken();
    await getMemberList();
  }

  /**
   * @desc  : 取消自建应用凭证信息
   */
  async function cancelInfo() {
    if (Verify.value) {
      openEnterprise.value = false;
    } else {
      userType.value = 1;
      appId.value = '';
      appSecret.value = '';
      openEnterprise.value = false;
    }
  }

  // 用户类型 1 个人用户; 2 企业用户
  const userType = ref(1);

  // 企业用户弹窗
  const openEnterprise = ref(false);

  function setEnterprise() {
    openEnterprise.value = true;
  }

  const appId = ref('');
  const appSecret = ref('');

  // 过滤之后的视图列表
  const filterViewList = ref([]);

  const loading = ref(false);

  const tableRef = ref(null);
  const showTableTop = ref(false);

  async function goDataBase() {
    const tableMetaList = await base.getTableMetaList();
    await bitable.ui.switchToTable(tableMetaList[0]?.id);
  }

  const confirmAddView = () => {
    const _length = viewList.value.length;
    const _height = document.querySelector('.el-table__row').offsetHeight;

    // 新增视图后, 滚动到表格底部
    scrollTable(_length * _height);
  };

  async function syncAllViewField() {
    allLoading.value = true;
    let _view = await toRaw(table.value).getActiveView();
    let _fieldMetaList = await _view.getFieldMetaList();
    let _allFieldIdList = _fieldMetaList.map((item) => item.id);
    let _showFieldIdList = await _view.getVisibleFieldIdList();
    let _hideFieldIdList = _allFieldIdList.filter((id) => !_showFieldIdList.includes(id));

    const viewList = await toRaw(table.value).getViewList();
    for (const view of viewList) {
      await view.showField(_showFieldIdList);
      await view.hideField(_hideFieldIdList);
    }

    allLoading.value = false;
    toast.success(t('Synchronization Configuration Successful'));
  }

  const allLoading = ref(false);

  const popconfirmVisible = ref(false);

  function confirmBatchViewField() {
    tableRef.value.clearSelection();
  }

  const isShowOtherSet = ref(false);

  const isAsyncFilter = ref(false);
  const isAsyncGroup = ref(false);
  const isAsyncSort = ref(false);
  const rowHeightLevel = ref();

  const cancelSet = () => {
    isShowOtherSet.value = false;
    isAsyncFilter.value = false;
    isAsyncGroup.value = false;
    isAsyncSort.value = false;
    rowHeightLevel.value = undefined;
  };

  const confirmSet = async () => {
    let _view = await toRaw(table.value).getActiveView();
    const viewList = await toRaw(table.value).getViewList();

    // FIXME 筛选
    let currentFilterInfo;
    if (isAsyncFilter.value) {
      currentFilterInfo = await _view.getFilterInfo();
    }

    // FIXME 分组
    let currentGroupInfo;
    if (isAsyncGroup.value) {
      currentGroupInfo = await _view.getGroupInfo();
    }

    // FIXME 排序
    let currentSortInfo;
    if (isAsyncSort.value) {
      currentSortInfo = await _view.getSortInfo();
    }

    for (const view of viewList) {
      // FIXME 筛选
      // done
      if (isAsyncFilter.value) {
        let info = await view.getFilterInfo();

        if (view.id !== _view.id) {
          if (info) {
            for (let i = 0; i < info.conditions.length; i++) {
              await view.deleteFilterCondition(info.conditions[i].conditionId);
            }
          }
          await view.addFilterCondition(currentFilterInfo.conditions);
          await view.setFilterConjunction(currentFilterInfo.conjunction);
        }
      }

      // FIXME 分组
      // done
      if (isAsyncGroup.value) {
        let info = await view.getGroupInfo();

        if (view.id !== _view.id) {
          if (info) {
            for (const i of info) {
              await view.deleteGroup(i);
            }
          }
          await view.addGroup(currentGroupInfo);
        }
      }

      // FIXME 排序
      // done
      if (isAsyncSort.value) {
        let info = await view.getSortInfo();

        if (view.id !== _view.id) {
          if (info) {
            for (const i of info) {
              await view.deleteSort(i);
            }
          }
          await view.addSort(currentSortInfo);
        }
      }

      // FIXME 行高
      // done
      if (rowHeightLevel.value) {
        await view.setRowHeight(rowHeightLevel.value);
      }

      // done
      if (isAsyncFilter.value || isAsyncGroup.value || isAsyncSort.value || rowHeightLevel.value) {
        await view.applySetting();
      }
    }

    isShowOtherSet.value = false;
    toast.success(t('Synchronization Configuration Successful'));
  };

  async function updateTags(index, tags) {
    if (tagsList?.value[index]) {
      tagsList.value[index] = { ...tagsList?.value[index], tags }; // 替换为新对象
    }
    await bitable.bridge.setData('viewManager' + tableId.value, JSON.stringify(tagsList?.value || []));

    // 获取 tags 并集
    const tagsUnion = [...new Set(tagsList.value.flatMap((item) => item.tags))];
    tagOptionList.value = tagsUnion;
  }

  const activeNames = ref(['1']);
</script>

<template>
  <div
    class="field-manager"
    v-if="isTable"
    v-loading="allLoading"
    :element-loading-text="$t('Loading')"
  >
    <el-collapse v-model="activeNames">
      <el-collapse-item
        title="更多配置"
        name="1"
      >
        <el-popconfirm
          width="60vw"
          :confirm-button-text="$t('Confirm')"
          :cancel-button-text="$t('Cancel')"
          @confirm="syncAllViewField"
          :icon="InfoFilled"
          icon-color="rgb(20, 86, 240)"
          cancel-button-type="info"
          :hide-after="50"
          :title="$t('Are you sure to synchronize the current view fields explicitly and implicitly to all views')"
        >
          <template #reference>
            <el-button
              type="primary"
              @mousedown="(e) => e.preventDefault()"
            >
              <preview-open
                theme="outline"
                size="18"
                strokeLinecap="square"
                style="margin-right: 5px"
              />
              {{ $t('Synchronize all view field hides') }}
            </el-button>
          </template>
        </el-popconfirm>

        <div class="async-set-icon">
          <el-button
            type="primary"
            @click="() => (isShowOtherSet = true)"
            @mousedown="(e) => e.preventDefault()"
          >
            <config
              theme="outline"
              size="18"
              strokeLinecap="square"
              style="margin-right: 5px"
            />
            {{ $t('Synchronize other configurations for all views') }}
          </el-button>
        </div>

        <div class="async-set-icon">
          <div class="addView-line addView-line-switch">
            <div class="addView-line-addField-label theme-view-text-color">{{ $t('addFieldOnlyShowActiveView') }}</div>
            <el-switch v-model="onlyShowActiveView" />
          </div>
          <div
            class="addView-line-new-label"
            v-if="onlyShowActiveView"
          >
            <info
              theme="outline"
              size="14"
              fill="#ca6c2c"
              style="padding-top: 5px"
            />
            <span>
              {{ $t('addViewLineNewLabel') }}
            </span>
          </div>
        </div>
        <!-- 
        <div class="async-set-icon">
          <div class="addView-line addView-line-switch">
            <div class="addView-line-addField-label theme-view-text-color">展示视图标签</div>
            <el-switch v-model="showViewTag" />
          </div>
        </div> -->
      </el-collapse-item>
    </el-collapse>

    <!-- FIXME 自动同步所有人-暂时不做 -->
    <!-- <div class="async-set-icon">
      <div class="addView-line">
        <div class="addView-line-addField-label theme-view-text-color">自动同步所有人</div>
        <el-switch v-model="autoSyncAll" />
      </div>
    </div> -->

    <!-- 同步所有视图其他配置——弹窗  -->
    <el-dialog
      v-model="isShowOtherSet"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="cancelSet"
      :title="$t('Synchronize other configurations for all views')"
      width="75%"
    >
      <div class="tips">{{ $t('ttt') }}</div>
      <div class="async-set">
        <el-checkbox v-model="isAsyncFilter">{{ $t('filter') }}</el-checkbox>
        <el-checkbox v-model="isAsyncGroup">{{ $t('group') }}</el-checkbox>
        <el-checkbox v-model="isAsyncSort">{{ $t('sort') }}</el-checkbox>
        <div class="setRawHeight">
          <span>{{ $t('rawHeight') }}</span>
          <el-select
            v-model="rowHeightLevel"
            :placeholder="$t('sss')"
          >
            <el-option
              :key="1"
              :label="$t('Low')"
              :value="1"
            />

            <el-option
              :key="2"
              :label="$t('medium')"
              :value="2"
            />
            <el-option
              :key="3"
              :label="$t('high')"
              :value="3"
            />
            <el-option
              :key="4"
              :label="$t('Super High')"
              :value="4"
            />
          </el-select>
        </div>
      </div>
      <div>
        <el-button
          @mousedown="(e) => e.preventDefault()"
          type="primary"
          @click="confirmSet"
          >{{ $t('Confirm') }}</el-button
        >

        <el-button
          @mousedown="(e) => e.preventDefault()"
          @click="() => (isShowOtherSet = false)"
          >{{ $t('Cancel') }}</el-button
        >
      </div>
    </el-dialog>

    <div class="tips">{{ $t('tips') }}</div>
    <div class="addView-line">
      <div class="addView-line-label theme-view-text-color">{{ $t('Usage Mode') }}</div>
      <el-radio-group
        v-model="userType"
        size="small"
      >
        <el-radio-button :label="1">{{ $t('normal view') }}</el-radio-button>
        <el-radio-button
          :label="2"
          @click="setEnterprise"
          >{{ $t('personal view') }}</el-radio-button
        >
      </el-radio-group>
    </div>

    <!-- 企业用户弹窗 -->
    <el-dialog
      v-model="openEnterprise"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="cancelInfo"
      :title="$t('Fill out the self-build application credentials')"
      width="75%"
    >
      <el-link
        href="https://bcmcjimpjd.feishu.cn/docx/L0sBd2M0JokYJ9xFRaPcF4cVnMg"
        target="_blank"
        type="primary"
      >
        <el-icon><QuestionFilled /></el-icon>{{ $t('Operating Guidelines') }}
      </el-link>
      <div
        class="addView"
        v-if="userType === 2"
      >
        <div class="addView-line">
          <div class="addView-line-label addView-line-labelDialog theme-view-text-color">App ID:</div>
          <el-input
            v-model="appId"
            type="password"
            :placeholder="$t('Please enter App ID')"
            show-password
          />
        </div>

        <div class="addView-line">
          <div class="addView-line-label addView-line-labelDialog theme-view-text-color">App Secret:</div>
          <el-input
            v-model="appSecret"
            type="password"
            :placeholder="$t('Please enter App Secret')"
            show-password
          />
        </div>

        <div>
          <el-button
            @mousedown="(e) => e.preventDefault()"
            type="primary"
            @click="confirmInfo"
            >{{ $t('Confirm') }}</el-button
          >

          <el-button
            @mousedown="(e) => e.preventDefault()"
            @click="cancelInfo"
            >{{ $t('Cancel') }}</el-button
          >
        </div>
      </div>
    </el-dialog>

    <div class="addView">
      <div
        class="addView-line"
        v-show="userType === 2 && Verify"
      >
        <div class="addView-line-label theme-view-text-color">{{ $t('View range') }}</div>
        <el-select
          filterable
          v-model="viewRange"
          style="width: 50%"
          :placeholder="$t('Please select the view range')"
        >
          <el-option
            v-for="item in viewRangeList"
            :key="item.value"
            :label="$t(item.label)"
            :value="item.value"
          />
        </el-select>
      </div>

      <div class="addView-line">
        <div class="addView-line-label theme-view-text-color">{{ $t('View Name') }}</div>
        <el-input
          style="width: 50%"
          v-model="searchViewName"
          @keydown.enter="searchView"
          clearable
          :placeholder="$t('Please enter a view name')"
        />
      </div>

      <div class="addView-line">
        <div class="addView-line-label theme-view-text-color">{{ $t('View type') }}</div>
        <el-select
          filterable
          v-model="searchViewType"
          :placeholder="$t('Please select the view type')"
          style="width: 50%"
        >
          <el-option
            v-for="item in searchViewTypeList"
            :key="item.value"
            :label="$t(item.label)"
            :value="item.value"
          >
            <application-menu
              v-if="item.value === 'all'"
              class="view-name-icon"
              theme="outline"
              size="14"
              strokeLinejoin="bevel"
            />
            <all-application
              v-if="item.value === 'gallery'"
              class="view-name-icon"
              theme="outline"
              size="14"
            />

            <calendar
              v-if="item.value === 'unknown'"
              class="view-name-icon"
              theme="outline"
              size="14"
              strokeLinejoin="bevel"
              strokeLinecap="square"
            />

            <align-top-two
              v-if="item.value === 'kanban'"
              class="view-name-icon"
              theme="outline"
              size="14"
            />

            <align-right-two
              v-if="item.value === 'gantt'"
              theme="outline"
              class="view-name-icon"
              size="14"
            />

            <!-- <grid-nine
              v-if="item.value === 'grid'"
              theme="outline"
              class="view-name-icon"
              size="14"
              strokeLinejoin="bevel"
            /> -->

            <img
              v-if="item.value === 'grid' && searchViewType !== 'grid'"
              src="@/assets/table.svg"
              style="width: 16px; height: 16px"
              class="view-name-icon"
            />

            <img
              v-if="item.value === 'grid' && searchViewType === 'grid'"
              src="@/assets/table2.svg"
              style="width: 16px; height: 16px"
              class="view-name-icon"
            />

            <check-correct
              v-if="item.value === 'form'"
              theme="outline"
              class="view-name-icon"
              size="14"
              strokeLinejoin="bevel"
            />
            <span>
              {{ $t(item.label) }}
            </span>
          </el-option>
        </el-select>
      </div>
      <!-- 
      <div
        class="addView-line"
        v-if="showViewTag"
      >
        <div class="addView-line-label theme-view-text-color">视图标签：</div>
        <el-select
          v-model="viewTags"
          multiple
          placeholder="请选择视图标签"
          filterable
          collapse-tags
          :max-collapse-tags="1"
          collapse-tags-tooltip
          style="width: 50%"
        >
          <el-option
            v-for="item in tagOptionList"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </div> -->

      <div>
        <el-button
          @mousedown="(e) => e.preventDefault()"
          type="primary"
          @click="searchView"
        >
          <el-icon><Search /></el-icon>
          <span>{{ $t('Search') }}</span>
        </el-button>

        <el-button
          @mousedown="(e) => e.preventDefault()"
          @click="reset"
        >
          <el-icon><Refresh /></el-icon>
          <span>{{ $t('Reset') }}</span>
        </el-button>

        <el-button
          style="margin-left: 20px"
          type="primary"
          plain
          @click="addView"
          @mousedown="(e) => e.preventDefault()"
        >
          <el-icon><Plus /></el-icon>
          <span>{{ $t('Add View') }}</span>
        </el-button>
      </div>
    </div>
    <div
      v-loading="loading"
      :element-loading-text="$t('Loading')"
    >
      <div
        class="total-text theme-view-text-color"
        v-show="!loading"
        style="margin-top: 15px"
      >
        {{ $t('selected') }}<span style="color: rgb(20, 86, 240)">{{ selectViewIdList.length }}</span
        ><span style="color: #9ca3af">/</span>{{ filterViewList.length }}
      </div>
      <div
        v-show="loading"
        class="total-text"
      ></div>

      <div
        class="table-top"
        v-if="showTableTop && !loading"
        @click="() => scrollTable(0)"
      >
        <el-icon
          color="rgb(20, 86, 240)"
          size="30"
          ><CaretTop
        /></el-icon>
      </div>

      <div class="view-table">
        <!-- :data="viewList" -->
        <el-table
          ref="tableRef"
          :data="filterViewList"
          @selection-change="handleSelectionChange"
          max-height="49vh"
          :empty-text="$t('no data')"
        >
          <el-table-column
            class="table-index"
            type="index"
            width="40"
          />
          <el-table-column
            v-if="filterViewList.length >= 1"
            class="custom-checkbox"
            :selectable="selectable"
            type="selection"
            width="30"
          />

          <el-table-column
            :label="$t('view name1')"
            align="center"
            :min-width="120"
          >
            <!-- <template #default="scope">{{ scope.row.name }}</template> -->

            <template #default="scope">
              <div
                :title="scope.row.view_name"
                class="view-name"
              >
                <all-application
                  v-if="scope.row?.view_type === 'gallery'"
                  class="view-name-icon"
                  theme="outline"
                  size="20"
                  :fill="activeViewId !== scope.row.view_id ? '#aacefb' : 'rgb(20, 86, 240)'"
                />

                <calendar
                  v-if="scope.row?.view_type === 'unknown'"
                  class="view-name-icon"
                  theme="outline"
                  size="20"
                  :fill="activeViewId !== scope.row.view_id ? '#aacefb' : 'rgb(20, 86, 240)'"
                  strokeLinejoin="bevel"
                  strokeLinecap="square"
                />

                <align-top-two
                  v-if="scope.row?.view_type === 'kanban'"
                  class="view-name-icon"
                  theme="outline"
                  size="20"
                  :fill="activeViewId !== scope.row.view_id ? '#aacefb' : 'rgb(20, 86, 240)'"
                />

                <align-right-two
                  v-if="scope.row?.view_type === 'gantt'"
                  theme="outline"
                  class="view-name-icon"
                  size="20"
                  :fill="activeViewId !== scope.row.view_id ? '#aacefb' : 'rgb(20, 86, 240)'"
                />
                <!-- 
                <grid-nine
                  v-if="scope.row?.view_type === 'grid'"
                  theme="outline"
                  class="view-name-icon"
                  size="20"
                  :fill="activeViewId !== scope.row.view_id ? '#aacefb' : 'rgb(20, 86, 240)'"
                  strokeLinejoin="bevel"
                /> -->

                <img
                  v-if="scope.row?.view_type === 'grid' && activeViewId !== scope.row.view_id"
                  src="@/assets/table1.svg"
                  style="width: 22px; height: 24px; margin-right: 5px"
                />

                <img
                  v-if="scope.row?.view_type === 'grid' && activeViewId === scope.row.view_id"
                  src="@/assets/table2.svg"
                  style="width: 22px; height: 24px; margin-right: 5px"
                />

                <check-correct
                  v-if="scope.row?.view_type === 'form'"
                  theme="outline"
                  class="view-name-icon"
                  size="20"
                  :fill="activeViewId !== scope.row.view_id ? '#aacefb' : 'rgb(20, 86, 240)'"
                  strokeLinejoin="bevel"
                />
                <el-button
                  @mousedown="(e) => e.preventDefault()"
                  class="single-line-ellipsis"
                  v-show="!item?.isEditing && activeButtonId !== scope.row.view_id"
                  :style="{ width: '100%' }"
                  type="primary"
                  :plain="theme === 'LIGHT' && activeViewId !== scope.row.view_id"
                  @click="switchView(scope.row.view_id)"
                  @dblclick="handleEdit(scope.row.view_id)"
                  >{{ scope.row.view_name }}</el-button
                >
                <el-input
                  v-if="(item?.isEditing && isEditing) || activeButtonId === scope.row.view_id"
                  ref="editInput"
                  @blur="endEditing(scope.row.view_id, scope.row.view_name)"
                  @keydown.enter="endEditing(scope.row.view_id, scope.row.view_name)"
                  :model-value="scope.row.view_name"
                  @change="(value) => handleFileName(value, scope.row.view_id)"
                  @input="(value) => (scope.row.view_name = value)"
                />
              </div>
            </template>
          </el-table-column>
          <!-- <el-table-column
            v-if="showViewTag"
            label="标签"
            :width="100"
          >
            <template #default="scope">
              <el-select
                :model-value="
                  tagsList.length > 0
                    ? tagsList[tagsList?.findIndex((item) => item?.viewId === scope.row.view_id)]?.tags
                    : []
                "
                @change="
                  (value) =>
                    updateTags(
                      tagsList.findIndex((item) => item?.viewId === scope.row.view_id),
                      value,
                    )
                "
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="1"
                multiple
                filterable
                allow-create
                default-first-option
                :reserve-keyword="false"
                placeholder="选择标签"
                style="width: 120px"
              >
                <el-option
                  v-for="item in tagOptionList"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </template>
          </el-table-column> -->
          <el-table-column
            v-if="viewList.length > 1"
            property="name"
            :label="$t('operation')"
            width="70"
          >
            <template #default="scope">
              <!-- FIXME 暂时不需求编辑操作 -->
              <!-- <el-button
              size="small"
              @click="handleEdit(scope.row.view_id)"
              link
              ><el-icon size="14"><Edit /></el-icon
            ></el-button> -->

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
                @mousedown="(e) => e.preventDefault()"
                v-if="viewList.length > 1 || viewRange !== 1"
                size="small"
                type="danger"
                link
                @click="handleDelete(scope.$index, scope.row.view_id)"
                ><el-icon size="20"><Delete /></el-icon
              ></el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <!-- 
      <div
        class="select-text theme-view-text-color"
        v-if="filterViewList.length >= 1"
      >
        {{ $t('selected', [selectViewIdList.length]) }}
      </div> -->

      <div
        class="delete-button"
        v-if="filterViewList.length >= 1"
      >
        <el-popconfirm
          v-if="filterViewList.length > 1"
          :visible.sync="popconfirmVisible"
          width="60vw"
          :confirm-button-text="$t('Confirm')"
          :cancel-button-text="$t('Cancel')"
          @confirm="confirmBatchDelete"
          @cancel="() => (popconfirmVisible = false)"
          :icon="InfoFilled"
          icon-color="rgb(20, 86, 240)"
          cancel-button-type="info"
          :hide-after="50"
          :title="$t('Confirm deletion of the selected', [selectViewIdList.length])"
        >
          <template #reference>
            <el-button
              @mousedown="(e) => e.preventDefault()"
              @click="batchDelete"
              type="danger"
              color="#F54A45"
            >
              <el-icon><Delete /></el-icon>
              <span>{{ $t('batch deletion') }}</span>
            </el-button>
          </template>
        </el-popconfirm>

        <el-button
          @mousedown="(e) => e.preventDefault()"
          @click="batchAllViewField"
          type="primary"
        >
          <preview-open
            theme="outline"
            size="18"
            strokeLinecap="square"
            style="margin-right: 5px"
          />
          <span>{{ $t('Batch configure field hiding') }}</span>
        </el-button>
      </div>
    </div>
    <Drawer
      v-model:model-value="addViewDrawer"
      :view-list="viewList"
      :getViewMetaList="getViewMetaList"
      @confirmAddView="confirmAddView"
    />

    <AllViewFieldDrawer
      v-model:model-value="batchAllViewFieldDrawer"
      :selectViewIdList="selectViewIdList"
      @confirmAddView="confirmBatchViewField"
    />
  </div>
  <div v-else>
    <el-result
      icon="error"
      :title="$t('format error')"
      :sub-title="$t('Please select the data table format')"
    >
      <template #extra>
        <img
          class="error"
          src="../assets/error.png"
          :alt="$t('format error')"
        />
        <el-button
          @mousedown="(e) => e.preventDefault()"
          type="primary"
          @click="goDataBase"
          >{{ $t('Back to the first data table') }}</el-button
        >
      </template>
    </el-result>
  </div>
</template>

<style scoped>
  .field-manager {
    font-family: LarkHackSafariFont, LarkEmojiFont, LarkChineseQuote, -apple-system, BlinkMacSystemFont, Helvetica Neue,
      Tahoma, PingFang SC, Microsoft Yahei, Arial, Hiragino Sans GB, sans-serif, Apple Color Emoji, Segoe UI Emoji,
      Segoe UI Symbol, Noto Color Emoji;
    /* font-weight: 300; */
  }

  .tips {
    font-size: 12px;
    margin: 10px 0;
    color: #646a73;
  }

  .batch-button {
    /* margin-bottom: 14px; */
  }

  .addView {
    margin: 10px 0;
  }

  .addView-line-new-label {
    display: flex;
    align-items: center;
    user-select: none; /* 标准属性 */
    -webkit-user-select: none; /* 兼容 Chrome、Safari */
    -moz-user-select: none; /* 兼容 Firefox */
    -ms-user-select: none; /* 兼容 IE */

    color: #616466;
    font-size: 12px;
    /* margin-bottom: 10px; */
    /* margin-top: 2px; */

    span {
      padding-left: 2px;
    }
  }

  .addView-line {
    margin-bottom: 12px;
    display: flex;
    align-items: center;

    .addView-line-label {
      width: 75px;
      font-size: 14px;
      white-space: nowrap;
    }

    .addView-line-addField-label {
      margin-right: 10px;
      font-size: 14px;
      white-space: nowrap;
    }

    .addView-line-labelDialog {
      width: 125px;
    }
  }

  .addView-line-switch {
    height: 24px;
    margin-bottom: 0;
  }

  .total-text {
    height: 14px;
    line-height: 14px;
    font-size: 14px;
  }

  .select-text {
    margin-top: 5px;
    font-size: 14px;
    height: 14px;
    line-height: 14px;
  }

  .view-name {
    display: flex;
    align-items: center;
  }

  .view-name-icon {
    margin-right: 5px;
    position: relative;
    top: 2px;
  }

  .single-line-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :deep(.el-dialog) {
    border-radius: 4px;
  }

  :deep(.el-dialog__header) {
    /* color: red !important; */
    /* background-color: #f5f6f7; */
    margin-right: 0;
    border-radius: 4px;
  }

  :deep(.el-collapse-item__content) {
    padding-bottom: 5px;
  }

  :deep(.el-collapse-item__header) {
    height: 40px;
  }

  .table-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 999;
    position: absolute;
    bottom: 6.2%;
    right: 19%;
    border-radius: 100%;
    border: 1px solid #2955e750;
    background: #eef5fe;
    :hover {
      cursor: pointer;
      background: #2955e710;
      border-radius: 100%;
    }
  }

  .view-table {
    /* height: 55vh; */
  }

  .delete-button {
    margin-top: 10px;
  }

  .error {
    width: 100%;
    height: 50%;
    margin-top: -40px;
  }

  .el-divider--horizontal {
    margin: 8px 0;
  }

  /* 自定义勾选框样式 */
  :deep(.el-checkbox__input) {
    zoom: 130%;
    /* background-color: red; */
  }

  :deep(.el-table .cell) {
    padding: 0 7px;
  }

  .async-set-icon {
    margin: 10px 0;
  }

  .async-set {
    margin: 10px 0 20px 0;
  }

  .setRawHeight {
    display: flex;
    align-items: center;
    margin-top: 10px;
    white-space: nowrap;
  }
</style>
