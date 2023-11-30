import React from 'react';
import { Route, Redirect, RouteProps, RouteComponentProps } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks/hooks';

const AuthRouter = (props: RouteProps) => {
    const authenticate = useAppSelector((state) => state.authenticate);
    const { component = null, ...rest } = props;
    const Component = component as React.ComponentClass<RouteComponentProps>;

    return (
        <Route
            {...rest}
            render={(props) =>
                authenticate.accessToken && Component ? (
                    <Component {...props} />
                ) : (
                    <Redirect
                        to={{
                            pathname: '/login',
                            state: { from: props.location },
                        }}
                    />
                )
            }
        />
    );
};

export default AuthRouter;
