import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormFooter from "../../../utils/FormFooter";
import { useAppDispatch, useAppSelector } from "../../../redux/useTypedSelectors";
import { addBasePay } from "../../../redux/reducers/salarySlice";

const formSchema = z.object({
    base_salary: z
        .string()
        .min(1, "Required")
        .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be a positive number"),
    allowances: z
        .string()
        .optional()
        .refine((v) => v === undefined || v === "" || (!isNaN(Number(v)) && Number(v) >= 0), "Must be 0 or more"),
});

type TFormSchema = z.infer<typeof formSchema>;

type Props = {
    employeeId: number;
    handleClose: () => void;
    onSuccess: () => void;
};

const AddBasePayForm = ({ employeeId, handleClose, onSuccess }: Props) => {
    const dispatch = useAppDispatch();
    const { mutating } = useAppSelector((s) => s.salary);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TFormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: { allowances: "0.00" },
    });

    const handleCancel = () => {
        reset();
        handleClose();
    };

    const onSubmit = async (data: TFormSchema) => {
        const result = await dispatch(
            addBasePay({
                employee_id: employeeId,
                base_salary: data.base_salary,
                allowances: data.allowances || "0.00",
            })
        );
        if (!result.error) {
            reset();
            onSuccess();
        }
    };

    return (
        <div className="w-full p-2">
            <h4 className="font-bold text-slate-500 mb-3">Add Base Pay</h4>
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
                            placeholder="e.g. 50000.00"
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
                            placeholder="e.g. 5000.00"
                            className="w-full custom-inputs"
                        />
                        {errors.allowances && (
                            <p className="text-red-500 text-xs">{errors.allowances.message}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">Leave blank for ₹0.00</p>
                    </div>
                </div>

                <FormFooter handleCancel={handleCancel} loading={mutating} title="Add Base Pay" />
            </form>
        </div>
    );
};

export default AddBasePayForm;
