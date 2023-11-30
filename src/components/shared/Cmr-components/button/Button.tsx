import React from 'react';
import './Button.scss';
import { Button, ButtonProps } from 'antd';

const CmrButton = (props: ButtonProps) => {
    const { children, onClick, ...rest } = props;

    return (
        <Button onClick={onClick} {...rest}>
            {children}
        </Button>
    );
};

export default CmrButton;
