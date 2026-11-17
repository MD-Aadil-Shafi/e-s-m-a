import { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import { IoAdd } from "react-icons/io5";
import { DollarOutlined, EditOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useAppDispatch, useAppSelector } from "../../redux/useTypedSelectors";
import { getSalaryList } from "../../redux/reducers/salarySlice";
import type { SalaryRecord } from "../../redux/reducers/salarySlice";
import RenderTableAction from "../../utils/RenderTableAction";
import { customTailwind } from "../../utils/styles";

type ActionItemType = NonNullable<MenuProps["items"]>[number];

const MONTHS = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const statusColor: Record<string, string> = {
    processed:    "green",
    pending: "orange",
    failed:  "red",
};

const fmt = (val: string) =>
    Number(val).toLocaleString("en-IN", { style: "currency", currency: "INR" });

type Props = {
    employeeId: number;
    onAddSalary: () => void;
    onEditSalary: (record: SalaryRecord) => void;
    onConfirmPayment: (record: SalaryRecord) => void;
};

const SalaryTable = ({ employeeId, onAddSalary, onEditSalary, onConfirmPayment }: Props) => {
    const dispatch = useAppDispatch();
    const { salaryListLoading, salaryList } = useAppSelector((s) => s.salary);

    useEffect(() => {
        dispatch(getSalaryList(employeeId));
    }, [employeeId]);

    const columns = [
        {
            title: "Month / Year",
            key: "month",
            width: "120px",
            render: (_: any, r: SalaryRecord) =>
                `${MONTHS[r.payroll_month]} ${r.payroll_year}`,
        },
        {
            title: "Base Salary",
            dataIndex: "base_salary",
            key: "base_salary",
            width: "130px",
            render: (v: string) => fmt(v),
        },
        {
            title: "Allowances",
            dataIndex: "allowances",
            key: "allowances",
            width: "120px",
            render: (v: string) => (
                <span className="text-green-600">{fmt(v)}</span>
            ),
        },
        {
            title: "Deductions",
            dataIndex: "deductions",
            key: "deductions",
            width: "120px",
            render: (v: string) => (
                <span className="text-red-500">{fmt(v)}</span>
            ),
        },
        {
            title: "Gross",
            dataIndex: "gross_salary",
            key: "gross_salary",
            width: "130px",
            render: (v: string) => (
                <span className="font-semibold">{fmt(v)}</span>
            ),
        },
        {
            title: "Net Pay",
            dataIndex: "net_salary",
            key: "net_salary",
            width: "130px",
            render: (v: string) => (
                <span className="font-bold text-purple-600">{fmt(v)}</span>
            ),
        },
        {
            title: "Days",
            key: "days",
            width: "160px",
            render: (_: any, r: SalaryRecord) => (
                <span className="text-xs text-slate-500">
                    {r.paid_days}P / {r.unpaid_days}U / {r.working_days}W / {r.total_days}T
                </span>
            ),
        },
        {
            title: "Payment Date",
            dataIndex: "payment_date",
            key: "payment_date",
            width: "130px",
            render: (v: string | null) =>
                v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
        },
        {
            title: "Status",
            dataIndex: "payment_status",
            key: "payment_status",
            width: "100px",
            render: (v: string) => (
                <Tag color={statusColor[v?.toLowerCase()] ?? "default"}>
                    {v}
                </Tag>
            ),
        },
        {
            title: "Action",
            key: "action",
            width: "100px",
            render: (_: any, record: SalaryRecord) => {
                const items: ActionItemType[] = [
                    {
                        label: "Edit",
                        key: 1,
                        icon: <EditOutlined />,
                        onClick: () => onEditSalary(record),
                    },
                    {
                        label: "Confirm Payment Manually",
                        key: 2,
                        icon: <DollarOutlined />,
                        onClick: () => onConfirmPayment(record),
                    },
                ];
                return <RenderTableAction items={items} />;
            },
        },
    ];

    return (
        <div className="mt-8">
            {/* ── Section header ── */}
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-slate-700">
                    Monthly Salary Details
                </h3>
                <button
                    onClick={onAddSalary}
                    className={`${customTailwind.purpleGradient} text-white px-3 py-1 shadow rounded flex items-center gap-1 text-sm`}
                >
                    <IoAdd size={18} /> Add Salary
                </button>
            </div>

            {/* ── Table ── */}
            <Table
                dataSource={salaryList}
                columns={columns}
                rowKey={(r) => r.id}
                pagination={false}
                loading={salaryListLoading}
                bordered
                scroll={{ x: "max-content" }}
                size="small"
            />
        </div>
    );
};

export default SalaryTable;
