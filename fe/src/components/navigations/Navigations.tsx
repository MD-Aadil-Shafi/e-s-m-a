import React, { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  DownOutlined
} from '@ant-design/icons';
import { Button, Layout, Menu, theme, Dropdown, Space } from 'antd';
import AuthorizedRoutes, { sidebarItemsList } from './AuthorizedRoutes';
import { useNavigate, useLocation } from 'react-router-dom';
import brandLogo from '../../assets/logo.webp'
import { Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/useTypedSelectors';
import { logout } from '../../redux/reducers/authSlice';

const { Header, Sider, Content } = Layout;

const Navigation: React.FC = () => {

  const dispatch = useAppDispatch();

  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

const navigate = useNavigate()

const location = useLocation()


const activeURL = () => {
  return [location.pathname.split("/")[1]]
}
// console.log(location.pathname.split("/")[1])

const {user} = useAppSelector(state => state.auth);
// console.log('user', user)
// if (!(user?.email)) {
//   return <Navigate to="/login" />;
// }

const items = [
  {
    label: "Log Out",
    key: 1,
    danger: true,
    icon: <LogoutOutlined />,
    onClick: () => dispatch(logout()),
  },
]

  return (
    <Layout>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical bg-black">
        <img src={brandLogo} className='h-[64px] w-full object-contain'/>
        </div>
        <Menu
        style={{height:'calc(100vh - 107px)', overflowY:"auto"}}
          theme="dark"
          mode="inline"
          // defaultSelectedKeys={['1']}
          defaultSelectedKeys={['dashboard']}
          selectedKeys={activeURL()}
          items={sidebarItemsList}
          onClick={value => navigate(`/${value?.key}`)}
        />
        <p className='text-white text-center'>&copy;</p>
        <p className='text-white text-center'>ACME</p>
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer}}>
          <div className='flex justify-between w-[99%]'>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          {/* <Button
            type="text"
            icon={<LogoutOutlined />}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          /> */}
          <Dropdown menu={{items}} trigger={['click']}>
          <a onClick={(e) => e.preventDefault()} className='text-purple-700 font-bold'>
            <Space className=''>
              Hi! {user?.name}
              <DownOutlined />
            </Space>
          </a>
        </Dropdown>
          </div>
          
        </Header>
        <Content
          style={{
            margin: '12px 8px',
            padding: 12,
            minHeight: 'calc(100vh - 120px)',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <AuthorizedRoutes/>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Navigation;