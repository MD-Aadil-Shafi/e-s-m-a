import { useState } from 'react';
import { Input } from 'antd';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import CustomBtn from '../utils/CustomBtn';
import logo from '../assets/logo.webp';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = () => {
        if (!email.trim()) {
            toast.error('Please enter your email address.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.info(
                'Your request has been received. An admin will review it and send a reset link to your email shortly.',
                { autoClose: 6000 }
            );
            setEmail('');
        }, 1000);
    };

    return (
        <div className="w-full h-[100vh] login-bg flex flex-col items-center justify-center">
            <div className="bg-white p-5 rounded-lg shadow-xl w-[340px]">

                {/* Logo */}
                <div className="flex justify-center bg-black rounded-md mb-3">
                    <img src={logo} className="h-[80px] mx-auto" />
                </div>
                <h1 className="text-center text-sm text-blue-500 font-extrabold">
                    Employee Salary Management
                </h1>

                {/* Heading */}
                <div className="mt-5 mb-4 text-center">
                    <h2 className="text-base font-bold text-slate-700">Forgot Password?</h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Enter your registered email and an admin will send you a reset link.
                    </p>
                </div>

                {/* Email input */}
                <div className="mb-4">
                    <label className="text-sm text-slate-600 mb-1 block">Email</label>
                    <Input
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onPressEnter={handleSubmit}
                        type="email"
                    />
                </div>

                <CustomBtn
                    text="Request Reset Link"
                    position="center"
                    style="w-full"
                    isDisabled={loading}
                    action={handleSubmit}
                />

                {/* Divider */}
                <div className="flex justify-between items-center mt-4">
                    <p className="border border-b-2 w-full" />
                    <p className="mx-4">Or</p>
                    <p className="border border-b-2 w-full" />
                </div>

                <div className="text-center mb-3">
                    <p className="text-xs">
                        Remember your password?{' '}
                        <Link to="/login" className="text-blue-500">Back to Login.</Link>
                    </p>
                </div>

                <hr />
                <div className="text-center text-slate-500 mt-2">
                    <p>&copy; ACME</p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
