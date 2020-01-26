import React, { Component } from "react";
import { Mutation, Query } from 'react-apollo';
import gql from 'graphql-tag';
import Router from 'next/router';
import From from './styles/Form';
import formatMoney from '../lib/formatMoney';
import Error from './ErrorMessage';

class DeleteItem extends Component {

  render() {
    return (
      <button>{this.props.children}</button>
    )
  }
}

export default DeleteItem;
