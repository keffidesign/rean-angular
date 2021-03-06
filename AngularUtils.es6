import {capitalize,properify, dashify} from 'reangulact/utils.es6';
import {resolveComponentProps, resolveNativeProps, resolveInnerText} from './AngularPropsUtils.es6';

const {Component, DynamicComponentLoader, ElementRef, Injector} = ng.core;
const {ROUTER_DIRECTIVES} = ng.router;

let COUNTER = 0;

function log(val) {
    console.log('==', val);
    return val;
}

import DynamicComponent from './DynamicComponent.jsx';

const dc = prepare(DynamicComponent);

export function prepare(ctor, opts = {}) {

    if (ctor.prepared) return ctor.prepared;

    ctor._directives = new Map();

    const componentMeta = {

        selector: opts.selector || dashify(ctor.name)
        ,
        inputs: ['props']
        ,
        template: log(createElement.apply(ctor, ctor.prototype.render()))
        ,
        directives: [...ctor._directives.values(), ROUTER_DIRECTIVES]

    };

    const classMeta = {

        extends: ctor,

        constructor: [DynamicComponentLoader, Injector, ElementRef, function (dcl, injector, ref) {

            this._dcl = dcl;
            this._injector = injector;
            this._ref = ref;
            this._name = ctor.name + (COUNTER++);

            ctor.call(this);
        }]

    };

    const component = Component(componentMeta).Class(classMeta);

    /**
     * Push itself for recursions
     */
    componentMeta.directives.push(component);

    dc && componentMeta.directives.push(dc);

    return component;

}

export function createChildren(children) {
    return children.map(c => (typeof c === 'string') ? this::resolveInnerText(c) : createElement.apply(this, c));
}

export function createElement(type = 'undefined', props, ...children) {

    if (type === 'else') {

        return ``;
    }

    if (type === 'children') {

        return `<ng-content></ng-content>`;
    }

    if (type === 'routing') {

        return `<router-outlet></router-outlet>`;
    }

    if (type === 'component') {

        const newProps = {};

        this::resolveComponentProps(props, newProps);

        return stringifyComponent('dynamic-component', newProps);

    }

    let after = '';
    if (props && props.if) {
        const ifNot = props.if;
        after = children.filter(c => c[0] === 'else').map(c => createElement.apply(this, ['block', {ifNot}, c[2]])).join('');
    }

    /**
     * Detect recursivity
     */
     children = children.map(c => {

         if (c[0].name !== this.name) return c;

         const resultProps = {};

         this::resolveComponentProps(c[1], resultProps);

         return stringifyComponent(dashify(this.name), resultProps);

    });

    let typeName = type;
    const props2 = {};

    if (type === 'block') {

        typeName = 'template';
        if (props && props.if) {
            props2['[ngIf]'] = `get('${props.if.slice(1)}')`
        }
        if (props && props.ifNot) {
            props2['[ngIf]'] = `!get('${props.ifNot.slice(1)}')`
        }
        if (props && props.each) {
            const [varId, op, dataId] = props.each.split(' ');

            props2['ngFor'] = undefined;
            props2[`#${varId}`] = undefined;
            props2['[ngForOf]'] = `get('${dataId.slice(1)}')`;
        }

    } else {

        if (typeof type !== 'string') {

            typeName = dashify(type.name);

            this._directives.set(typeName, prepare(type));

            this::resolveComponentProps(props, props2);//Why is it mutable?

        } else {

            this::resolveNativeProps(props, props2);
        }
    }

    return stringifyComponent(typeName, props2, this::createChildren(children)) + after;
}

export function stringifyComponent(type, props, children) {

    const prefix = `${type} ${Object.keys(props).map(p => (props[p] === undefined) ? p : `${p}="${props[p]}"`).join(' ')}`;

    const inner = children ? children.join('') : '';

    const isSingleTag = (type !== 'input' && type !== 'img');

    return isSingleTag ? `<${prefix}>${inner}</${type}>` : `<${prefix}/>`;
}