import { useState } from 'react'
import { Input } from 'antd';
import CustomBtn from '../utils/CustomBtn';
import logo from '../assets/logo.webp';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/useTypedSelectors';
import { loginAction } from '../redux/reducers/authSlice';

const Login = () => {

  const dispatch = useAppDispatch();
  const {loading } = useAppSelector(state => state.auth)
  const [email, setEmail] = useState('guest_admin')
  const [password, setPassword] = useState("guest@erp.546")

  const handleSubmit = async() =>{
    await dispatch(loginAction({email:email, password}))
  }
  
  return (
    <div className='w-full h-[100vh] login-bg flex flex-col items-center justify-center'>
      <div className='bg-white p-5 rounded-lg shadow-xl'>
        <div className='flex justify-center bg-black rounded-md mb-3'>
        <img src={logo} className='h-[80px] mx-auto'/>
        </div>
        <h1 className='text-center text-sm text-blue-500 font-extrabold'>Employee Salary Management</h1>

        <div className='mb-3 mt-5'>
        <label>Email</label>
        <Input placeholder="Enter email" value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>
        <div className='mb-3'>
        <label>Password</label>
        <Input placeholder="Enter Password"
        type="password"
        value={password} onChange={e=>setPassword(e.target.value)} className='mb-5'/>
        </div>
        <CustomBtn text='Login' position="center" style="w-1/2"
        isDisabled={loading}
        action={handleSubmit}
        />

        <div className='flex justify-between items-center mt-4'>
          <p className='border border-b-2 w-full'></p>
          <p className='mx-4'>Or</p>
          <p className='border border-b-2 w-full'></p>
        </div>
        <div className='text-center mb-3'>
          <p className='text-xs'>Didn't have an account yet? <Link to="/register" className='text-blue-500'>Click To Register.</Link></p>
          <p className='mt-4 text-xs'>Forgot Your Password? <Link to="/reset-password" className='text-blue-500'>Request your password.</Link></p>
        </div>
        <hr></hr>
        <div className='text-center text-slate-500'>
          <p>&copy; ACME</p>
        </div>
        
      </div>
    </div>
  )
}

export default Login