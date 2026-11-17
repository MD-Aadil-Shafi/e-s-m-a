import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Spin, Card, Descriptions, Button, Result } from "antd";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../redux/useTypedSelectors";
import { getBasePay, clearBasePay } from "../redux/reducers/salarySlice";

const fmt = (val: string) =>
    Number(val).toLocaleString("en-IN", { style: "currency", currency: "INR" });

const EmployeeSalary = () => {
    const { employee_id } = useParams<{ employee_id: string }>();
    const dispatch = useAppDispatch();
    const { basePayLoading, basePay, basePayNotFound } = useAppSelector(
        (s) => s.salary
    );

    useEffect(() => {
        if (employee_id) {
            dispatch(getBasePay(Number(employee_id)));
        }
        return () => {
            dispatch(clearBasePay());
        };
    }, [employee_id]);

    // Set tab title once employee data is available
    useEffect(() => {
        if (basePay?.employee) {
            const { firstname, lastname } = basePay.employee;
            document.title = `${firstname} ${lastname} — Salary`;
        }
        return () => {
            document.title = "Employee Management";
        };
    }, [basePay]);

    const employee = basePay?.employee;

    return (
        <div className="p-4">
            {/* ── Header ── */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => window.close()}
                    className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors"
                >
                    <CloseOutlined /> Close Tab
                </button>

                <div>
                    <h2 className="text-xl font-bold">
                        {employee
                            ? `${employee.firstname} ${employee.lastname} — Salary`
                            : "Employee Salary"}
                    </h2>
                    {employee && (
                        <p className="text-slate-400 text-sm">
                            {employee.designation} · {employee.department} · {employee.email}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Content ── */}
            {basePayLoading ? (
                <div className="flex justify-center items-center min-h-[60vh]">
                    <Spin size="large" />
                </div>
            ) : basePayNotFound ? (
                /* ── No base pay exists yet ── */
                <div className="flex justify-center items-center min-h-[55vh]">
                    <Result
                        status="info"
                        title="No Base Pay Found"
                        subTitle="This employee does not have a base pay record yet. Create one to get started."
                        extra={
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                className="bg-purple-500 hover:bg-purple-600 border-none"
                                onClick={() => {
                                    // TODO: wire up Add Base Pay action
                                }}
                            >
                                Add Base Pay
                            </Button>
                        }
                    />
                </div>
            ) : basePay ? (
                /* ── Base pay card ── */
                <div className="max-w-2xl">
                    <Card
                        title="Base Pay Details"
                        bordered
                        className="shadow-sm"
                        extra={
                            <span className="text-xs text-slate-400">
                                Added {new Date(basePay.created_at).toLocaleDateString("en-IN", {
                                    day: "2-digit", month: "short", year: "numeric",
                                })}
                            </span>
                        }
                    >
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Employee">
                                {employee?.firstname} {employee?.lastname}
                            </Descriptions.Item>
                            <Descriptions.Item label="Department">
                                {employee?.department}
                            </Descriptions.Item>
                            <Descriptions.Item label="Designation">
                                {employee?.designation}
                            </Descriptions.Item>
                            <Descriptions.Item label="Base Salary">
                                <span className="font-semibold text-purple-600">
                                    {fmt(basePay.base_salary)}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Allowances">
                                <span className="font-semibold text-green-600">
                                    {fmt(basePay.allowances)}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Total (CTC)">
                                <span className="font-bold text-slate-700">
                                    {fmt(
                                        String(
                                            Number(basePay.base_salary) +
                                            Number(basePay.allowances)
                                        )
                                    )}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Joining Date">
                                {employee?.joining_date
                                    ? new Date(employee.joining_date).toDateString()
                                    : "—"}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </div>
            ) : null}
        </div>
    );
};

export default EmployeeSalary;
