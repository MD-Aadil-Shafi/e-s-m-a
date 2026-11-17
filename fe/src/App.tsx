import './App.css';
// import './styles.scss';
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Navigation from './components/navigations/Navigations';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path='/login' element={<Login/>} />
      <Route path='/register' element={<Register/>} />
      <Route path='/reset-password' element={<ResetPassword/>} />
      <Route path='*' element={<Navigation/>}/>
    </Routes>
    <ToastContainer />
    </BrowserRouter>
  )
}

export default App
