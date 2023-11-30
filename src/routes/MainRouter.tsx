import React from 'react';
import { BrowserRouter as Router, Route, Switch, RouteComponentProps } from 'react-router-dom';
import { Layout } from 'antd';
import HeaderBar from '../components/header/Header';
import FooterBar from '../components/footer/Footer';
import Signin from '../pages/signin/Signin';
import Main from '../pages/main/Main';
import AuthRouter from './AuthRouter';
import About from '../pages/about/About';
import ContactUs from '../pages/contact-us/ContactUs';
import BugReport from '../pages/bug-report/BugReport';

const MainRouter = (props: RouteComponentProps) => {
    return (
        <React.Fragment>
            <Layout className="layout">
                <Router>
                    <HeaderBar />
                    <Switch>
                        <Route path="/login" component={Signin} />
                        <AuthRouter exact path="/" component={Main} />
                        <AuthRouter exact path="/:about" component={About} />
                        <AuthRouter exact path="/:contact" component={ContactUs} />
                        <AuthRouter exact path="/:bug-report" component={BugReport} />
                    </Switch>
                    <FooterBar />
                </Router>
            </Layout>
        </React.Fragment>
    );
};

export default MainRouter;
