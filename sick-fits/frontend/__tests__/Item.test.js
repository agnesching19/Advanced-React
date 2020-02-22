import ItemComponent from '../components/Item';
import { shallow } from 'enzyme';

const fakeItem = {
  id: 'ABC123',
  title: 'The Best Whisky',
  price: 99999,
  description: 'The best whisky in the world that you should try!',
  image: 'whisky.jpg',
  largeImage: 'largeWhisky.jpg'
}


describe('<Item />', () => {
  it('renders the PriceTag and title properly', () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    const PriceTag = wrapper.find('PriceTag');
    expect(PriceTag.children().text()).toBe('£999.99');
    expect(wrapper.find('Title a').text()).toBe(fakeItem.title);
  });

  it('renders the image properly', () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    const image = wrapper.find('img');
    expect(image.props().src).toBe(fakeItem.image);
    expect(image.props().alt).toBe(fakeItem.title);
  });

  it('renders out the buttons properly', () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    const buttonList = wrapper.find('.buttonList');
    expect(buttonList.children()).toHaveLength(3);
    expect(buttonList.find('Link')).toHaveLength(1);
    expect(buttonList.find('AddToCart')).toBeTruthy();
    expect(buttonList.find('DeleteItem').exists()).toBe(true);
  });
});