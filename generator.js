'use strict';

const fs = require('fs');
const prompt = require('prompt');
const jsondir = require('jsondir');

const schema = {
    properties: {
        type: {
            description: 'Choose type (1: UI component, 2: Page component, 3: Block component, 4: Flux API)',
            type: 'number',
            default: 1,
            required: true
        },
        name: {
            description: 'Enter name',
            type: 'string',
            pattern: /^[a-z]+$/,
            message: 'Root must be only lower-case letters',
            required: true
        }
    }
};

function getActionFile(nameLower, nameUpper, nameCapitalized) {
    return `
import CONFIG from '../configs/common';
import ${nameUpper}_CONSTANTS from '../constants/${nameLower}';
import appDispatcher from '../dispatchers/app';

class ${nameCapitalized}Actions {
	private dispatcher:any = null;

	constructor(dispatcher) {
		this.dispatcher = dispatcher;
	}

	defaultAction(data:any):void {
		this.dispatcher.dispatch({
            actionType: ${nameUpper}_CONSTANTS.DEFAULT_ACTION,
            data: data
        });
	}
}

export default new ${nameCapitalized}Actions(appDispatcher);`;
}

function getStoreFile(nameLower, nameUpper, nameCapitalized) {
    return `
import {Store} from 'flux/utils';
import appDispatcher from '../dispatchers/app';
import CONFIG from '../configs/common';
import ${nameUpper}_CONSTANTS from '../constants/${nameLower}';

namespace ${nameCapitalized}Store {
    export interface State {
        data:any
    }

    class S extends Store {
        state:State = {
            data: {}
        };

        public getState():any {
            return _.extend({}, this.state);
        }

        public __onDispatch(payload:any):void {
            switch (payload.actionType) {
                case ${nameUpper}_CONSTANTS.DEFAULT_ACTION :
                {
                    this.state.data = payload.data;
                }
                    break;
            }

            this.__emitChange();
        }
    }

    export let store = new S(appDispatcher);
}

export default ${nameCapitalized}Store;`;
}

function getConstantsFile(nameLower, nameUpper, nameCapitalized) {
    return `
const ${nameUpper}_CONSTANTS = {
    DEFAULT_ACTION: 'DEFAULT_ACTION'
};

export default ${nameUpper}_CONSTANTS;`;
}

function getComponentUIFile(nameLower, nameUpper, nameCapitalized) {
    return `
import * as React from 'react';

interface Props {
	text:string,
	onClickHandler:Function
}

interface State {
	counter:number
}

class ${nameCapitalized} extends React.Component<Props, State> {
	timer = null;

	state:State = {
		counter: 0
	};

	componentDidMount():void {
		this.timer = setInterval(() => {
			this.setState({
				counter: this.state.counter + 1
			} as State);
		}, 1000);
	}

	componentWillUnmount():void {
		clearTimeout(this.timer);
		this.state.counter = 0;
	}

	private handleClick(text:string):void {
		this.props.onClickHandler(text);
	}

	public render() {
		return (
			<span onClick={this.handleClick.bind(this, this.props.text)}>{this.props.text} {this.state.counter}</span>
		)
	}
}

export default ${nameCapitalized};`;
}

function getComponentBlockFile(nameLower, nameUpper, nameCapitalized) {
    return `
import * as React from 'react';
import {Container} from 'flux/utils';
import CommonStore from '../../stores/common';

interface Props {

}

interface State {
	commonStore:CommonStore.State
}

class ${nameCapitalized} extends React.Component<Props, State> {
	static getStores() {
		return [
			CommonStore.store
		];
	}

	static calculateState(prevState) {
		return {
			commonStore: CommonStore.store.getState()
		};
	}

	public render() {
		return (
			<div>
				App ready: {this.state.commonStore.appReady.toString()}
			</div>
		)
	}
}

const ${nameCapitalized}Container = Container.create(${nameCapitalized});

export default ${nameCapitalized}Container;`;
}

function getComponentPageFile(nameLower, nameUpper, nameCapitalized) {
    return `
import * as React from 'react';

interface Props {

}

interface State {

}

class ${nameCapitalized} extends React.Component<Props, State> {
	state:State = {

	};

	public render() {
		return <div>
			<h1>${nameCapitalized}</h1>
			<hr/>
			<p>This is the ${nameCapitalized} page</p>
		</div>;
	}
}

export default ${nameCapitalized};`;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateFluxAPI(nameLower, nameUpper, nameCapitalized) {
    let dirSchema = {
        '-path': __dirname + '/src/ts',
        actions: {},
        stores: {},
        constants: {}
    };

    dirSchema.actions[nameLower + '.ts'] = {
        '-content': getActionFile(nameLower, nameUpper, nameCapitalized)
    };

    dirSchema.stores[nameLower + '.ts'] = {
        '-content': getStoreFile(nameLower, nameUpper, nameCapitalized)
    };

    dirSchema.constants[nameLower + '.ts'] = {
        '-content': getConstantsFile(nameLower, nameUpper, nameCapitalized)
    };

    jsondir.json2dir(dirSchema, function (err) {
        if (err) {
            throw err;
        }

        console.log(`actions/${nameLower}.ts created`);
        console.log(`stores/${nameLower}.ts created`);
        console.log(`constants/${nameLower}.ts created`);
    });
}

function generateUIComponent(nameLower, nameUpper, nameCapitalized) {
    let dirSchema = {
        '-path': __dirname + '/src/ts',
        components: {
            ui: {}
        }
    };

    dirSchema.components.ui[nameLower + '.tsx'] = {
        '-content': getComponentUIFile(nameLower, nameUpper, nameCapitalized)
    };

    jsondir.json2dir(dirSchema, function (err) {
        if (err) {
            throw err;
        }

        console.log(`components/ui/${nameLower}.tsx created`);
        console.log(`Example usage: 
import ${nameCapitalized} from 'ui/${nameLower}';
<${nameCapitalized} text="Hello from ${nameCapitalized}" onClickHandler={() => { alert('Hello from ${nameCapitalized}') }}></${nameCapitalized}>
        `);
    });
}

function generateBlockComponent(nameLower, nameUpper, nameCapitalized) {
    let dirSchema = {
        '-path': __dirname + '/src/ts',
        components: {
            blocks: {}
        }
    };

    dirSchema.components.blocks[nameLower + '.tsx'] = {
        '-content': getComponentBlockFile(nameLower, nameUpper, nameCapitalized)
    };

    jsondir.json2dir(dirSchema, function (err) {
        if (err) {
            throw err;
        }

        console.log(`components/blocks/${nameLower}.tsx created`);
    });
}

function generatePageComponent(nameLower, nameUpper, nameCapitalized) {
    let dirSchema = {
        '-path': __dirname + '/src/ts',
        components: {
            pages: {}
        }
    };

    dirSchema.components.pages[nameLower + '.tsx'] = {
        '-content': getComponentPageFile(nameLower, nameUpper, nameCapitalized)
    };

    jsondir.json2dir(dirSchema, function (err) {
        if (err) {
            throw err;
        }

        console.log(`components/pages/${nameLower}.tsx created`);
    });
}

prompt.start();
prompt.get(schema, function (err, result) {
    let nameLower = result.name;
    let nameUpper = nameLower.toUpperCase();
    let nameCapitalized = capitalizeFirstLetter(nameLower);

    if (!err) {
        switch (result.type) {
            case 1 :
            {
                generateUIComponent(nameLower, nameUpper, nameCapitalized);
            }
                break;

            case 2 :
            {
                generatePageComponent(nameLower, nameUpper, nameCapitalized);
            }
                break;

            case 3 :
            {
                generateBlockComponent(nameLower, nameUpper, nameCapitalized);
            }
                break;

            case 4 :
            {
                generateFluxAPI(nameLower, nameUpper, nameCapitalized);
            }
                break;
        }
    } else {
        console.log(err);
    }
});