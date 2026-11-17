import React, { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  DownOutlined
} from '@ant-design/icons';
import { Button, ConfigProvider, Layout, Menu, theme, Dropdown, Space } from 'antd';
import AuthorizedRoutes, { sidebarItemsList } from './AuthorizedRoutes';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import brandLogo from '../../assets/logo.webp'
import { useAppSelector, useAppDispatch } from '../../redux/useTypedSelectors';
import { logout } from '../../redux/reducers/authSlice';

const { Header, Sider, Content } = Layout;

const Navigation: React.FC = () => {

  const dispatch = useAppDispatch();

  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const navigate  = useNavigate();
  const location  = useLocation();

  const activeURL = () => [location.pathname.split("/")[1]];

  const { user } = useAppSelector(state => state.auth);

  if (!(user?.email)) {
    return <Navigate to="/login" />;
  }

  const items = [
    {
      label: "Log Out",
      key: 1,
      danger: true,
      icon: <LogoutOutlined />,
      onClick: () => dispatch(logout()),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>

      {/* ── Sidebar ── */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ height: '100vh', position: 'sticky', top: 0, left: 0, overflow: 'hidden' }}
      >
        {/* Logo */}
        <div className="bg-black">
          <img src={brandLogo} className="h-[64px] w-full object-contain" />
        </div>

        {/* Menu — scrollable, fills remaining height minus logo + footer */}
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#8d13ff',        // purple-500 — drives selected bg on dark Menu
            },
            components: {
              Menu: {
                darkItemSelectedBg: '#9a2dff', // purple-500
                itemSelectedBg:     '#8400ff',
                itemSelectedColor:  '#ffffff',
                itemHoverBg:        '#7e22ce', // purple-800
                itemHoverColor:     '#ffffff',
              },
            },
          }}
        >
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            selectedKeys={activeURL()}
            items={sidebarItemsList}
            onClick={value => navigate(`/${value?.key}`)}
            style={{ height: 'calc(100vh - 107px)', overflowY: 'auto' }}
          />
        </ConfigProvider>

        {/* Footer */}
        <p className="text-white text-center text-xs">&copy; ACME</p>
      </Sider>

      {/* ── Main area ── */}
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div className="flex justify-between w-[99%]">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Dropdown menu={{ items }} trigger={['click']}>
              <a onClick={(e) => e.preventDefault()} className="text-purple-700 font-bold">
                <Space>
                  Hi! {user?.firstname}
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
            minHeight: 'calc(100vh - 88px)',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <AuthorizedRoutes />
        </Content>
      </Layout>

    </Layout>
  );
};

export default Navigation;