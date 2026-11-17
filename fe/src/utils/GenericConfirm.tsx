import { type formType } from './types';
import FormFooter from './FormFooter';
import { useEffect, useState } from 'react';


const GenericConfirmModal = ({handleAction, handleClose, title, initialValues}:formType) => {

  console.log('initial ', initialValues);
        const handleCancel = () =>{
            setRemark("")
            handleClose()
        }
        const [remark, setRemark] = useState("")
        useEffect(()=>{
          setRemark(initialValues?.remark)
        },[initialValues])

        type tempType = {
          status:string,
          active:boolean,
          ids:number[],
          remark:string
        }
        const onSubmit = async (e:any) => {
            e.preventDefault()

          
            let temp:tempType = {status:'', active:true, ids:[], remark:''};
            
            if(title === "Move To Production" || title === "Move To QC" || title === "Dispatch"){
              const ids:number[] = []
              if(typeof initialValues === "number"){
                ids.push(initialValues)
              }else{
                initialValues?.map((item:{id:number})=>{
                  ids.push(item?.id);
                })
              }
              
              temp.ids = ids;
            }else{
              temp = {...initialValues}
            }
            

            
            if(title === "Move To Production") temp.status = "InProduction"
            if(title === "Move To QC") temp.status = "InQC"
            if(title === "Approve") temp.status = "Approved"
            if(title === "Reject") temp.status = "Rejected"
            if(title === "Make Active") temp.active = true
            if(title === "Make In-Active") temp.active = false

            if(remark) temp.remark = remark;
            handleAction(temp)
            handleCancel()
        };

  return (
    <div className='w-100 p-2'>
        <h4 className='font-bold text-slate-500'>{title}</h4>
        <hr></hr>
        <br></br>
        <form onSubmit={onSubmit}>
        <p>Confirmation for : {initialValues?.name}</p>
        <p className='text-rose-600'>Are you sure you want to perform this action?</p>
        <br></br>
        <label>Remark (if any)</label>
        <textarea className='w-full custom-inputs' value={remark} onChange={e=>setRemark(e.target.value)}/>
        
        <FormFooter
        handleCancel={handleCancel}
        loading={false}
        title={"Confirm"}
        />
        </form>

        
    </div>
  )
}

export default GenericConfirmModal