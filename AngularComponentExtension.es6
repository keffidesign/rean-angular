const {Component, DynamicComponentLoader} = ng.core;

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

       //this.log('changes', diff);

        if(diff.props) {

            const props = diff.props.currentValue;
            if (!this.state){

                this.update(this.getDefaults(props));

            } else {

                this.update(props);
            }

        }
    }
}