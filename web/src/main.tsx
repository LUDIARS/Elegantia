import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App.js';
import { viewerBase } from './viewer.js';
import './styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter basename={viewerBase || '/'}><App /></BrowserRouter></React.StrictMode>);
