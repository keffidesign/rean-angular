const {Component, DynamicComponentLoader} = ng.core;

export default {

    internalConstructor(opts) {

        this.log('constructorr', this);

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

        this.log('changes', diff);

        if(diff.props) {

            this.update(diff.props.currentValue);
        }

        //if(diff.children) {
        //
        //    this._dcl.loadIntoLocation(
        //        Component({
        //            template:decodeURIComponent(this.children),
        //            directives: [...this._directives.values()]
        //        }).Class({constructor:[function Fake(){
        //
        //        }]})
        //        ,
        //        this._ref
        //        ,
        //        `children_${this._id}`);
        //}
    }
}