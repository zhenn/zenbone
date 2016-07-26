// css文件中不要使用import
import '../css/reset.css';
import '../css/whatever.css';

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
        let img = require('../images/gold.png');
        return (
            <div>props: {this.props.p}, state: {this.state.q}<img src={img} /></div>
        );
    }
}

render(<Text />, $('#wrap')[0]); 