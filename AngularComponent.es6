import {provide, Injector, Inject,Component, Class,  DynamicComponentLoader, ViewEncapsulation} from 'angular2/core';

export default {

    internalConstructor(opts) {

        this.log('constructor', {...this}, opts, this.state, this.getDefaults());

        this.state={...this.getDefaults()};
    }
    ,
    setState(newState, cb) {

        this.state =  Object.assign({},this.state, newState);

        cb && cb();
    },

    ngOnInit() {

        this.log('init', this);

        this.update(this.props);

        this.init();
    },

    ngOnDestroy() {

        this.done();
    },

    ngOnChanges(diff){

        if(diff.props) {

            this.log('changes props', diff.props);
        }

        if(diff.children) {

            this.injector.get(DynamicComponentLoader).loadAsRoot(
                Component({template:decodeURIComponent(this.children)}).Class({constructor:[function Fake(){}]})
                ,
                `#children_${this._id}`);
        }
    }
}