const {Component, DynamicComponentLoader, } = ng.core;
const {RouteParams} = ng.router;

export default {

    ngOnInit() {

        //this.log('init', this);

        this.init();
    },

    ngOnDestroy() {

        this.state = null;

        this.done();
    },

    ngOnChanges(diff){


        if(diff.props) {

            const props = diff.props.currentValue;
            if (!this.state){

                this.state = this.getDefaults(props);

            } else {

                //this.log('changes', props);

                this.update(props);
            }

        }
    },
    getRouteParams() {

        const routeParams = this._injector.get(RouteParams);

        return routeParams.params;
    }
}