import {capitalize,properify, dashify} from 'reangulact/utils.es6';

function parseBindingExpression(p) {

    if (p.match(/^\w+(\.\w+)*$/)) {

        return `get('${p}')`;
    }

    if (p[0] === '{' && p.endsWith('}')) {

        return `${p.replace(/\(:(\w+(\.\w+)*)\)/g, (s, s1)=>(`get('${s1}')`))}`;
    }

    if (p[0] === '(' && p.endsWith(')')) {

        return (`'${p.slice(1, p.length - 1).replace(/\(:(\w+(\.\w+)*?)\)/g, (s, s1)=>(`'+get('${s1}')+'`))}'`);
    }

    return p;
}

const OPS = {
    'is': '===',
    'isnt': '!=='
};

export const PROP_ADAPTERS = {
    'id': ({result, value}) => `id="${value}"`
    ,
    'each': ({result, value}) => {

        const [varId, op, dataId] = value.split(' ');

        result['attr.data-index'] = `{{setState({'${varId}':${varId}})?${varId}:${varId}}}`;
        result['*ngFor'] = `#${varId} of get('${dataId.slice(1)}')`;

    }
    ,
    'if': ({result, value}) => {
        let [ifExpr, ifOp, ifMatch]= value.split(' ');

        let val = ifExpr.slice(1);

        if (ifMatch !== undefined) {
            ifMatch = (ifMatch[0] === ':') ? `get('${ifMatch.slice(1)}')` : `'${ifMatch}'`;

            result['*ngIf']=`get('${val}') ${OPS[ifOp]} ${ifMatch}`

        } else {

            result['*ngIf']=`get('${val}')`
        }

    }
    ,
    'ifNot': ({result, value}) => {result['*ngIf']=`!get('${value.slice(1)}')`}
    ,
    ['class']({result,isLiteral, expr, value}){

        if (!value) return '';

        if (!isLiteral) {

            result[`[ngClass]`]=expr;

        } else {

            result['class']=value;
        }
    }
    ,
    style({result,isLiteral, expr, value}){

        if (!value) return '';

        if (!isLiteral) {

            result['[ngStyle]']=expr;

        } else {

            const obj = (typeof value === 'string') ? value.split(';')
                .reduce((p, q)=> {
                    const kv = q.split(':');
                    const k = kv[0].trim();
                    if (k) {
                        p[k] = (kv[1] || '').trim();
                    }
                    return p;
                }, {}) : value;

            result['style']=`${Object.keys(obj).map(k=>`${k}:${obj[k]}`).join(';')}`
        }

    }
    ,
    'change': ({result,expr})=>{result[`(change)`]=`${expr}($event)`}
    ,
    'scroll': ({result,expr})=>{result[`(scroll)`]=`${expr}($event)`}
    ,
    'click': ({result,value})=>{result[`(click)`]=`getClicker('${value.slice(1)}')($event)`}

    ,
    'NATIVE:*': ({result,key,expr})=>{result[`[attr.${key}]`]=expr}
    ,
    'NATIVE:disabled': ({result,expr})=>{result[`[disabled]`]=expr}
    ,
    ['COMPONENT:*']({props, key, expr, value}){

        if (!value) return '';

        props[key]=expr;
    }
};

export function resolveInnerText(v='') {
    v = v.trim();

    if (!v || v[0] !== ':') return v;

    let [p, ...pipes] = v.slice(1).split('|');

    return `{{${parseBindingExpression(p.trim())}}}`;
    //return `{{dynamicComponent(${parseBindingExpression(p.trim())})}}`;
}

export function resolveNativeProps(props, result, prefix = 'NATIVE') {

    Object.keys(props || {}).forEach(k => {
        let v = props[k];

        const isLiteral = !v || v[0] !== ':';

        const opts = {key: k, value: v, isLiteral , result};

        if (!isLiteral) {
            let [p, ...pipes] = v.slice(1).split('|');
            opts.pipes = pipes;
            opts.expr = parseBindingExpression(p);
        } else {
            opts.expr = `'${v}'`;
        }

        let adapter = PROP_ADAPTERS[`${prefix}:${k}`] || PROP_ADAPTERS[k] || PROP_ADAPTERS[`${prefix}:*`];

        this::adapter(opts);

    });
}

export function resolveComponentProps(_props, result) {

    let props = {};

    Object.keys(_props || {}).forEach((k) =>{

        let v = _props[k];

        const isLiteral = !v || v[0] !== ':';

        const opts = {key:k,value:v, isLiteral , result, props};

        if (!isLiteral) {
            let [p, ...pipes] = v.slice(1).split('|');
            opts.pipes = pipes;
            opts.expr = parseBindingExpression(p)
        } else {
            opts.expr = `'${v}'`
        }

        let adapter = PROP_ADAPTERS['COMPONENT:'+k]||PROP_ADAPTERS[k]||PROP_ADAPTERS['COMPONENT:*'];

        this::adapter(opts);

    });

    const propKeys = Object.keys(props);
    if (propKeys.length){
        result['[props]']=`{${propKeys.map(p => `${p}: ${props[p]}`).join(', ')}}`;
    }
};


