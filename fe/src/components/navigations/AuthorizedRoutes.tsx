import {type ReactNode, Suspense, lazy} from 'react'
import { CgOrganisation } from "react-icons/cg";
import { MdSpaceDashboard, MdOutlineWorkHistory } from "react-icons/md";
import { Route, Routes } from "react-router-dom";
import { Spin } from "antd";
import type { MenuProps } from 'antd';

//routes
const Dashboard = lazy(() => import("../../pages/Dashboard"));
const NotFound = lazy(() => import("./NotFound"));
const Employees = lazy(()=> import("../../pages/Employees"));
const Salaries = lazy(()=> import('../../pages/Salaries'));
const EmployeeLogs = lazy(() => import("../../pages/EmployeeLogs"));
const EmployeeSalary = lazy(() => import("../../pages/EmployeeSalary"));


// interface SidebarItem {
//   key: string;
//   label: string;
//   icon: ReactNode;
//   children?: SidebarItem[];
// }
type SidebarItem = NonNullable<MenuProps["items"]>[number];
const getItem = (
  label: string,
  key: string,
  icon?: ReactNode,
  children?: SidebarItem[]
): SidebarItem => {
  return {
    key,
    icon,
    label,
    children,
  };
};

export const sidebarItemsList: MenuProps['items'] = [
	getItem("Dashboard", "dashboard", <MdSpaceDashboard className="fs-4" />),
	getItem("Employees", "employees", <MdOutlineWorkHistory className="fs-4" />),
	getItem("Salaries", "salaries", <CgOrganisation className="fs-4" />)

];

const getFallbackUI = () => (
	<div className="flex h-[100vh] w-full justify-center items-center">
		<Spin
			size="large"
		/>
	</div>
);

const AuthorizedRoutes = () => {
  return (
    <Suspense fallback={getFallbackUI()}>
		<Routes>
          <Route path='/' element={<Dashboard/>}/>
          <Route path='/dashboard' element={<Dashboard/>}/>
          <Route path='/employees' element={<Employees/>}/>
          <Route path='/log/:id' element={<EmployeeLogs/>}/>
          <Route path='/salaries' element={<Salaries/>}/>
          <Route path='/salaries/:employee_id' element={<EmployeeSalary/>}/>
          <Route path="*" element={<NotFound />} />
        </Routes>
    </Suspense>
  )
}

export default AuthorizedRoutes