import React from 'react';
import './Footer.scss';
import { Layout } from 'antd';

const { Footer } = Layout;

const FooterBar = () => {
    return (
        <Footer style={{ textAlign: 'center' }}>
            @ 2020 Copyright: Center for Advanced Imaging Innovation and Research. All rights reserved
        </Footer>
    );
};

export default FooterBar;
