import {  Spin } from 'antd';
import { customTailwind } from './styles';
import { IoSendSharp } from "react-icons/io5";

type footer = {
    handleCancel: any,
    loading: boolean,
    title?: string
}

const FormFooter = ({handleCancel, loading, title}:footer) => {
  //need to awati handle action for loading
  //console.log('loading btn', loading)
  return (
    <div className='flex justify-end items-center mt-1'>
    <button 
    type='button'
        onClick={handleCancel}
        className={`bg-slate-200 text-slate-600 px-4 py-1 shadow rounded flex items-center mr-5`}> Cancel</button>
    <button 
    disabled={loading}
    type='submit'
        className={`${customTailwind.purpleGradient} text-white px-3 py-1 shadow rounded flex items-center`}>
            {loading ?
             <Spin size="small" className='mr-2 white-spinner'/>
            :
            <IoSendSharp className='mr-2' size={20}/>
            }
            {title ? title : "Submit"}</button>
    </div>
  )
}

export default FormFooter