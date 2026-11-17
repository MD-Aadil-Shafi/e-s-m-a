import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormFooter from "../../../utils/FormFooter";
import { useAppDispatch, useAppSelector } from "../../../redux/useTypedSelectors";
import { addSalary } from "../../../redux/reducers/salarySlice";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
    { value: 1,  label: "January" },
    { value: 2,  label: "February" },
    { value: 3,  label: "March" },
    { value: 4,  label: "April" },
    { value: 5,  label: "May" },
    { value: 6,  label: "June" },
    { value: 7,  label: "July" },
    { value: 8,  label: "August" },
    { value: 9,  label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z
    .object({
        payroll_month:  z.number({ invalid_type_error: "Select a month" }).min(1).max(12),
        payroll_year:   z.number({ invalid_type_error: "Select a year" }).min(2000),
        total_days:     z.number({ invalid_type_error: "Required" }).min(28).max(31),
        working_days:   z.number({ invalid_type_error: "Required" }).min(0),
        paid_days:      z.number({ invalid_type_error: "Required" }).min(0),
        unpaid_days:    z.number({ invalid_type_error: "Required" }).min(0),
    })
    .refine((d) => d.working_days <= d.total_days, {
        message: "Working days cannot exceed total days",
        path: ["working_days"],
    })
    .refine((d) => d.paid_days + d.unpaid_days <= d.total_days, {
        message: "Paid + unpaid days cannot exceed total days",
        path: ["unpaid_days"],
    });

type TFormSchema = z.infer<typeof formSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
    employeeId: number;
    handleClose: () => void;
    onSuccess: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

const AddSalaryForm = ({ employeeId, handleClose, onSuccess }: Props) => {
    const dispatch = useAppDispatch();
    const { salaryMutating } = useAppSelector((s) => s.salary);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TFormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            payroll_year: currentYear,
            total_days:   30,
        },
    });

    const handleCancel = () => {
        reset();
        handleClose();
    };

    const onSubmit = async (data: TFormSchema) => {
        const result = await dispatch(addSalary({ employee_id: employeeId, ...data }));
        if (!result.error) {
            reset();
            onSuccess();
        }
    };

    return (
        <div className="w-full p-2">
            <h4 className="font-bold text-slate-500 mb-3">Add Monthly Salary</h4>
            <hr />
            <br />
            <form onSubmit={handleSubmit(onSubmit)}>

                {/* Row 1 — payroll period */}
                <div className="flex gap-3 mb-3">
                    <div className="w-full">
                        <label className="label">Payroll Month <span className="text-red-400">*</span></label>
                        <select
                            {...register("payroll_month", { valueAsNumber: true })}
                            className="w-full custom-inputs"
                        >
                            <option value="">Select month</option>
                            {MONTHS.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        {errors.payroll_month && (
                            <p className="text-red-500 text-xs">{errors.payroll_month.message}</p>
                        )}
                    </div>

                    <div className="w-full">
                        <label className="label">Payroll Year <span className="text-red-400">*</span></label>
                        <select
                            {...register("payroll_year", { valueAsNumber: true })}
                            className="w-full custom-inputs"
                        >
                            {YEARS.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        {errors.payroll_year && (
                            <p className="text-red-500 text-xs">{errors.payroll_year.message}</p>
                        )}
                    </div>
                </div>

                {/* Row 2 — days */}
                <div className="flex gap-3 mb-3">
                    <div className="w-full">
                        <label className="label">Total Days <span className="text-red-400">*</span></label>
                        <input
                            {...register("total_days", { valueAsNumber: true })}
                            type="number" min={28} max={31}
                            placeholder="e.g. 30"
                            className="w-full custom-inputs"
                        />
                        {errors.total_days && (
                            <p className="text-red-500 text-xs">{errors.total_days.message}</p>
                        )}
                    </div>

                    <div className="w-full">
                        <label className="label">Working Days <span className="text-red-400">*</span></label>
                        <input
                            {...register("working_days", { valueAsNumber: true })}
                            type="number" min={0}
                            placeholder="e.g. 22"
                            className="w-full custom-inputs"
                        />
                        {errors.working_days && (
                            <p className="text-red-500 text-xs">{errors.working_days.message}</p>
                        )}
                    </div>
                </div>

                {/* Row 3 — paid / unpaid */}
                <div className="flex gap-3 mb-3">
                    <div className="w-full">
                        <label className="label">Paid Days <span className="text-red-400">*</span></label>
                        <input
                            {...register("paid_days", { valueAsNumber: true })}
                            type="number" min={0}
                            placeholder="e.g. 20"
                            className="w-full custom-inputs"
                        />
                        {errors.paid_days && (
                            <p className="text-red-500 text-xs">{errors.paid_days.message}</p>
                        )}
                    </div>

                    <div className="w-full">
                        <label className="label">Unpaid Days <span className="text-red-400">*</span></label>
                        <input
                            {...register("unpaid_days", { valueAsNumber: true })}
                            type="number" min={0}
                            placeholder="e.g. 2"
                            className="w-full custom-inputs"
                        />
                        {errors.unpaid_days && (
                            <p className="text-red-500 text-xs">{errors.unpaid_days.message}</p>
                        )}
                    </div>
                </div>

                <FormFooter handleCancel={handleCancel} loading={salaryMutating} title="Add Salary" />
            </form>
        </div>
    );
};

export default AddSalaryForm;
