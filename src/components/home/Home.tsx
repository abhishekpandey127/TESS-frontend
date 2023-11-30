import React, { useEffect, useState } from 'react';
import './Home.scss';
import { Row, Col } from 'antd';
import CmrCollapse from '../shared/Cmr-components/collapse/Collapse';
import CmrPanel from '../shared/Cmr-components/panel/Panel';
import CmrTable from '../shared/CmrTable/CmrTable';
import CmrProgress from '../shared/Cmr-components/progress/Progress';
import { getUploadedData } from '../../redux/slices/home/homeActionCreation';
import { useAppDispatch, useAppSelector } from '../../redux/hooks/hooks';
import { UploadedFile } from '../../redux/slices/home/homeSlice';
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import GetAppIcon from "@mui/icons-material/GetApp";
import DeleteIcon from "@mui/icons-material/Delete";

const uploadedFilesColumns = [

    {
        headerName: 'File Name',
        dataIndex: 'fileName',
        field: 'fileName',
        editable: true,
        flex: 1,
    },
    {
        headerName: 'Date Submitted',
        dataIndex: 'createdAt',
        field: 'createdAt',
        flex: 1,
    },
    {
        headerName: 'Size',
        dataIndex: 'size',
        field: 'size',
        flex: 1,
    },
    {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        width: 160,
        disableClickEventBubbling: true,
        renderCell: (params:any) => {
            return (
                <div>
                    <IconButton onClick={() => {/* Edit logic here */}}>
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => {/* Download logic here */}}>
                        <GetAppIcon />
                    </IconButton>
                    <IconButton onClick={() => {/* Delete logic here */}}>
                        <DeleteIcon />
                    </IconButton>
                </div>
            );
        },
    }
];

const completedJobsColumns = [
    {
        headerName: 'Task ID',
        dataIndex: 'taskId',
        field: 'taskId',
        flex: 1,
    },
    {
        headerName: 'Alias',
        dataIndex: 'alias',
        field: 'alias',
        flex: 1,
    },
    {
        headerName: 'Date Submitted',
        dataIndex: 'createdAt',
        field: 'createdAt',
        flex: 1,
    },
    {
        headerName: 'Status',
        dataIndex: 'status',
        field: 'status',
        flex: 1,
    }
];

const Home = () => {
    const [completedJobsData, setCompletedJobsData] = useState<Array<UploadedFile>>();

    const dispatch = useAppDispatch();
    const { accessToken } = useAppSelector((state) => state.authenticate);
    const { data } = useAppSelector((state) => state.home);

    useEffect(() => {
        //@ts-ignore
        dispatch(getUploadedData(accessToken));
    }, []);

    return (
        <CmrCollapse accordion={false} defaultActiveKey={[0]} expandIconPosition="right">
            <CmrPanel key="0" header="Data">
                <Row>
                    <Col span={24}>
                        <CmrProgress percent={30} status="active" />
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        <CmrTable dataSource={data} columns={uploadedFilesColumns} />
                    </Col>
                </Row>
            </CmrPanel>
            <CmrPanel key="1" header="Jobs">
                <Row>
                    <Col span={24}>
                        <CmrTable dataSource={completedJobsData} columns={completedJobsColumns} />
                    </Col>
                </Row>
            </CmrPanel>
        </CmrCollapse>
    );
};

export default Home;
