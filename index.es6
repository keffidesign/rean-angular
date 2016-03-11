import {Component as ReangulactComponent} from 'reangulact';
import { default as _AngularComponent} from './AngularComponent.es6';

export const AngularComponent = _AngularComponent;

export {prepare} from './AngularUtils.es6';

/**
 * Make Reangulact Component being based on Angular2.
 */
export function initialize() {

    Object.assign(ReangulactComponent.prototype, _AngularComponent);
}

