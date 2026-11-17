import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import CustomBtn from '../utils/CustomBtn';
import { useAppDispatch, useAppSelector } from "../redux/useTypedSelectors";
import { registerAction } from "../redux/reducers/authSlice";
import { Link } from "react-router-dom";


export const signUpSchema = z
  .object({
    firstname: z.string().min(1).max(20),
    lastname: z.string().min(1).max(20),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Both Passwords should match",
    path: ["confirmPassword"],
  });

  export type TSignUpSchema = z.infer<typeof signUpSchema>;

const Register = () => {
  
    const dispatch = useAppDispatch()
    const {loading} = useAppSelector(state => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    } = useForm<TSignUpSchema>({
    resolver: zodResolver(signUpSchema),
    });

    const onSubmit = async (data: TSignUpSchema) => {
      console.log('data', data)
      let {confirmPassword, ...rest} = data;
      console.log('rest', rest)
      await dispatch(registerAction(rest))
      };
  

  return (
    <div className='flex justify-between w-full flex-wrap h-[100vh]'>
        <div className='w-full md:w-1/2 lg:w-2/3 p-10 text-center register-div flex flex-col justify-center'>

            <h1 className="t-shadow text-center text-5xl text-slate-50 mb-10 font-extrabold">ACME</h1>
            <h3 className="t-shadow text-slate-200 mb-5 text-3xl font-bold">Employee Salary Management System.</h3>
        </div>
        <div className='w-full md:w-1/2 lg:w-1/3 p-10 bg-white shadow-md rounded-md'>

          <h3 className="text-2xl font-bold text-center text-blue-500">Registration</h3>

        <form onSubmit={handleSubmit(onSubmit)}>
        <div className="w-full mb-3">
            <label className="label">First Name</label>
            <input {...register("firstname")} type="text" placeholder="Enter your first name" className="w-full custom-inputs" />
            {errors?.firstname && (
              <p className="text-red-500">{`${errors?.firstname?.message}`}</p>
            )}
        </div>
        <div className="w-full mb-3">
            <label className="label">Last Name</label>
            <input {...register("lastname")} type="text" placeholder="Enter your last name" className="w-full custom-inputs" />
            {errors?.lastname && (
              <p className="text-red-500">{`${errors?.lastname?.message}`}</p>
            )}
        </div>
        <div className="w-full mb-3">
            <label className="label">Email</label>
            <input {...register("email")} type="text" placeholder="enter your email address" className="w-full custom-inputs" />
            {errors?.email && (
              <p className="text-red-500">{`${errors?.email?.message}`}</p>
            )}
        </div>
        <div className="w-full mb-3">
            <label className="label">Password.</label>
            <input {...register("password")} type="password" placeholder="enter password" className="w-full custom-inputs" />
            {errors?.password && (
              <p className="text-red-500">{`${errors?.password?.message}`}</p>
            )}
        </div>
        <div className="w-full mb-3">
            <label className="label">Confirm Password.</label>
            <input {...register("confirmPassword")} type="password" placeholder="enter confirm Password" className="w-full custom-inputs" />
            {errors?.confirmPassword && (
              <p className="text-red-500">{`${errors?.confirmPassword?.message}`}</p>
            )}
        </div>

        <CustomBtn style='w-1/2' text="Register" position="center" isDisabled={isSubmitting || loading} btnType="submit"/>
        </form>
        
        <div className='text-center'>
          <p className="mt-5">Or</p>
          <p>Already haven an account? <Link to="/login" className='text-blue-500'>Click to Login.</Link></p>
        </div>
        <hr></hr>
        <div className='text-center text-slate-500'>
          <p>&copy; ACME</p>
        </div>
        
        </div>
    </div>
  )
}

export default Register