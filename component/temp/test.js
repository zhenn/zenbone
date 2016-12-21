import 'babel-polyfill';
import './test.css';
import './src/index';

import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';

class Text extends Component {

    static defaultProps = {
        p: '1'
    };

    constructor(props) {
        super(props);
        this.state = {
            q: 2
        };
        // ..
    } 

    render() {
        return (
            <div>
                <h1>component/test</h1>
                <div className="demo">
                    <div className="demo-item">
                        <h2>功能描述</h2>
                        <div className="content">
                            <button className="button-primary">功能</button>
                            代码：
                            <pre>
                                <code>
                                    import Test from 'c-test';
                                </code>
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

render(<Text />, $('#wrap')[0]); 