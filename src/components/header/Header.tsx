import './Header.scss';
import { useAppSelector } from '../../redux/hooks/hooks';
import { useDispatch } from 'react-redux';
import { signOut } from '../../redux/slices/authenticate/authenticateActionCreation';
import Header from '../shared/Cmr-components/header/Header';


const HeaderBar = () => {
    const dispatch = useDispatch();
    const authentication = useAppSelector((state) => state.authenticate);

    const menuList = [
        { title: 'About', path: '/about' },
        { title: 'Contact Us', path: '/contact' },
        { title: 'Bug Report', path: '/bug-report' },
    ];

    const handleLogout = () => {
        dispatch(signOut(authentication.accessToken));
    };

    return (
        <Header  siteTitle={"TESS"} authentication={authentication} menuList={menuList} handleLogout={handleLogout}/>
    );
};

export default HeaderBar;
