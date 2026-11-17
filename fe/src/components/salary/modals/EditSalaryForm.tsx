import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormFooter from "../../../utils/FormFooter";
import { useAppDispatch, useAppSelector } from "../../../redux/useTypedSelectors";
import { editSalary } from "../../../redux/reducers/salarySlice";
import type { SalaryRecord } from "../../../redux/reducers/salarySlice";

const MONTHS = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const optionalNonNeg = z
    .number({ invalid_type_error: "Must be a number" })
    .min(0, "Must be 0 or more")
    .optional();

const formSchema = z.object({
    total_days:   z.number({ invalid_type_error: "Must be a number" }).min(1).optional(),
    working_days: optionalNonNeg,
    paid_days:    optionalNonNeg,
    unpaid_days:  optionalNonNeg,
});

type TFormSchema = z.infer<typeof formSchema>;

const fmt = (val: number) =>
    val.toLocaleString("en-IN", { style: "currency", currency: "INR" });

type Props = {
    initialValues: SalaryRecord;
    handleClose: () => void;
    onSuccess: () => void;
};

const EditSalaryForm = ({ initialValues, handleClose, onSuccess }: Props) => {
    const dispatch = useAppDispatch();
    const { salaryMutating, basePay } = useAppSelector((s) => s.salary);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm<TFormSchema>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        reset({
            total_days:   initialValues.total_days,
            working_days: initialValues.working_days,
            paid_days:    initialValues.paid_days,
            unpaid_days:  initialValues.unpaid_days,
        });
    }, [initialValues, reset]);

    // Live-watch the two fields that drive the deduction formula
    const workingDays = useWatch({ control, name: "working_days" });
    const unpaidDays  = useWatch({ control, name: "unpaid_days" });

    // ── Live calculation ──────────────────────────────────────────────────────
    const baseSalary   = Number(basePay?.base_salary  ?? initialValues.base_salary);
    const allowances   = Number(basePay?.allowances   ?? initialValues.allowances);
    const grossSalary  = baseSalary + allowances;

    const wDays = Number(workingDays) || 0;
    const uDays = Number(unpaidDays)  || 0;

    const perDay    = wDays > 0 ? baseSalary / wDays : 0;
    const deduction = perDay * uDays;
    const netSalary = grossSalary - deduction;

    const handleCancel = () => {
        reset();
        handleClose();
    };

    const onSubmit = async (data: TFormSchema) => {
        const payload: Parameters<typeof editSalary>[0] = { id: initialValues.id };
        if (data.total_days   !== undefined) payload.total_days   = data.total_days;
        if (data.working_days !== undefined) payload.working_days = data.working_days;
        if (data.paid_days    !== undefined) payload.paid_days    = data.paid_days;
        if (data.unpaid_days  !== undefined) payload.unpaid_days  = data.unpaid_days;

        const result = await dispatch(editSalary(payload));
        if (!result.error) onSuccess();
    };

    return (
        <div className="w-full p-2">
            <h4 className="font-bold text-slate-500 mb-1">Edit Salary</h4>
            <p className="text-xs text-slate-400 mb-3">
                {MONTHS[initialValues.payroll_month]} {initialValues.payroll_year}
            </p>
            <hr />
            <br />
            <form onSubmit={handleSubmit(onSubmit)}>

                {/* Row 1 — total days */}
                <div className="flex gap-3 mb-3">
                    <div className="w-full">
                        <label className="label">Total Days</label>
                        <input
                            {...register("total_days", { valueAsNumber: true })}
                            type="number" min="1" max="31"
                            className="w-full custom-inputs"
                        />
                        {errors.total_days && (
                            <p className="text-red-500 text-xs">{errors.total_days.message}</p>
                        )}
                    </div>
                    <div className="w-full">
                        <label className="label">Working Days</label>
                        <input
                            {...register("working_days", { valueAsNumber: true })}
                            type="number" min="0"
                            className="w-full custom-inputs"
                        />
                        {errors.working_days && (
                            <p className="text-red-500 text-xs">{errors.working_days.message}</p>
                        )}
                    </div>
                </div>

                {/* Row 2 — paid / unpaid */}
                <div className="flex gap-3 mb-3">
                    <div className="w-full">
                        <label className="label">Paid Days</label>
                        <input
                            {...register("paid_days", { valueAsNumber: true })}
                            type="number" min="0"
                            className="w-full custom-inputs"
                        />
                        {errors.paid_days && (
                            <p className="text-red-500 text-xs">{errors.paid_days.message}</p>
                        )}
                    </div>
                    <div className="w-full">
                        <label className="label">Unpaid Days</label>
                        <input
                            {...register("unpaid_days", { valueAsNumber: true })}
                            type="number" min="0"
                            className="w-full custom-inputs"
                        />
                        {errors.unpaid_days && (
                            <p className="text-red-500 text-xs">{errors.unpaid_days.message}</p>
                        )}
                    </div>
                </div>

                {/* ── Live salary preview ── */}
                <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-4 grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Base Salary</span>
                        <span className="font-medium">{fmt(baseSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Allowances</span>
                        <span className="font-medium text-green-600">{fmt(allowances)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Gross Salary</span>
                        <span className="font-medium">{fmt(grossSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Per Day</span>
                        <span className="font-medium">{fmt(perDay)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Deductions</span>
                        <span className="font-medium text-red-500">− {fmt(deduction)}</span>
                    </div>
                    <div className="flex justify-between col-span-2 border-t border-slate-200 pt-2">
                        <span className="font-semibold text-slate-700">Net Pay</span>
                        <span className="font-bold text-purple-600">{fmt(netSalary)}</span>
                    </div>
                </div>

                <FormFooter handleCancel={handleCancel} loading={salaryMutating} title="Update Salary" />
            </form>
        </div>
    );
};

export default EditSalaryForm;
