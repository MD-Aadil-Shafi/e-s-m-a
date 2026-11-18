import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormFooter from "../../../utils/FormFooter";
import { useAppDispatch, useAppSelector } from "../../../redux/useTypedSelectors";
import { editBasePay } from "../../../redux/reducers/salarySlice";
import type { BasePay } from "../../../redux/reducers/salarySlice";

const formSchema = z.object({
    base_salary: z
        .string()
        .optional()
        .refine((v) => v === undefined || v === "" || (!isNaN(Number(v)) && Number(v) > 0), "Must be a positive number"),
    allowances: z
        .string()
        .optional()
        .refine((v) => v === undefined || v === "" || (!isNaN(Number(v)) && Number(v) >= 0), "Must be 0 or more"),
    remark: z.string().min(1, "Remark is required"),
});

type TFormSchema = z.infer<typeof formSchema>;

type Props = {
    initialValues: BasePay;
    handleClose: () => void;
    onSuccess: () => void;
};

const EditBasePayForm = ({ initialValues, handleClose, onSuccess }: Props) => {
    const dispatch = useAppDispatch();
    const { mutating } = useAppSelector((s) => s.salary);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TFormSchema>({
        resolver: zodResolver(formSchema),
    });

    // Pre-fill with current values when modal opens
    useEffect(() => {
        reset({
            base_salary: initialValues.base_salary,
            allowances:  initialValues.allowances,
            remark:      "",
        });
    }, [initialValues, reset]);

    const handleCancel = () => {
        reset();
        handleClose();
    };

    const onSubmit = async (data: TFormSchema) => {
        // Only send fields that were actually filled in
        const payload: { employee_id: number; version: number; remark: string; base_salary?: string; allowances?: string } = {
            employee_id: initialValues.employee_id,
            version: initialValues.version,
            remark: data.remark,
        };
        if (data.base_salary && data.base_salary !== "") payload.base_salary = data.base_salary;
        if (data.allowances  && data.allowances  !== "") payload.allowances  = data.allowances;

        const result = await dispatch(editBasePay(payload));
        if (!result.error) {
            onSuccess();
        }
    };

    return (
        <div className="w-full p-2">
            <h4 className="font-bold text-slate-500 mb-3">Edit Base Pay</h4>
            <hr />
            <br />
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex gap-3 mb-3">
                    <div className="w-full">
                        <label className="label">Base Salary</label>
                        <input
                            {...register("base_salary")}
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="Leave blank to keep current"
                            className="w-full custom-inputs"
                        />
                        {errors.base_salary && (
                            <p className="text-red-500 text-xs">{errors.base_salary.message}</p>
                        )}
                    </div>

                    <div className="w-full">
                        <label className="label">Allowances</label>
                        <input
                            {...register("allowances")}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Leave blank to keep current"
                            className="w-full custom-inputs"
                        />
                        {errors.allowances && (
                            <p className="text-red-500 text-xs">{errors.allowances.message}</p>
                        )}
                    </div>
                </div>

                <div className="mb-3">
                    <label className="label">Remark <span className="text-red-400">*</span></label>
                    <input
                        {...register("remark")}
                        type="text"
                        placeholder="Reason for change..."
                        className="w-full custom-inputs"
                    />
                    {errors.remark && (
                        <p className="text-red-500 text-xs">{errors.remark.message}</p>
                    )}
                </div>

                <FormFooter handleCancel={handleCancel} loading={mutating} title="Update Base Pay" />
            </form>
        </div>
    );
};

export default EditBasePayForm;
