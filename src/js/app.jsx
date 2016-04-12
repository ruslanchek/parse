var React = require('react');
var ReactDOM = require('react-dom');
var Parse = require('parse');
var ParseReact = require('parse-react');
var ParseComponent = ParseReact.Component(React);

Parse.initialize('123', '123', '123');
Parse.serverURL = 'http://localhost:1337/parse';

class CommentBlock extends ParseComponent {
    constructor() {
        super();
    }

    observe(props, state) {
        return {
            items: new Parse.Query('Comment')
        };
    }

    componentDidMount () {
        setInterval(() => {
            ParseReact.Mutation.Create('Comment', {
                text: 'Parse <3 React'
            }).dispatch();
        }, 1000);
    }

    _refresh() {
        this.refreshQueries('items');
    }

    render () {
        let items = [];

        console.log(this.data);

        if (this.pendingQueries().length == 0) {
            // this.data.items.forEach(function (item, i) {
            //     items.push(<li key={i}>{item.text}</li>);
            // });
        }

        return (
            <div>
                <a onClick={this._refresh.bind(this)}>Refresh</a>
                <ul>
                    {items}
                </ul>
            </div>
        )
    }
}

ReactDOM.render(
    <CommentBlock/>,
    document.getElementById('app')
);
