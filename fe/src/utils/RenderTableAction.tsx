import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Space } from 'antd';
// import { type ActionItemType } from './types';
import type { MenuProps } from "antd";

export type ActionItemType = NonNullable<MenuProps["items"]>[number];

type innerType = {
  items: ActionItemType[]
}

const RenderTableAction= ({items}:innerType) => (

  <Dropdown menu={{ items }} trigger={['click']}>
    <a onClick={(e) => e.preventDefault()} className='text-xs text-purple-500'>
      <Space className='border border-purple-500 p-1 rounded shadow'>
        Actions
        <DownOutlined />
      </Space>
    </a>
  </Dropdown>
);

export default RenderTableAction;