import { useEffect } from 'react'
import { formType } from '../../../utils/types'
import { Select } from 'antd';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import FormFooter from '../../../utils/FormFooter';
import { useAppDispatch, useAppSelector } from '../../../redux/useTypedSelectors';
import { getDropdownList } from '../../../redux/reducers/masterSlice';
import { useDebouncedCallback } from 'use-debounce';

const formSchema = z
  .object({
    id: z.number().optional(),
    designationId: z.number(),
    salary: z.string().min(4, "Required")
  })

 type TFormSchema = z.infer<typeof formSchema>;

const PromoteForm = ({handleAction, handleClose, title, initialValues}:formType) => {

  const {dropdownLoading, dropdownList} = useAppSelector(state => state.master)

  const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
        setError,
        clearErrors,
        setValue,
        } = useForm<TFormSchema>({
        resolver: zodResolver(formSchema),
        });

        useEffect(()=>{
          reset({
          id: initialValues?.id,
          designationId: initialValues?.designationId,
          salary: initialValues?.salary
          })
        },[initialValues, reset])

        useEffect(()=>{
          const fetchData = setTimeout(() => {
            dispatch(getDropdownList({query:"designation", searchTerm:''}))
          }, 1000);
          return () => clearTimeout(fetchData)
        },[])

        const handleDesignationSearch = useDebouncedCallback(
          (value) => {dispatch(getDropdownList({query:"designation", searchTerm:value}))},1000
          );

        const handleCancel = () =>{
            reset()
            handleClose()
        }

        const onSubmit = async (data: TFormSchema, e:Event ) => {
            if(Number(data?.salary) < Number(initialValues?.salary)){
                return setError('salary', {
                    type: 'manual',
                    message: 'Promotion salary should be more than existing salary.',
                  });
            }else{
                clearErrors("salary")
            }
          e.preventDefault();
           await handleAction(data, 'normal', handleCancel)
        };


  return (
    <div className='w-100 p-2'>
        <h4 className='font-bold text-slate-500'>{title}</h4>
        <hr></hr>
        <br></br>
        <form onSubmit={handleSubmit(onSubmit)}>


          <div className='flex justify-between items-center gap-3'>

          <div className="w-full mb-3">
            <label className="label">Designation</label>
            <Select {...register("designationId")}
            loading={dropdownLoading}
            options={dropdownList?.designation}
            showSearch
            optionFilterProp="label"
            onSearch={handleDesignationSearch}
            // @ts-ignore
            defaultValue={initialValues?.id ? {value:initialValues?.designationId, label:initialValues?.designation} : {value:"", label:""}}
            onChange={(e:number)=>setValue('designationId', e)}
            className='w-full'
            />
            {errors?.designationId && (
              <p className="text-red-500">{`${errors?.designationId?.message}`}</p>
            )}
        </div>

        <div className="w-full mb-3">
            <label className="label">Salary</label>
            <input {...register("salary")} type="number" placeholder="Salary..." className="w-full custom-inputs" />
            {errors?.salary && (
              <p className="text-red-500">{`${errors?.salary?.message}`}</p>
            )}
        </div>

          </div>
        
        <FormFooter
        handleCancel={handleCancel}
        loading={isSubmitting}
        title={initialValues?.id ? "Update" : "Add"}
        />
        </form>

        
    </div>
  )
}

export default PromoteForm