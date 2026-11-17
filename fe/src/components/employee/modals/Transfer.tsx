import { useEffect } from 'react'
import { formType } from '../../../utils/types'
import { Select } from 'antd';
import { zodResolver } from "@hookform/resolvers/zod";
import { object, z } from "zod";
import { useForm } from "react-hook-form";
import FormFooter from '../../../utils/FormFooter';
import { useAppDispatch, useAppSelector } from '../../../redux/useTypedSelectors';
import { getDropdownList } from '../../../redux/reducers/masterSlice';
import { useDebouncedCallback } from 'use-debounce';
import { MdDeleteOutline } from "react-icons/md";
import pdfIcon from '../../../assets/pdf-icon.png';

const formSchema = z
  .object({
    id: z.number().optional(),
    factoryId: z.number(),
    departmentId: z.number()
  })

 type TFormSchema = z.infer<typeof formSchema>;

const TransferForm = ({handleAction, handleClose, title, initialValues}:formType) => {

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
          if(initialValues?.id){
          setValue("id", initialValues?.id)
          setValue("factoryId", initialValues?.factoryId)
          setValue("departmentId", initialValues?.departmentId)
          }
        },[initialValues?.id])

        useEffect(()=>{
          const fetchData = setTimeout(() => {
            dispatch(getDropdownList({query:"factory", searchTerm:''}))
            dispatch(getDropdownList({query:"department", searchTerm:''}))
          }, 1000);
          return () => clearTimeout(fetchData)
        },[])

        const handleFactorySearch = useDebouncedCallback(
          (value) => {dispatch(getDropdownList({query:"factory", searchTerm:value}))},1000
          );
        const handleDepartmentSearch = useDebouncedCallback(
          (value) => {dispatch(getDropdownList({query:"department", searchTerm:value}))},1000
          );

        const handleCancel = () =>{
            reset()
            handleClose()
        }

        const onSubmit = async (data: TFormSchema, e:Event ) => {
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
            <label className="label">Factory</label>
            <Select {...register("factoryId")}
            loading={dropdownLoading}
            options={dropdownList?.factory}
            showSearch
            onSearch={handleFactorySearch}
            // @ts-ignore
            defaultValue={initialValues?.id ? {value:initialValues?.factoryId, label:initialValues?.factory} : {value:"", label:""}}
            onChange={(e:number)=>setValue('factoryId', e)}
            className='w-full'
            />
            {errors?.factoryId && (
              <p className="text-red-500">{`${errors?.factoryId?.message}`}</p>
            )}
        </div>

        <div className="w-full mb-3">
            <label className="label">Department</label>
            <Select {...register("departmentId")}
            loading={dropdownLoading}
            options={dropdownList?.department}
            showSearch
            onSearch={handleDepartmentSearch}
            // @ts-ignore
            defaultValue={initialValues?.id ? {value:initialValues?.departmentId, label:initialValues?.department} : {value:"", label:""}}
            onChange={(e:number)=>setValue('departmentId', e)}
            className='w-full'
            />
            {errors?.departmentId && (
              <p className="text-red-500">{`${errors?.departmentId?.message}`}</p>
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

export default TransferForm