import React from 'react';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface CmrPanelProps{
    activeKey?: string|string[];
    header: string;
    children: JSX.Element[] | JSX.Element;
    panelKey?: number;
    onChange?: (key: number|undefined) => void;
    expanded?: boolean;
}
const CmrPanel = function(props:CmrPanelProps){
    let {expanded, onChange} = props;
    const toggle = ()=>{
        if(onChange)
            onChange(props.panelKey);
    };
    return <div className="card">
        <div className="card-header" style={{background: "white"}}>
            <div className="row align-items-center">
                <div className="col-md-11">{props.header}
                </div>
                <div className="col-md-1">
                    <span className="react-collapse float-end btn"
                          onClick={(e) => {
                              toggle();
                          }}>
                        {(!expanded)?
                            <ArrowDropDownIcon/>:
                            <ArrowDropUpIcon/>
                        }
                    </span>
                </div>
            </div>
        </div>
        {
            (!expanded)?
                <div className="card-body m-0" style={
                    {maxHeight:'0',padding:'0', opacity:'0',
                        visibility:'collapse',transition:'all 0.5s'}}>
                    {props.children}
                </div>
                :
                <div className="card-body m-5" style={
                    {maxHeight:undefined,padding:undefined, opacity:'1',
                        visibility:'visible',transition:'all 0.5s'}}>
                    {props.children}
                </div>}
    </div>;
}

export default CmrPanel;