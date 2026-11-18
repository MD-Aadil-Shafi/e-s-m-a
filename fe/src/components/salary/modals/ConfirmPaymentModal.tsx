import { useState } from "react";
import { Alert, Radio } from "antd";
import { CheckCircleOutlined, PauseCircleOutlined } from "@ant-design/icons";
import FormFooter from "../../../utils/FormFooter";
import { useAppDispatch, useAppSelector } from "../../../redux/useTypedSelectors";
import { confirmPayment } from "../../../redux/reducers/salarySlice";
import type { SalaryRecord } from "../../../redux/reducers/salarySlice";

const MONTHS = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

type Props = {
    record: SalaryRecord;
    handleClose: () => void;
    onSuccess: () => void;
};

const ConfirmPaymentModal = ({ record, handleClose, onSuccess }: Props) => {
    const dispatch = useAppDispatch();
    const { salaryMutating } = useAppSelector((s) => s.salary);
    const [status, setStatus] = useState<"PROCESSED" | "HOLD">("PROCESSED");

    const handleSubmit = async () => {
        const result = await dispatch(confirmPayment({ id: record.id, payment_status: status, version:record.version }));
        if (!result.error) {
            onSuccess();
        }
    };

    return (
        <div className="w-full p-2">
            <h4 className="font-bold text-slate-500 mb-1">Confirm Payment Manually</h4>
            <p className="text-xs text-slate-400 mb-3">
                {MONTHS[record.payroll_month]} {record.payroll_year}
            </p>
            <hr />
            <br />
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>

                <Alert
                    type="warning"
                    showIcon
                    className="mb-5"
                    message="Manual override"
                    description="If the automatic payment update failed, use this form to manually set the payment status for this salary record. This action is logged."
                />

                {/* Current status */}
                <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-1">Current Status</p>
                    <span
                        className={`text-sm font-semibold px-2 py-1 rounded ${
                            record.payment_status?.toLowerCase() === "processed"
                                ? "bg-green-100 text-green-700"
                                : record.payment_status?.toLowerCase() === "hold"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-slate-100 text-slate-500"
                        }`}
                    >
                        {record.payment_status ?? "—"}
                    </span>
                </div>

                {/* Status selector */}
                <div className="mb-5">
                    <label className="label mb-2 block">Set Status To</label>
                    <Radio.Group
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="flex gap-4"
                    >
                        <Radio.Button value="PROCESSED">
                            <span className="flex items-center gap-1 text-green-600">
                                <CheckCircleOutlined /> Processed
                            </span>
                        </Radio.Button>
                        <Radio.Button value="HOLD">
                            <span className="flex items-center gap-1 text-orange-500">
                                <PauseCircleOutlined /> Hold
                            </span>
                        </Radio.Button>
                    </Radio.Group>
                </div>

                <FormFooter
                    handleCancel={handleClose}
                    loading={salaryMutating}
                    title="Confirm"
                />
            </form>
        </div>
    );
};

export default ConfirmPaymentModal;
