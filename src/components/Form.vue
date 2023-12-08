<!--
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-09-26 15:10
 * @LastAuthor : itchaox
 * @LastTime   : 2023-12-08 08:29
 * @desc       : 
-->
<script setup>
  import { bitable } from '@lark-base-open/js-sdk';
  import { nextTick, onMounted, ref, toRaw } from 'vue';
  import axios from 'axios';

  const base = bitable.base;

  const viewList = ref();
  const table = ref();

  const selectViewIdList = ref([]);

  const baseId = ref();
  const tableId = ref();

  onMounted(async () => {
    getViewMetaList();

    const selection = await bitable.base.getSelection();
    baseId.value = selection.baseId;
    tableId.value = selection.tableId;
  });

  base.onSelectionChange(async () => {
    getViewMetaList();
  });

  const tenant_access_token = ref();

  // 是否验证成功
  const Verify = ref(false);

  async function getTenantAccessToken() {
    const apiUrl = '/api/open-apis/auth/v3/tenant_access_token/internal';

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
        ElMessage({
          type: 'success',
          message: '企业凭证调用成功~',
          duration: 1500,
        });
      }
      // expire 时间到了自动刷新问题, 分钟
    } catch (error) {
      // 弹出提示用户错误信息

      // ElMessage({
      //     type:'success',
      //     message: '企业凭证调用成功~'
      //   })
      console.error('Error:', error.message);
      throw error;
    }
  }

  // 表格的管理员 user_id 列表
  const fullAccessIdList = ref([]);

  // TODO 到时候, 拿到个人视图的 user_id 在 fullAccessIdList 中查找即可

  /**
   * @desc  : 获取协作者列表
   */
  async function getMemberList() {
    const apiUrl = '/api/open-apis/drive/permission/member/list';

    const data = {
      token: baseId.value,
      type: 'bitable',
    };

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${tenant_access_token.value}`,
    };

    try {
      const response = await axios.post(apiUrl, data, { headers });
      // 处理响应数据
      if (response?.status === 200) {
        // const members = [
        //   {
        //     member_type: 'chat',
        //     member_open_id: 'oc_b9be4164d821f466310bc22bb2979cc7',
        //     member_user_id: 'oc_b9be4164d821f466310bc22bb2979cc7',
        //     perm: 'full_access',
        //   },
        //   {
        //     member_type: 'user',
        //     member_open_id: 'ou_65b0affcc6c342a50e4c66f700137b64',
        //     member_user_id: '96g3c421',
        //     perm: 'view',
        //   },
        //   {
        //     member_type: 'user',
        //     member_open_id: 'ou_b47765834b6bdc18c47a57340f98c0e5',
        //     member_user_id: 'bg36b129',
        //     perm: 'edit',
        //   },
        // ];

        const members = response?.data?.data?.members;

        members.forEach((item) => {
          if (item.perm === 'full_access') {
            fullAccessIdList.value.push(item.member_user_id);
          }
        });

        console.log('full ', fullAccessIdList.value);
        // tenant_access_token.value = response?.data?.tenant_access_token;
      }
      // expire 时间到了自动刷新问题, 分钟
    } catch (error) {
      // 弹出提示用户错误信息

      // ElMessage({
      //     type:'success',
      //     message: '企业凭证调用成功~'
      //   })
      console.error('Error:', error.message);
      throw error;
    }
  }

  async function getViewAllList() {
    const apiUrl = `api/open-apis/bitable/v1/apps/${baseId.value}/tables/${tableId.value}/views`;

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${tenant_access_token.value}`,
    };

    try {
      // 发起带有 Authorization 头的 GET 请求
      const response = await axios.get(apiUrl, { headers });

      if (response?.data?.code === 0) {
        viewList.value = response.data?.data?.items;
        handlerViewList();

        ElMessage({
          type: 'success',
          message: '数据查询成功~',
          duration: 1500,
        });
      }
    } catch (error) {
      // 处理错误
      console.error('Error:', error.message);
      throw error;
    }
  }

  async function getViewMetaList() {
    table.value = await base.getActiveTable();

    viewList.value = await toRaw(table.value).getViewMetaList();

    handlerViewList();
  }

  function handlerViewList() {
    if (userType.value === 1) {
      viewList.value = viewList.value.map((item) => {
        return { view_id: item.id, view_name: item.name, view_type: mapViewType(item.type), isEditing: false };
      });
    } else {
      viewList.value = viewList.value.map((item) => ({ ...item, isEditing: false }));
    }
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
    selectViewIdList.value = val.map((item) => item.view_id);
  };

  /**
   * @desc  : 修改视图名
   * @param  {any} view_name 名字
   * @param  {any} view_id 视图 id
   */
  function handleFileName(view_name, view_id) {
    toRaw(table.value).setView(view_id, {
      name: view_name,
    });
  }

  /**
   * @desc  : 单个删除
   * @param  {any} index 索引
   * @param  {any} row 行数据
   */
  async function handleDelete(index, view_id) {
    await toRaw(table.value).deleteView(view_id);
    viewList.value = await toRaw(table.value).getViewMetaList();
    handlerViewList();
  }

  /**
   * @desc  : 批量删除
   */
  async function batchDelete() {
    for (const view_id of selectViewIdList.value) {
      await toRaw(table.value).deleteView(view_id);
    }
    viewList.value = await toRaw(table.value).getViewMetaList();
    handlerViewList();
  }

  // 编辑视图
  async function handleEdit(index, view_id) {
    isEditing.value = true;
    activeButtonId.value = view_id;

    viewList.value = viewList.value.map((item) => {
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
    openAddView.value = true;
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

  const newViewType = ref(1);
  const newViewName = ref();

  const addViewType = ref(1);
  const addViewName = ref();

  //  查询的类型下拉, 对齐字符串字典
  const searchViewTypeList = ref([
    { value: 'all', label: '全部视图' },
    { value: 'grid', label: '表格视图' },
    { value: 'kanban', label: '看板视图' },
    { value: 'form', label: '表单视图' },
    { value: 'gallery', label: '画册视图' },
    { value: 'gantt', label: '甘特视图' },
    { value: 'unknown', label: '日历视图' },
  ]);

  const searchViewType = ref('all');
  const searchViewName = ref();

  const viewRangeList = ref([
    { value: 1, label: '全部视图' },
    { value: 2, label: '当前用户个人视图' },
    { value: 3, label: '非管理员个人视图' },
  ]);

  const viewRange = ref(1);

  async function confirmAddView() {
    const index = viewList.value.findIndex((item) => item.view_name === addViewName.value);
    if (index === -1) {
      await toRaw(table.value).addView({
        name: addViewName.value,
        type: addViewType.value,
      });

      const _viewList = await toRaw(table.value).getViewMetaList();
      handlerViewList(_viewList);
      addViewName.value = '';
      addViewType.value = 1;
      openAddView.value = false;

      ElMessage({
        type: 'success',
        message: '视图新增成功~',
        duration: 1500,
      });
    } else {
      ElMessage({
        type: 'error',
        message: '视图名字已存在,请重新输入!',
        duration: 1500,
      });
    }
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
  async function changeViewType(row, type) {
    await toRaw(table.value).setView({
      viewId: row.view_id,
      type: type,
    });

    viewList.value = await toRaw(table.value).getViewMetaList();
  }

  const isEditing = ref(false);

  /**
   * @desc  : 切换视图
   */
  async function switchView(view_id) {
    await bitable.ui.switchToView(toRaw(table.value).id, view_id);
  }

  const activeButtonId = ref();
  // 双击按钮开始编辑
  function startEditing(row) {
    // activeButtonId.value = row.view_id;
    // isEditing.value = true;
    viewList.value = viewList.value.map((item) => {
      // viewList.value.map((item) => {
      if (item.view_id === row.view_id) {
        item.isEditing = true;
      }
      return item;
    });

    // 在下一轮事件循环中，将输入框聚焦
    nextTick(() => {
      editInput.value.focus();
    });
  }

  // 结束编辑，例如在输入框失焦时调用
  function endEditing(view_id) {
    viewList.value = viewList.value.map((item) => {
      if (item.view_id === view_id) {
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

  /**
   * @desc  : 查询
   */
  async function searchView() {
    if (userType.value === 1) {
      // 个人用户: 手动查询
      await getViewMetaList();
      handleFilterViewList();
    } else {
      // 企业用户,通过掉接口

      getViewAllList();
    }
  }

  function handleFilterViewList() {
    // 筛选视图类型和视图名字
    viewList.value = viewList.value.filter((item) => {
      const typeMatch = searchViewType.value === 'all' || item.view_type === searchViewType.value;
      const nameMatch = !searchViewName.value || item?.view_name?.includes(searchViewName.value);
      // debugger;
      return typeMatch && nameMatch;
    });
  }

  async function reset() {
    searchViewName.value = '';
    searchViewType.value = 'all';
    await getViewMetaList();
  }

  /**
   * @desc  : 确认信息
   */
  async function confirm() {
    await getTenantAccessToken();
    await getMemberList();
  }

  // 用户类型 1 个人用户; 2 企业用户
  const userType = ref(1);

  const appId = ref();
  const appSecret = ref();

  // 过滤之后的视图列表
  const filterViewList = ref([]);
</script>

<template>
  <div class="field-manager">
    <div class="addView-line">
      <div class="addView-line-label">用户类型:</div>
      <el-radio-group
        v-model="userType"
        size="small"
      >
        <el-radio-button :label="1"> 个人用户 </el-radio-button>
        <el-radio-button :label="2">企业用户</el-radio-button>
      </el-radio-group>
    </div>
    <div
      class="addView"
      v-if="userType === 2"
    >
      <div class="addView-line">
        <div class="addView-line-label">App ID:</div>
        <el-input
          v-model="appId"
          type="password"
          size="small"
          placeholder="请输入 App ID"
        />
      </div>

      <div class="addView-line">
        <div class="addView-line-label">App Secret:</div>
        <el-input
          v-model="appSecret"
          type="password"
          size="small"
          placeholder="请输入 App Secret"
        />
      </div>

      <div>
        <el-button
          type="primary"
          size="small"
          @click="confirm"
          >确认信息</el-button
        >
      </div>
    </div>

    <div class="batch-button">
      <el-button
        @click="batchDelete"
        type="danger"
        size="small"
        >批量删除</el-button
      >
      <el-button
        type="primary"
        size="small"
        @click="addView"
        >新增视图</el-button
      >
    </div>

    <!-- 新增视图 -->
    <el-dialog
      v-model="openAddView"
      title="新增视图"
    >
      <div class="addView">
        <div class="addView-line">
          <div class="addView-line-label">视图名称:</div>
          <el-input
            v-model="addViewName"
            size="small"
            placeholder="请输入视图名字"
          />
        </div>

        <div class="addView-line">
          <div class="addView-line-label">视图类型:</div>
          <el-select
            v-model="addViewType"
            placeholder="请选择视图类型"
            size="small"
          >
            <el-option
              v-for="item in addViewTypeList"
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
            >确定</el-button
          >

          <el-button
            size="small"
            @click="cancel"
            >取消</el-button
          >
        </div>
      </div>
    </el-dialog>

    <!-- TODO 批量新增 -->

    <div class="addView">
      <div
        class="addView-line"
        v-if="userType === 2 && Verify"
      >
        <div class="addView-line-label">视图范围:</div>
        <el-select
          v-model="viewRange"
          placeholder="请选择视图范围"
          size="small"
        >
          <el-option
            v-for="item in viewRangeList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>

      <div class="addView-line">
        <div class="addView-line-label">视图名称:</div>
        <el-input
          v-model="searchViewName"
          size="small"
          placeholder="请输入视图名字"
        />
      </div>

      <div class="addView-line">
        <div class="addView-line-label">视图类型:</div>
        <el-select
          v-model="searchViewType"
          placeholder="请选择视图类型"
          size="small"
        >
          <el-option
            v-for="item in searchViewTypeList"
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
          @click="searchView"
          >查询</el-button
        >

        <el-button
          size="small"
          @click="reset"
          >重置</el-button
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
          <div :title="scope.row.view_name">
            <el-button
              v-show="!item?.isEditing && activeButtonId !== scope.row.view_id"
              @click="switchView(scope.row.view_id)"
              >{{ scope.row.view_name }}</el-button
            >
            <!-- FIXME 双击直接编辑暂时不做 @dblclick="startEditing(scope.row)" -->
            <el-input
              v-show="(item?.isEditing && isEditing) || activeButtonId === scope.row.view_id"
              ref="editInput"
              @blur="endEditing(scope.row.view_id)"
              :model-value="scope.row.view_name"
              @change="(value) => handleFileName(value, scope.row.view_id)"
              @input="(value) => (scope.row.view_name = value)"
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
            @click="handleEdit(scope.$index, scope.row.view_id)"
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
            @click="handleDelete(scope.$index, scope.row.view_id)"
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
