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
    ,
    dynamicComponent(value, ...args) {

        if (Array.isArray(value)) {

            if (this._dynamiclyLoaded) {
                console.log('this._dynamiclyLoaded');
                return;
            }

            const testComponent = Component({
                selector: 'test-component',
                template: `<h1>Test dynamicComponentLoader${Date.now()}</h1>`
            }).Class({
                constructor: function () {}
            });

            console.log('dynamicComponent1234567890', this._dcl, this._ref, this, ...args);

            setTimeout(() => this._dcl.loadAsRoot(testComponent, '#superTest'), 1000);
            //this._dcl.loadIntoLocation(testComponent, this._ref, '.spawnClass');

            //this._dcl.loadNextToLocation(testComponent, this._ref);

            this._dynamiclyLoaded = true;

            return '<span id="superTest"></span>'

        } else {

            return value;

        }


    }
}