import {capitalize,properify, dashify} from 'reangulact/utils.es6';

const {Component, DynamicComponentLoader, ElementRef} = ng.core;
const {ROUTER_DIRECTIVES} = ng.router;

const PROP_ADAPTERS = {
    'id': (v) => `id="${v}"`
    ,
    'each': (v) => {

        const [varId, op, dataId] = v.split(' ');

        return `*ngFor="#${varId} of get('${dataId.slice(1)}')" attr.data-index="{{setState({'${varId}':${varId}})?${varId}:${varId}}}"`;
    }
    ,
    'if': (v) => `*ngIf="get('${v.slice(1)}')"`
    ,
    'ifNot': (v) => `*ngIf="!get('${v.slice(1)}')"`
    ,
    style(v){

        if (!v) return '';

        if (v[0]===':'){
            v = parseBindingExpression(v.slice(1));
            return `[style]="${v}"`;
        }

        const obj = (typeof v === 'string') ? v.split(';')
            .reduce((p, q)=>{
                const kv = q.split(':');
                const k = kv[0].trim();
                if (k){
                    p[k] = (kv[1]||'').trim();
                }
                return p;
            }, {}) : v;

        return `style="${Object.keys(obj).map(k=>`${k}:${obj[k]}`).join(';')}"`
    }
};

const VALUE_ADAPTERS = {
    '': (v)=>`{{${v}}}`,
    'click': (v)=>`(click)="${v}($event)"`,
    'change': (v)=>`(change)="${v}($event)"`,
    'scroll': (v)=>`(scroll)="${v}($event)"`
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
    console.log('==',val);
    return val;
}

export function prepare(ctor) {

    if (ctor.prepared) return ctor.prepared;

    ctor._directives = new Map();

    return Component({

        selector: dashify(ctor.name)
        ,
        inputs: ['props']
        ,
        template: (createElement.apply(ctor, ctor.prototype.render()))
        ,
        directives: [...ctor._directives.values(), ROUTER_DIRECTIVES]

    }).Class({

        extends : ctor,

        constructor: [DynamicComponentLoader,ElementRef, function (dcl, ref){

            this._dcl = dcl;
            this._ref = ref;
            this._directives = ctor._directives;

            ctor.call(this);
        }]

    });
}

function createElement(type='undefined', props, ...children) {

    if (type==='children'){
        return `<ng-content></ng-content>`
    }
    let after='';
    if (props && props.if){
        const ifNot = props.if;
        after = children.filter((c)=>(c[0]==='else')).map(c => createElement.apply(this, ['block', {ifNot}, c[2]])).join('')
    }

    if (type==='block'){
        const props2=[]
        if (props && props.if){
            props2.push(`[ngIf]="get('${props.if.slice(1)}')"`)
        }
        if (props && props.ifNot){
            props2.push(`[ngIf]="!get('${props.ifNot.slice(1)}')"`)
        }
        if (props && props.each){
            const [varId, op, dataId] = props.each.split(' ');

            props2.push(`ngFor #${varId} [ngForOf]="get('${dataId.slice(1)}')"`)
        }
        return stringifyComponent('template', props2,
            children.map(c => (typeof c === 'string') ? resolveNativeProp.call(this, '', c.trim()) : createElement.apply(this, c))
        )+after;
    }

    if (typeof type !== 'string') {

        const typeName = dashify(type.name);

        this._directives.set(typeName, prepare(type));

        props = this::resolveComponentProps(props);

        return stringifyComponent(typeName, props,
            children.map(c => (typeof c === 'string') ? resolveNativeProp.call(this, '', c.trim()) : createElement.apply(this, c))
        )+after;
    }

    return stringifyComponent(type,
        Object.keys(props || {}).map((k) =>(resolveNativeProp.call(this, k, props[k])))
        ,
        children.map(c => (typeof c === 'string') ? resolveNativeProp.call(this, '', c.trim()) : createElement.apply(this, c))
    )+after;
}

function parseBindingExpression(p) {

    if (p.match(/^\w+(\.\w+)*$/)) {

        return `get('${p}')`;
    }

    if (p[0] === '{' && p.endsWith('}')) {

        return `${p.replace(/\(:(\w+(\.\w+)*)\)/g, (s, s1)=>(`get('${s1}')`))}`;
    }

    if (p[0] === '(' && p.endsWith(')')) {

        return log(`'${p.slice(1, p.length-1).replace(/\(:(\w+(\.\w+)*?)\)/g, (s, s1)=>(`'+get('${s1}')+'`))}'`);
    }

    return p;
}

export function resolveNativeProp(k, v) {

    const isFlatValue = !v || v[0] !== ':';

    let adapter = PROP_ADAPTERS[k];

    if (adapter) {
        return this::adapter(v);
    }

    if (isFlatValue) return k ? `${k}="${v}"` : v;

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
    //if (children.length) {
    //    newProps.push(`children="${encodeURIComponent(children.map(c => (typeof c === 'string') ? resolveNativeProp.call(this, '', c.trim()) : createElement.apply(this, c)))}"`);
    //}
    return newProps;

};

function resolveComponentProp(k: string, v) {


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