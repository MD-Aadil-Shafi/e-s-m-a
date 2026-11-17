import {useRef} from 'react'
import { customTailwind } from '../../../utils/styles'
import { MdOutlineLocalPrintshop } from "react-icons/md";
import { viewFormType } from '../../../utils/types';
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { formatNumberIndian, numberToWords } from '../../../utils/numberToWords';
import pdfIcon from '../../../assets/pdf-icon.png';

const View = ({handleClose, title, initialValues}:viewFormType) => {

    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

  return (
    <>
    <div className='w-100 p-5' ref={componentRef}>
        <h4 className='font-bold text-slate-500 text-xl text-center'>Classic Industries</h4>
        <h4 className='font-bold text-slate-500 text-lg'>Employee Detail</h4>
        <hr></hr>
        <br></br>
        <p className='flex'>
            <span className='font-semibold w-[140px] border-2 border-slate-500 px-2'>Full Name : </span>
            <span className=' border-2 border-slate-500 px-2 w-full'>{initialValues?.name}</span>
        </p>
        <p className='flex'>
            <span className='font-semibold w-[140px] border-2 border-slate-500 px-2'>Designation : </span>
            <span className='border-2 border-slate-500 px-2 w-full'>{initialValues?.designation}</span>
        </p>
        <p className='flex'>
            <span className='font-semibold w-[140px] border-2 border-slate-500 px-2'>joined At : </span>
            <span className='border-2 border-slate-500 px-2 w-full'>{new Date(initialValues?.joiningDate).toDateString()}</span>
        </p>
        <p className='flex'>
            <span className='font-semibold w-[140px] border-2 border-slate-500 px-2'>Status : </span>
            {initialValues?.active === true ?
            <span className='text-green-600 border-2 border-slate-500 px-2 w-full'>Active</span>
            :
            <span className='text-rose-600 border-2 border-slate-500 px-2 w-full'>Not-Active</span>
            }
        </p>
        <p className='flex mb-3'>
            <span className='font-semibold w-[140px] border-2 border-slate-500 px-2'>Full Address : </span>
            <span className='border-2 border-slate-500 px-2 w-full'>{initialValues?.address}, {initialValues?.city}, {initialValues?.state}, {initialValues?.country}. Pincode: {initialValues?.pincode}</span>
        </p>
        <p className='flex'>
            <span className='font-semibold w-[130px] border-2 border-slate-500 px-2'>Contact No : </span>
            <span className='w-[120px] border-2 border-slate-500 px-2'>{initialValues?.contactNo}</span>
            <span className='font-semibold w-[140px] border-2 border-slate-500 px-2'>Email Id : </span>
            <span className='border-2 border-slate-500 px-2 w-[350px]'>{initialValues?.email}</span>
        </p>

        <p className='flex'>
            <span className='font-semibold w-[130px] border-2 border-slate-500 px-2'>Factory : </span>
            <span className='w-[120px] border-2 border-slate-500 px-2'>{initialValues?.factory}</span>
            <span className='font-semibold w-[140px] border-2 border-slate-500 px-2'>Department : </span>
            <span className='border-2 border-slate-500 px-2 w-[350px]'>{initialValues?.department}</span>
        </p>
        <p className='flex'>
            <span className='font-semibold w-[130px] border-2 border-slate-500 px-2'>Annual Salary : </span>
            <span className='border-2 border-slate-500 px-2 w-[610px]'>{formatNumberIndian(initialValues?.salary)} <span className='capitalize'>({numberToWords(initialValues?.salary)})</span></span>
        </p>
        <p className='flex'>
            <span className='font-semibold w-[130px] border-2 border-slate-500 px-2'>Unique Identity : </span>
            <span className='w-[120px] border-2 border-slate-500 px-2'>{initialValues?.uidType}</span>
            <span className='font-semibold w-[140px] border-2 border-slate-500 px-2'>UID No : </span>
            <span className='border-2 border-slate-500 px-2 w-[350px]'>{initialValues?.uid}</span>
        </p>
        <p className='flex'>
            <span className='font-semibold w-[130px] border-2 border-slate-500 px-2'>Referred By : </span>
            <span className='w-[120px] border-2 border-slate-500 px-2'>{initialValues?.referredBy || "None"}</span>
            <span className='font-semibold w-[140px] border-2 border-slate-500 px-2'>Leaving Date : </span>
            <span className='border-2 border-slate-500 px-2 w-[350px]'>{initialValues?.leavingDate || "Currently working"}</span>
        </p>

        <p className='flex mb-3'>
        <span className='font-semibold w-[130px] border-2 border-slate-500 px-2'>Employment : </span>
        <span className='border-2 border-slate-500 px-2 w-[610px]'>{initialValues?.employmentType}</span>
        </p>
        <p className='flex mb-3'>
            <span className='font-semibold w-[130px] border-2 border-slate-500 px-2'>Remarks : </span>
            <span className='border-2 border-slate-500 px-2 w-[610px]'>{initialValues?.remark || "None"}</span>
        </p>
        <p className='mb-3 font-semibold'>Documents</p>
        <div className='flex gap-3 mb-3'>
        {initialValues?.documents?.map((item:string)=>(
          <Link to={`https://spring-erp-api.aadilify.in${item?.replace(/\\/g, '/').replace(/^upload/, '')}`} target='_blank'>
          <img 
          src={item?.endsWith('.pdf') ? pdfIcon : `https://spring-erp-api.aadilify.in${item?.replace(/\\/g, '/').replace(/^upload/, '')}`}
          // src="http----://localhost:8080/images/discoveruser2.png"
          className='w-[100px] h-[100px] rounded-md object-cover' alt='docs'/>
          </Link>
        ))}
      </div>

        <hr></hr>
        <p className='font-semibold my-3 text-center'>Transfer/Promotion Logs:</p>
        {initialValues?.transferLogs?.length ?
        initialValues?.transferLogs?.map((item:string, index:number)=>(
            <p key={index} className='mb-3 text-slate-500'>{index+1}. {item}</p>
        ))
    :
    <p className='text-center text-slate-400'>No Logs present</p>
    }
    </div>
    <div className='flex justify-end items-center mt-10'>
    <button 
    type='button'
        onClick={handleClose}
        className={`bg-slate-200 text-slate-600 px-4 py-1 shadow rounded flex items-center mr-5`}>Close</button>
    <button 
        onClick={handlePrint}
        className={`${customTailwind.purpleGradient} text-white px-3 py-1 shadow rounded flex items-center`}>
        <MdOutlineLocalPrintshop className='mr-2' size={20}/>Print</button>
    </div>
    </>
  )
}

export default View