import Items from '../components/Items';
import { checkPropTypes } from 'prop-types';

const Home = props => (
  <div>
    <Items page={parseFloat(props.query.page) || 1}/>
  </div>
);

export default Home;