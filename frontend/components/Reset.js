import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';

const RESET_MUTATION = gql`
  mutation RESET_MUTATION($resetToken: String!, $password: String!, $confirmPassword: String!) {
    resetPassword(resetToken: $resetToken, password: $password, confirmPassword: $confirmPassword) {
      id
      email
      name
    }
  }
`;

class Reset extends Component {
  static propTypes = {
    resetToken: PropTypes.string.isRequired
  }

  state = {
    password: '',
    confirmPassword: ''
  }

  saveToState = e => {
    this.setState({ [e.target.name]:  e.target.value });
  }
  
  render() {
    const { resetToken } = this.props;
    const { password, confirmPassword } = this.state;

    return (
      <Mutation
        mutation={RESET_MUTATION}
        variables={{ resetToken, password, confirmPassword }}
        refetchQueries={[{ query: CURRENT_USER_QUERY }]}
      >
        {(reset, { error, loading }) => 
          <Form method="post" onSubmit={async e => {
            e.preventDefault();
            await reset();
            this.setState({ password: '', confirmPassword: '' });
          }}>
            <fieldset disabled={loading} aria-busy={loading}>
              <h2>Reset your password</h2>
              <Error error={error} />

              <label htmlFor='password'>
                Password
                <input type='password' name='password' placeholder='Password' value={password} onChange={this.saveToState} />
              </label>

              <label htmlFor='confirmPassword'>
                Confirm your password
                <input type='password' name='confirmPassword' placeholder='Confirm password' value={confirmPassword} onChange={this.saveToState} />
              </label>

              <button type='submit'>Request Your Password!</button>
            </fieldset>
          </Form>
        }
      </Mutation>
      
    )
  }
}

export default Reset;
