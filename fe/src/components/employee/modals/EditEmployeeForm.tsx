import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormFooter from "../../../utils/FormFooter";
import { useAppDispatch, useAppSelector } from "../../../redux/useTypedSelectors";
import { editEmployee } from "../../../redux/reducers/employeeSlice";
import type { Employee } from "../../../redux/reducers/employeeSlice";

const formSchema = z.object({
    firstname:    z.string().min(1, "Required").max(12, "Max 12 chars"),
    lastname:     z.string().min(1, "Required").max(12, "Max 12 chars"),
    email:        z.string().email("Invalid email"),
    country:      z.string().min(1, "Required"),
    state:        z.string().min(1, "Required"),
    city:         z.string().min(1, "Required"),
    zipcode:      z.string().min(1, "Required"),
    address:      z.string().min(5, "Min 5 characters"),
    phone_number: z.string().min(7, "Invalid phone number"),
    department:   z.string().min(1, "Required"),
    designation:  z.string().min(1, "Required"),
    joining_date: z.string().min(1, "Required"),
});

type TFormSchema = z.infer<typeof formSchema>;

type Props = {
    initialValues: Employee;
    handleClose: () => void;
    onSuccess: () => void;
};

const EditEmployeeForm = ({ initialValues, handleClose, onSuccess }: Props) => {
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector((state) => state.employee);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TFormSchema>({
        resolver: zodResolver(formSchema),
    });

    // Populate form whenever the selected employee changes
    useEffect(() => {
        if (initialValues) {
            reset({
                firstname:    initialValues.firstname,
                lastname:     initialValues.lastname,
                email:        initialValues.email,
                country:      initialValues.country,
                state:        initialValues.state,
                city:         initialValues.city,
                zipcode:      initialValues.zipcode,
                address:      initialValues.address,
                phone_number: initialValues.phone_number,
                department:   initialValues.department,
                designation:  initialValues.designation,
                joining_date: initialValues.joining_date,
            });
        }
    }, [initialValues, reset]);

    const handleCancel = () => {
        reset();
        handleClose();
    };

    const onSubmit = async (data: TFormSchema) => {
        const result = await dispatch(editEmployee({ id: initialValues.id, ...data }));
        if (!result.error) {
            onSuccess();
        }
    };

    return (
        <div className="w-full p-2">
            <h4 className="font-bold text-slate-500 mb-3">Edit Employee</h4>
            <hr />
            <br />
            <form onSubmit={handleSubmit(onSubmit)}>

                {/* Row 1 */}
                <div className="flex gap-3 mb-3">
                    <div className="w-full">
                        <label className="label">First Name</label>
                        <input {...register("firstname")} type="text" placeholder="First name..." className="w-full custom-inputs" />
                        {errors.firstname && <p className="text-red-500 text-xs">{errors.firstname.message}</p>}
                    </div>
                    <div className="w-full">
                        <label className="label">Last Name</label>
                        <input {...register("lastname")} type="text" placeholder="Last name..." className="w-full custom-inputs" />
                        {errors.lastname && <p className="text-red-500 text-xs">{errors.lastname.message}</p>}
                    </div>
                    <div className="w-full">
                        <label className="label">Email</label>
                        <input {...register("email")} type="email" placeholder="Email..." className="w-full custom-inputs" />
                        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                    </div>
                </div>

                {/* Row 2 */}
                <div className="flex gap-3 mb-3">
                    <div className="w-full">
                        <label className="label">Country</label>
                        <input {...register("country")} type="text" placeholder="Country..." className="w-full custom-inputs" />
                        {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
                    </div>
                    <div className="w-full">
                        <label className="label">State</label>
                        <input {...register("state")} type="text" placeholder="State..." className="w-full custom-inputs" />
                        {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
                    </div>
                    <div className="w-full">
                        <label className="label">City</label>
                        <input {...register("city")} type="text" placeholder="City..." className="w-full custom-inputs" />
                        {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
                    </div>
                </div>

                {/* Row 3 */}
                <div className="flex gap-3 mb-3">
                    <div className="w-1/3">
                        <label className="label">Zip Code</label>
                        <input {...register("zipcode")} type="text" placeholder="Zip code..." className="w-full custom-inputs" />
                        {errors.zipcode && <p className="text-red-500 text-xs">{errors.zipcode.message}</p>}
                    </div>
                    <div className="w-2/3">
                        <label className="label">Address</label>
                        <input {...register("address")} type="text" placeholder="Address..." className="w-full custom-inputs" />
                        {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
                    </div>
                </div>

                {/* Row 4 */}
                <div className="flex gap-3 mb-3">
                    <div className="w-full">
                        <label className="label">Phone Number</label>
                        <input {...register("phone_number")} type="text" placeholder="+91..." className="w-full custom-inputs" />
                        {errors.phone_number && <p className="text-red-500 text-xs">{errors.phone_number.message}</p>}
                    </div>
                    <div className="w-full">
                        <label className="label">Department</label>
                        <input {...register("department")} type="text" placeholder="Department..." className="w-full custom-inputs" />
                        {errors.department && <p className="text-red-500 text-xs">{errors.department.message}</p>}
                    </div>
                    <div className="w-full">
                        <label className="label">Designation</label>
                        <input {...register("designation")} type="text" placeholder="Designation..." className="w-full custom-inputs" />
                        {errors.designation && <p className="text-red-500 text-xs">{errors.designation.message}</p>}
                    </div>
                </div>

                {/* Row 5 */}
                <div className="flex gap-3 mb-3">
                    <div className="w-full">
                        <label className="label">Joining Date</label>
                        <input {...register("joining_date")} type="date" className="w-full custom-inputs" />
                        {errors.joining_date && <p className="text-red-500 text-xs">{errors.joining_date.message}</p>}
                    </div>
                    <div className="w-full" />
                    <div className="w-full" />
                </div>

                <FormFooter handleCancel={handleCancel} loading={loading} title="Update Employee" />
            </form>
        </div>
    );
};

export default EditEmployeeForm;
