import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast'; 
import { useLogin, useSignup } from '../hooks/useAuth'; 
import type { LoginForm, SignupForm } from '../types';
import Navbar from '../components/Navbar';
import './Auth.css';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginView = location.pathname === '/login';

  const [formData, setFormData] = useState<SignupForm>({
    username: '',
    password: '',
    email: '',
    full_name: '',
  });

  const { mutate: loginMutate, isPending: isLoginPending, error: _loginError } = useLogin();
  const { mutate: signupMutate, isPending: isSignupPending, error: _signupError } = useSignup();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoginView) {
      const loginPayload: LoginForm = {
        username: formData.username,
        password: formData.password,
      };
      
      const toastId = toast.loading('Đang đăng nhập...');

      loginMutate(loginPayload, {
        onSuccess: () => {
          toast.success('Đăng nhập thành công!', { id: toastId });
          window.location.href = '/';
          
        //   setTimeout(() => {
        //     window.location.href = '/';
        //   }, 200);
        },
        onError: (err) => {
          toast.error(`Lỗi đăng nhập: ${err.message}`, { id: toastId });
        }
      });
    } else {
      const toastId = toast.loading('Đang đăng ký...');
      
      signupMutate(formData, {
        onSuccess: () => {
          toast.success('Đăng ký thành công! Vui lòng đăng nhập.', { id: toastId });
          navigate('/login'); 
        },
        onError: (err) => {
          toast.error(`Lỗi đăng ký: ${err.message}`, { id: toastId });
        }
      });
    }
  };

  const toggleView = () => {
    navigate(isLoginView ? '/signup' : '/login');
  };

  const isPending = isLoginView ? isLoginPending : isSignupPending;

  return (
    <>
    <Navbar/>
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">UTTCodeCamp</h1>
          <p className="auth-subtitle">
            {isLoginView ? 'Đăng nhập vào tài khoản của bạn' : 'Tạo tài khoản mới'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label">Tên đăng nhập</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="auth-input"
              required
              placeholder="username"
              />
          </div>

          {!isLoginView && (
            <>
              <div className="auth-input-group">
                <label className="auth-label">Họ và tên</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="auth-input"
                  required={!isLoginView}
                  placeholder="Your name"
                  />
              </div>
              <div className="auth-input-group">
                <label className="auth-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="auth-input"
                  required={!isLoginView}
                  placeholder="Your email"
                  />
              </div>
            </>
          )}

          <div className="auth-input-group">
            <label className="auth-label">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              required
              placeholder="••••••••"
              />
          </div>

          <button type="submit" className="auth-btn" disabled={isPending}>
            {isPending 
              ? 'Đang xử lý...' 
              : (isLoginView ? 'Đăng nhập' : 'Đăng ký')}
          </button>
        </form>

        <div className="auth-switch">
          {isLoginView ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
          <button 
            type="button" 
            className="auth-link" 
            onClick={toggleView}
            >
            {isLoginView ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}