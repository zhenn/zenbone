// css文件中不要使用import
import '../css/reset.css';
import '../css/whatever.css';

import './lib/object.assign';
import './lib/promise';
import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';
import { Router, Route, hashHistory, useRouterHistory} from 'react-router';

// 异步加载模块，打包独立的chunk文件
const Home  = (location, cb) => {
    require.ensure([], require => {
        cb(null, require('./home').default);
    }, 'home');
};

class App extends Component {
    
    render() {
        return (
            <Router history={hashHistory}>
                <Route path="/" getComponent={Home} />
                <Route path="*" getComponent={Home} />
            </Router>    
        );
    }
}

render(<App />, $('#wrap')[0]); 
