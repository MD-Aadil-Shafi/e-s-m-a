import { useEffect } from 'react';
import { Spin, Table, Tag } from 'antd';
import {
    TeamOutlined,
    CrownOutlined,
    RiseOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../redux/useTypedSelectors';
import { getMetrics } from '../redux/reducers/metricsSlice';
import type { TopPaidEmployee, LatestEmployee, DepartmentStat, CountryStat } from '../redux/reducers/metricsSlice';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtCurrency = (val: number) =>
    val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Stat card ───────────────────────────────────────────────────────────────

type StatCardProps = {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    iconBg: string;
};

const StatCard = ({ icon, label, value, iconBg }: StatCardProps) => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 flex items-center gap-4">
        <div className={`${iconBg} text-white rounded-full p-3 text-xl flex items-center justify-center`}>
            {icon}
        </div>
        <div>
            <p className="text-xs text-slate-400 mb-0.5">{label}</p>
            <p className="text-2xl font-bold text-slate-700">{value}</p>
        </div>
    </div>
);

// ─── Component ───────────────────────────────────────────────────────────────

const Dashboard = () => {
    const dispatch = useAppDispatch();
    const { loading, metrics } = useAppSelector((s) => s.metrics);

    useEffect(() => {
        dispatch(getMetrics());
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[70vh]">
                <Spin size="large" />
            </div>
        );
    }

    if (!metrics) return null;

    // ── Table columns ──────────────────────────────────────────────────────

    const topPaidCols = [
        { title: '#',           key: 'rank', width: 40,  render: (_: any, __: any, i: number) => i + 1 },
        { title: 'Name',        key: 'name', render: (_: any, r: TopPaidEmployee) => `${r.firstname} ${r.lastname}` },
        { title: 'Department',  dataIndex: 'department', key: 'department' },
        { title: 'Country',     dataIndex: 'country',    key: 'country' },
        {
            title: 'Base Salary', dataIndex: 'base_salary', key: 'base_salary',
            render: (v: number) => <span className="font-semibold text-purple-600">{fmtCurrency(v)}</span>,
        },
    ];

    const latestCols = [
        { title: 'Name',       key: 'name',       render: (_: any, r: LatestEmployee) => `${r.firstname} ${r.lastname}` },
        { title: 'Email',      dataIndex: 'email',      key: 'email' },
        { title: 'Department', dataIndex: 'department', key: 'department' },
        { title: 'Country',    dataIndex: 'country',    key: 'country' },
        { title: 'Joined',     dataIndex: 'created_at', key: 'created_at', render: (v: string) => fmtDate(v) },
    ];

    const deptCols = [
        { title: 'Department', dataIndex: 'department',     key: 'department' },
        { title: 'Employees',  dataIndex: 'total_employees', key: 'total_employees',
          render: (v: number) => <Tag color="purple">{v}</Tag> },
    ];

    const countryCols = [
        { title: 'Country',   dataIndex: 'country',         key: 'country' },
        { title: 'Employees', dataIndex: 'total_employees', key: 'total_employees',
          render: (v: number) => <Tag color="blue">{v}</Tag> },
    ];

    return (
        <div className="p-2 space-y-6">

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<TeamOutlined />}
                    label="Total Employees"
                    value={metrics.total_employees}
                    iconBg="bg-purple-500"
                />
                <StatCard
                    icon={<CrownOutlined />}
                    label="Management Professionals"
                    value={metrics.total_management_professionals}
                    iconBg="bg-indigo-500"
                />
                <StatCard
                    icon={<RiseOutlined />}
                    label="Departments"
                    value={metrics.department_wise_employees.length}
                    iconBg="bg-sky-500"
                />
                <StatCard
                    icon={<DollarOutlined />}
                    label="Last Month Net Pay"
                    value={fmtCurrency(metrics.last_month_total_net_pay)}
                    iconBg="bg-emerald-500"
                />
            </div>

            {/* ── Top 3 paid ── */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                <h3 className="font-semibold text-slate-700 mb-3">Top 3 Paid Employees</h3>
                <Table
                    dataSource={metrics.top_3_paid_employees}
                    columns={topPaidCols}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    bordered
                />
            </div>

            {/* ── Latest + Oldest employees ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                    <h3 className="font-semibold text-slate-700 mb-3">Latest Joined</h3>
                    <Table
                        dataSource={metrics.latest_employees}
                        columns={latestCols}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        bordered
                        scroll={{ x: 'max-content' }}
                    />
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                    <h3 className="font-semibold text-slate-700 mb-3">Oldest Employees</h3>
                    <Table
                        dataSource={metrics.oldest_employees}
                        columns={latestCols}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        bordered
                        scroll={{ x: 'max-content' }}
                    />
                </div>
            </div>

            {/* ── Department + Country breakdown ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                    <h3 className="font-semibold text-slate-700 mb-3">Department Breakdown</h3>
                    <Table
                        dataSource={metrics.department_wise_employees}
                        columns={deptCols}
                        rowKey="department"
                        pagination={false}
                        size="small"
                        bordered
                    />
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                    <h3 className="font-semibold text-slate-700 mb-3">Country Breakdown</h3>
                    <Table
                        dataSource={metrics.country_wise_employees}
                        columns={countryCols}
                        rowKey="country"
                        pagination={false}
                        size="small"
                        bordered
                    />
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
