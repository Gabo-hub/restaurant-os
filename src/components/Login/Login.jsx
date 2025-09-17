import React, { useState, useEffect } from 'react';
import { TextInput, Button, Switch } from '@tremor/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { Navigate } from 'react-router-dom';
import './Login.css';


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Username:', username);
    console.log('Password:', password);
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');

      if (rememberMe) {
        localStorage.setItem('username', username);
      }

    } else {
      setError('Credenciales incorrectas');
      setUsername('');
      setPassword('');
      setTimeout(() => {
        setError('');
      }, 10000);
    }
  };

  const handleRememberMeChange = () => {
    setRememberMe(!rememberMe);
  };

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
      setRememberMe(true);
    }
  }, []);

  return user ? (<Navigate to="/dashboard" replace />) : (
    <div className='min-h-dvh flex items-center justify-center'>
      <form className="form border" onSubmit={handleSubmit}>
        
        <div className="">
          <label>Username </label>
          <TextInput
            type="text"
            placeholder="Enter your Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        <div className="">
          <label htmlFor="current-password">
            Password
          </label>
          <div className='mx-auto max-w-sm space-y-8'>
            <TextInput placeholder="Type password here" type="password" onChange={e => setPassword(e.target.value)} />
          </div>
        </div>

        <div className="flex-row">
          <div className='flex gap-1'>
            <Switch id='RSwitch' name='RSwitch' checked={rememberMe} onChange={handleRememberMeChange} />
            <label>Remember me </label>
          </div>
        </div>

        <Button className="w-full" type="submit"><span>Sign In</span></Button>
        <div className={`overflow-hidden rounded-lg text-red-700 bg-red-400/50 transition-all duration-300 ease-in-out ${error ? 'mt-5 p-2 max-h-20' : 'max-h-0 p-0 mt-0'}`}>{error}</div>
      </form>
    </div>
  );
}

export default Login;
