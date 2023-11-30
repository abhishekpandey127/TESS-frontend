import React from 'react';
import { Checkbox } from 'antd';
import './Checkbox.scss';
import { CheckboxChangeEvent } from 'antd/es/checkbox';

interface CmrCheckboxProps {
    autoFocus?: boolean;
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
    onChange?: (event: CheckboxChangeEvent) => void;
    children?: any;
}

const CmrCheckbox = (props: CmrCheckboxProps) => {
    const { defaultChecked, onChange, children, ...rest } = props;

    return (
        <div className="cmr-checkbox">
            <Checkbox defaultChecked={defaultChecked} onChange={onChange} {...rest}>
                <span className="cmr-checkbox__text">{children}</span>
            </Checkbox>
        </div>
    );
};

export default CmrCheckbox;
