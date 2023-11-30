import React from 'react';
import './Signin.scss';
import { Redirect } from 'react-router-dom';
import { Form } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import CmrInput from '../../components/shared/Cmr-components/input/Input';
import CmrButton from '../../components/shared/Cmr-components/button/Button';
import { useAppDispatch, useAppSelector } from '../../redux/hooks/hooks';
import { getAccessToken, SigninDataType } from '../../redux/slices/authenticate/authenticateActionCreation';

const Signin = () => {
    const accessToken = useAppSelector((state) => state.authenticate.accessToken);
    const dispatch = useAppDispatch();

    if (accessToken) {
        return <Redirect to="/" />;
    }

    const onFinish = (values: any) => {
        console.log('Received values of form: ', values);
        const signinData: SigninDataType = {
            email: values.email,
            password: values.password,
        };
        dispatch(getAccessToken(signinData));
    };

    return (
        <Form name="normal_login" className="login-form" onFinish={onFinish}>
            <Form.Item name="email" rules={[{ required: true, message: 'Please input your Email!' }]}>
                <CmrInput prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Email" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Please input your Password!' }]}>
                <CmrInput
                    prefix={<LockOutlined className="site-form-item-icon" />}
                    type="password"
                    placeholder="Password"
                />
            </Form.Item>
            <Form.Item>
                <CmrButton type="primary" htmlType="submit" className="login-form-button">
                    Log in
                </CmrButton>
            </Form.Item>
        </Form>
    );
};

export default Signin;
