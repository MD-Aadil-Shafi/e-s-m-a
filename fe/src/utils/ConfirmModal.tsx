import { type formType } from './types';
import FormFooter from './FormFooter';


const ConfirmModal = ({handleAction, handleClose, title, initialValues}:formType) => {

        const handleCancel = () =>{
            handleClose()
        }

        const onSubmit = async (e:any) => {
            e.preventDefault()
            handleAction(initialValues)
            handleCancel()
        };

  return (
    <div className='w-100 p-2'>
        <h4 className='font-bold text-slate-500'>{title}</h4>
        <hr></hr>
        <br></br>
        <form onSubmit={onSubmit}>
        <p>Deleting : {initialValues?.name}</p>
        <p className='text-rose-600'>Are you sure you want to delete this ? This is ir-reversible.</p>
        
        <FormFooter
        handleCancel={handleCancel}
        loading={false}
        title={"Delete"}
        />
        </form>

        
    </div>
  )
}

export default ConfirmModal