import { Spin } from 'antd'

type btnType = {
    text:String,
    isDisabled?:boolean,
    style?:String,
    position?:String,
    btnType?:String,
    action?:()=>void;
}

const CustomBtn = ({text, isDisabled=false, style, position="end", btnType="button", action}:btnType) => {
  return (
    <div className={`flex w-full justify-${position}`}>
    <button className={`${style} bg-blue-500 py-1 px-4 rounded-md shadow-md text-white`}
    disabled={isDisabled}
    type={btnType === "button" ? "button" : "submit"}
    onClick={action}
    >
      {isDisabled ?
             <Spin size="small" className='mr-2 white-spinner'/>
            :
            ""
            }
    {text}
    </button>
    </div>
  )
}

export default CustomBtn