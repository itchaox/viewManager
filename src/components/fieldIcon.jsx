/*
 * @Version    : v1.00
 * @Author     : itchaox
 * @Date       : 2023-12-22 00:35
 * @LastAuthor : itchaox
 * @LastTime   : 2024-01-06 08:58
 * @desc       : 字段列表 icon
 */
import { defineComponent } from 'vue';

import {
  TextStyleOne,
  CheckOne,
  ListCheckbox,
  People,
  Peoples,
  Calendar,
  Link,
  Pound,
  CheckCorrect,
  LinkThree,
  Formula,
  DocSearchTwo,
  OrderedList,
  FileWithdrawalOne,
  FileConversionOne,
  EmailSuccessfully,
  PhoneTelephone,
  Local,
  PayCodeTwo,
  AlignmentVerticalLeft,
  Currency,
  Star,
} from '@icon-park/vue-next';

export default defineComponent({
  name: 'FieldIcon',
  props: {
    fieldType: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    // 访问 props 数据
    const { fieldType } = props;

    const iconStyle = {
      position: 'relative',
      top: '2px',
      marginRight: '5px',
    };

    return () => (
      <>
        {/* 文本 */}
        {fieldType === 1 && (
          <TextStyleOne
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='bevel'
          />
        )}

        {/* 单选 */}
        {fieldType === 3 && (
          <CheckOne
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='bevel'
          />
        )}

        {/* 多选 */}
        {fieldType === 4 && (
          <ListCheckbox
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='bevel'
            strokeLinecap='square'
          />
        )}

        {/* 人员 */}
        {fieldType === 11 && (
          <People
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='bevel'
            strokeLinecap='square'
          />
        )}

        {/* 群组 */}
        {fieldType === 23 && (
          <Peoples
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='bevel'
            strokeLinecap='square'
          />
        )}

        {/* 日期 */}
        {[5, 1001, 1002].includes(fieldType) && (
          <Calendar
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='bevel'
            strokeLinecap='square'
          />
        )}

        {/* 附件 */}
        {fieldType === 17 && (
          <Link
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='bevel'
            strokeLinecap='butt'
          />
        )}

        {/* 数字 */}
        {fieldType === 2 && (
          <Pound
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='bevel'
            strokeLinecap='butt'
          />
        )}

        {/* 复选框 */}
        {fieldType === 7 && (
          <CheckCorrect
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='miter'
            strokeLinecap='butt'
          />
        )}

        {/* 超链接 */}
        {fieldType === 15 && (
          <LinkThree
            theme='outline'
            size='14'
            style={iconStyle}
          />
        )}

        {/* 公式 */}
        {fieldType === 20 && (
          <Formula
            theme='outline'
            size='14'
            style={iconStyle}
          />
        )}

        {/* 查找引用 */}
        {fieldType === 19 && (
          <DocSearchTwo
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='miter'
          />
        )}

        {/* 自动编号 */}
        {fieldType === 1005 && (
          <OrderedList
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='miter'
          />
        )}

        {/* 单向关联 */}
        {fieldType === 18 && (
          <FileWithdrawalOne
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='miter'
          />
        )}

        {fieldType === 21 && (
          <FileConversionOne
            style={iconStyle}
            theme='filled'
            size='14'
          />
        )}

        {/* 邮件 */}
        {fieldType === 99005 && (
          <EmailSuccessfully
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='miter'
          />
        )}

        {/* 电话号码 */}
        {fieldType === 13 && (
          <PhoneTelephone
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='miter'
          />
        )}

        {/* 地理位置 */}
        {fieldType === 22 && (
          <Local
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinejoin='miter'
          />
        )}

        {/* 条码 */}
        {fieldType === 99001 && (
          <PayCodeTwo
            theme='outline'
            size='14'
            style={iconStyle}
          />
        )}

        {/* 进度 */}
        {fieldType === 99002 && (
          <AlignmentVerticalLeft
            theme='outline'
            size='14'
            style={iconStyle}
            strokeLinecap='square'
          />
        )}

        {/* 货币 */}
        {fieldType === 99003 && (
          <Currency
            theme='outline'
            size='14'
            style={iconStyle}
          />
        )}

        {/* 评分 */}
        {fieldType === 99004 && (
          <Star
            theme='outline'
            size='14'
            style={iconStyle}
          />
        )}
      </>
    );
  },
});
