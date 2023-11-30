import React, { useState } from 'react';
import { TabInfo } from '../../models/tab.model';
import CmrTabs from '../../components/shared/CmrTabs/CmrTabs';
import Home from '../../components/home/Home';
import Setup from '../../components/setup/Setup';
import Results from '../../components/results/Results';
import './Main.scss';

const Main = (props: any) => {
    const tabData = [
        { id: 1, text: 'Home', children: <Home {...props}/>},
        { id: 2, text: 'Set up', children: <Setup {...props}/>},
        { id: 3, text: 'Results', children: <Results {...props}/>},
    ];
    return (
        <div className="main-container">
            <CmrTabs tabList={tabData}/>
        </div>
    );
};

export default Main;
