import React from 'react';
import './Label.scss';

interface CmrLabelProps {
    required?: boolean;
    children?: any;
}

const CmrLabel = (props: CmrLabelProps) => {
    const { children, required = false } = props;

    return (
        <label className="cmr-label" {...props}>
            {children}
            {required && <span className="asterik">*</span>}
        </label>
    );
};

export default CmrLabel;
