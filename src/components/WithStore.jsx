import React from 'react';

const withStore = storeMap => (Component) => {
  class WithStore extends React.Component {
    state = Object.keys(storeMap).reduce((state, name) => ({ ...state, [name]: storeMap[name].getData() }), {});
    subs = [];

    componentDidMount() {
      this.subs = Object.keys(storeMap).map(name => storeMap[name].asObservable()
        .subscribe(data => this.setState({ [name]: data })));
    }

    componentWillUnmount() {
      this.subs.forEach(subs => subs.unsubscribe());
    }

    render() {
      return <Component {...this.props} {...this.state} />;
    }
  }
  return WithStore;
};

export default withStore;
