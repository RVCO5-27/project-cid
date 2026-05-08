import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import StatusSummary from './pages/StatusSummary';
import './App.css';

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/status" element={<StatusSummary/>} />
      </Routes>
    </BrowserRouter>
  );
}
