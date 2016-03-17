import {capitalize,properify, dashify} from 'reangulact/utils.es6';

const {Component, DynamicComponentLoader, ChangeDetectionStrategy, ViewEncapsulation} = ng.core;
const {ROUTER_DIRECTIVES} = ng.router;

const PROP_ADAPTERS = {
    'id': (v) => `id="${v}"`
    ,
    'each': (v) => {

        const [varId, op, dataId] = v.split(' ');

        return `*ngFor="#${varId} of get('${dataId.slice(1)}')" attr.data-index="{{setState({'${varId}':${varId}})}}"`;
    }
    ,
    'if': (v) => `*ngIf="get('${v.slice(1)}')"`
    ,
    'router': (v) => `[routerLink]="/${v}"`
    ,
    'ifNot': (v) => `*ngIf="!get('${v.slice(1)}')"`
    ,
    style(v){
        return (typeof v === 'string') ? v.split(';')
            .reduce((p, q, i, arr, kv = q.split(':'))=>(p[properify(kv[0])] = kv[1], p), {}) : v;
    }
};

const VALUE_ADAPTERS = {
    '': (v)=>`{{${v}}}`,
    'click': (v)=>`(click)="${v}()"`,
    'change': (v)=>`(change)="${v}()"`,
    'scroll': (v)=>`(scroll)="${v}()"`
    ,
    ['class'](v){
        //console.log('class', v);
        return `[ngClass]="${v}"`
    }
    ,
    '*': (v, k)=>`[attr.${k}]="${v}"`
    ,
    '**': (v, k)=>`${k}:"${v}"`
};

function log(val){
    console.log('temiuplate',val);
    return val;
}

export function prepare(ctor) {

    if (ctor.prepared) return ctor.prepared;

    ctor._directives = new Map();

    const nctor = function (dcl){

        this.dcl = dcl;

        ctor.call(this);
    };

    //nctor.name = ctor.name;

    return Component({

        selector: dashify(ctor.name)
        ,
        inputs: ['props', 'children']
        ,
        changeDetection:ChangeDetectionStrategy.OnPush
        ,
        encapsulation: ViewEncapsulation.Emulated
        ,
        template: log(createElement.apply(ctor, ctor.prototype.render()))
        ,
        directives: [...ctor._directives.values(), ROUTER_DIRECTIVES]

    }).Class({

        extends : ctor,

        constructor: [DynamicComponentLoader, nctor]

    });
}

function createElement(type, props, ...children) {

    if (type==='children'){
        return `<div [id]="'children_'+_id"></div>`
    }

    if (props && props.if){
        const ifNot = props.if;

        children.filter((c)=>(c[0]==='else')).forEach(c=> (c[1] = {...c[1], ifNot}))
    }

    if (typeof type !== 'string') {

        const typeName = dashify(type.name);

        this._directives.set(typeName, prepare(type));

        props = this::resolveComponentProps(props, children);

        return stringifyComponent(typeName, props);
    }

    return stringifyComponent(type,
        Object.keys(props || {}).map((k) =>(resolveNativeProp.call(this, k, props[k])))
        ,
        children.map(c => (typeof c === 'string') ? resolveNativeProp.call(this, '', c.trim()) : createElement.apply(this, c))
    );
}

function parseBindingExpression(p) {

    if (p.match(/^\w+(\.\w+)*$/)) {

        return `get('${p}')`;
    }

    if (p[0] === '{' && p.endsWith('}')) {

        return `${p.replace(/\:(\w+(\.\w+)*)/g, (s, s1)=>(`get('${s1}')`))}`;
    }

    if (p[0] === '(' && p.endsWith(')')) {

        return `'${p.slice(1, p.length-1).replace(/\(?\:(\w+(\.\w+)*)\)?/g, (s, s1)=>(`'+get('${s1}')+'`))}'`;
    }

    return p;
}

export function resolveNativeProp(k, v) {
    let adapter = PROP_ADAPTERS[k];

    if (adapter) {
        return this::adapter(v);
    }

    if (!v || v[0] !== ':') return k ? `${k}="${v}"` : v;

    let [p, ...pipes] = v.slice(1).split('|');

    let value = [parseBindingExpression(p), ...pipes].join('|');

    return (VALUE_ADAPTERS[k] || VALUE_ADAPTERS['*']).call(this, value, k);
}

export function resolveComponentProps(props, children) {

    let propsObj = {};

    const newProps = Object.keys(props || {}).reduce((r, p) => {

        const key = p, value = props[p];
        let adapter = PROP_ADAPTERS[key];

        if (adapter) {

            r.push(this::adapter(value));

        } else {

            propsObj[key] = `${resolveComponentProp.call(this, key, value)}`;
        }

        return r;

    }, []);

    const result = Object.keys(propsObj || {}).map(p => `${p}: ${propsObj[p]}`);
    if (result.length) {

        newProps.push(`[props]="{${result.join(', ')}}"`);
    }
    if (children.length) {
        newProps.push(`children="${encodeURIComponent(children.map(c => (typeof c === 'string') ? resolveNativeProp.call(this, '', c.trim()) : createElement.apply(this, c)))}"`);
    }
    return newProps;

};

function resolveComponentProp(k, v) {


    if (!v || v[0] !== ':') return `'${v}'`;

    let [p, ...pipes] = v.slice(1).split('|');

    let value = [parseBindingExpression(p), ...pipes].join('|');

    return value;
}

export function stringifyComponent(type, props, children) {

    const prefix = `${type} ${props.join(' ')}`;

    const str = (type !== 'input' && type !== 'img') ? `<${prefix}>${children ? children.join('') : ''}</${type}>` : `<${prefix}/>`;

    return str;

};