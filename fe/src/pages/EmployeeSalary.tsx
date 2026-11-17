import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spin, Card, Descriptions, Button, Result } from "antd";
import { CloseOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../redux/useTypedSelectors";
import { getBasePay, clearBasePay } from "../redux/reducers/salarySlice";
import type { SalaryRecord } from "../redux/reducers/salarySlice";
import FormModal from "../utils/FormModal";
import AddBasePayForm from "../components/salary/modals/AddBasePayForm";
import EditBasePayForm from "../components/salary/modals/EditBasePayForm";
import AddSalaryForm from "../components/salary/modals/AddSalaryForm";
import EditSalaryForm from "../components/salary/modals/EditSalaryForm";
import ConfirmPaymentModal from "../components/salary/modals/ConfirmPaymentModal";
import SalaryTable from "../components/salary/SalaryTable";

const fmt = (val: string) =>
    Number(val).toLocaleString("en-IN", { style: "currency", currency: "INR" });

const EmployeeSalary = () => {
    const { employee_id } = useParams<{ employee_id: string }>();
    const dispatch = useAppDispatch();
    const { basePayLoading, basePay, basePayNotFound } = useAppSelector((s) => s.salary);

    const [addBasePayOpen,  setAddBasePayOpen]  = useState(false);
    const [editBasePayOpen, setEditBasePayOpen] = useState(false);

    const [addSalaryOpen,      setAddSalaryOpen]      = useState(false);
    const [editSalaryOpen,     setEditSalaryOpen]     = useState(false);
    const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
    const [selectedSalary,     setSelectedSalary]     = useState<SalaryRecord | null>(null);
    const [confirmRecord,      setConfirmRecord]      = useState<SalaryRecord | null>(null);

    const empIdNum = Number(employee_id);

    useEffect(() => {
        if (employee_id) dispatch(getBasePay(empIdNum));
        return () => { dispatch(clearBasePay()); };
    }, [employee_id]);

    useEffect(() => {
        if (basePay?.employee) {
            const { firstname, lastname } = basePay.employee;
            document.title = `${firstname} ${lastname} — Salary`;
        }
        return () => { document.title = "Employee Management"; };
    }, [basePay]);

    const employee = basePay?.employee;

    const handleEditSalary = (record: SalaryRecord) => {
        setSelectedSalary(record);
        setEditSalaryOpen(true);
    };

    const handleConfirmPayment = (record: SalaryRecord) => {
        setConfirmRecord(record);
        setConfirmPaymentOpen(true);
    };

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
                                onClick={() => setAddBasePayOpen(true)}
                            >
                                Add Base Pay
                            </Button>
                        }
                    />
                </div>

            ) : basePay ? (
                <>
                    {/* ── Base pay card ── */}
                    <div className="w-full">
                        <Card
                            title="Base Pay Details"
                            bordered
                            className="shadow-sm"
                            extra={
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-slate-400">
                                        Added{" "}
                                        {new Date(basePay.created_at).toLocaleDateString("en-IN", {
                                            day: "2-digit", month: "short", year: "numeric",
                                        })}
                                    </span>
                                    <Button
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => setEditBasePayOpen(true)}
                                    >
                                        Edit
                                    </Button>
                                </div>
                            }
                        >
                            <Descriptions column={2} bordered size="small">
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
                                        {fmt(String(Number(basePay.base_salary) + Number(basePay.allowances)))}
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

                    {/* ── Monthly salary table (only shown when base pay exists) ── */}
                    <SalaryTable
                        employeeId={empIdNum}
                        onAddSalary={() => setAddSalaryOpen(true)}
                        onEditSalary={handleEditSalary}
                        onConfirmPayment={handleConfirmPayment}
                    />
                </>
            ) : null}

            {/* ── Add Base Pay modal ── */}
            <FormModal
                open={addBasePayOpen}
                setOpen={setAddBasePayOpen}
                content={
                    <AddBasePayForm
                        employeeId={empIdNum}
                        handleClose={() => setAddBasePayOpen(false)}
                        onSuccess={() => setAddBasePayOpen(false)}
                    />
                }
            />

            {/* ── Edit Base Pay modal ── */}
            <FormModal
                open={editBasePayOpen}
                setOpen={setEditBasePayOpen}
                content={
                    basePay && (
                        <EditBasePayForm
                            initialValues={basePay}
                            handleClose={() => setEditBasePayOpen(false)}
                            onSuccess={() => setEditBasePayOpen(false)}
                        />
                    )
                }
            />

            {/* ── Add Salary modal ── */}
            <FormModal
                open={addSalaryOpen}
                setOpen={setAddSalaryOpen}
                content={
                    <AddSalaryForm
                        employeeId={empIdNum}
                        handleClose={() => setAddSalaryOpen(false)}
                        onSuccess={() => setAddSalaryOpen(false)}
                    />
                }
            />

            {/* ── Edit Salary modal ── */}
            <FormModal
                open={editSalaryOpen}
                setOpen={setEditSalaryOpen}
                content={
                    selectedSalary && (
                        <EditSalaryForm
                            initialValues={selectedSalary}
                            handleClose={() => setEditSalaryOpen(false)}
                            onSuccess={() => setEditSalaryOpen(false)}
                        />
                    )
                }
            />

            {/* ── Confirm Payment modal ── */}
            <FormModal
                open={confirmPaymentOpen}
                setOpen={setConfirmPaymentOpen}
                content={
                    confirmRecord && (
                        <ConfirmPaymentModal
                            record={confirmRecord}
                            handleClose={() => setConfirmPaymentOpen(false)}
                            onSuccess={() => setConfirmPaymentOpen(false)}
                        />
                    )
                }
            />
        </div>
    );
};

export default EmployeeSalary;
