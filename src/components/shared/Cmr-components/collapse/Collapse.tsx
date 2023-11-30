import React, {cloneElement} from 'react';
import { Collapse } from 'antd';
import { CollapsibleType } from 'antd/es/collapse/CollapsePanel';
import { ExpandIconPosition } from 'antd/es/collapse/Collapse';
import './Collapse.scss';

interface CmrCollapseProps {
    accordion?: boolean;
    activeKey?: Array<string | number>|number;
    bordered?: boolean;
    collapsible?: CollapsibleType;
    defaultActiveKey?: Array<string | number>;
    destroyInactivePanel?: boolean;
    expandIconPosition?: ExpandIconPosition;
    ghost?: boolean;
    onChange?: (key: number) => void;
    children?: JSX.Element[];
}

const CmrCollapse = (props: CmrCollapseProps) => {
    let {activeKey, defaultActiveKey, onChange, children}=props;
    defaultActiveKey = (defaultActiveKey)?defaultActiveKey:[];
    let [activeKeys, setActiveKeys] = React.useState(defaultActiveKey);
    if(activeKey!=undefined&&activeKey!=activeKeys){
        console.log(activeKey);
        if(activeKey instanceof Array)
            setActiveKeys(activeKey);
        else setActiveKeys([activeKey]);
    }
    return (
        <div className="cmr-collapse">
            <div>
                {children?.map((child,index)=>{
                    let props = {expanded:activeKeys.indexOf(index)>=0,
                                panelKey: index,
                                onChange: (key:number)=>{
                                    let i = activeKeys.indexOf(key);
                                    if(i<0) {
                                        let newKeys = [...activeKeys];
                                        newKeys.push(index);
                                        setActiveKeys(newKeys);
                                    }
                                    else {
                                        let newKeys = [...activeKeys];
                                        newKeys.splice(i,1);
                                        setActiveKeys(newKeys);
                                    }
                                    if(onChange!=undefined)
                                        onChange(index);
                                }};
                    return cloneElement(child, props)
                })}
            </div>
        </div>
    );
};

export default CmrCollapse;
