import React from 'react';
import './App.scss';
import { BrowserRouter as Router } from 'react-router-dom';
import MainRouter from './routes/MainRouter';
import 'bootstrap';

function App(props: any) {
    return (
        <div className="cmr-root">
            <Router>
                <MainRouter {...props} />
            </Router>
        </div>
    );
}

export default App;
