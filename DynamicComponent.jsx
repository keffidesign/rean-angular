import {Component} from 'reangulact';

import {prepare} from './AngularUtils.es6';

export default class DynamicComponent extends Component {

    init() {

        const type = this.get('type');

        this._dcl.loadNextToLocation(prepare(type), this._ref);

    }

}