import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { HistoryProvider } from './contexts/HistoryContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HistoryProvider>
            <App />
        </HistoryProvider>
    </React.StrictMode>,
)
