export default {

    internalConstructor(opts) {

        this.log('constructor');

        this.state={...this.getDefaults()};
    }
    ,
    setState(newState, cb) {

        this.state =  Object.assign({},this.state, newState);

        cb && cb();
    },

    ngOnInit() {

        this.log('init', this);

        this.init();
    },

    ngOnDestroy() {

        this.state = null;

        this.done();
    },

    ngOnChanges(diff){

        if(diff.props) {

            this.log('changes props', diff.props);

            this.update(diff.props.currentValue);
        }

        if(diff.children) {

            const {Component, DynamicComponentLoader,ooo} = ng.core;

            this.dcl.loadAsRoot(
                Component({template:decodeURIComponent(this.children)}).Class({constructor:[function Fake(){}]})
                ,
                `#children_${this._id}`);
        }
    }
}