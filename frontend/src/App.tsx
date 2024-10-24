import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login';
import Register from './components/Register';
import './index.css';
import Menu from './components/Menu';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/entrar" element={<Login />} />
          <Route path="/registrar" element={<Register />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="*" element={<Login />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
};

export default App;
