
import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';

class Text extends Component {

    static defaultProps = {
        p: '1'
    };

    constructor(props) {
        super(props);
        this.state = {
            q: 2,
            asyncLoadModule: ''
        };
        
    } 

    async = ()=>{
        // 注释不可省略，否则不能显示文件名称
        System.import(/*webpackChunkName: "async"*/'./async').then(module => {
            this.setState({
                asyncLoadModule: module.default
            });
        }).catch(err => {
            console.log(err);
        });
    };

    render() {
        let img = require('../images/gold.png');
        return (
            <div>
                <div>props: {this.props.p}, state: {this.state.q}<img src={img} /></div>
                <div>
                    {
                        this.state.asyncLoadModule
                    }
                </div>
                <button onClick={this.async}>加载异步模块</button>
            </div>
            
        );
    }
}

export default Text;