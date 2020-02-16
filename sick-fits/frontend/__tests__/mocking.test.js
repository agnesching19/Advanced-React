function Person(name, foods) {
  this.name = name;
  this.foods = foods;
}

Person.prototype.fetchFavFoods = function() {
  return new Promise((resolve, reject) => {
    // Simulate an API
    setTimeout(() => resolve(this.foods), 2000);
  });
}

describe('Mocking learning', () => {
  it('mocks a reg function', () => {
    const fetchDogs = jest.fn();
    fetchDogs('Bob');
    expect(fetchDogs).toHaveBeenCalled();
    expect(fetchDogs).toHaveBeenCalledWith('Bob');
    fetchDogs('Kevin');
    expect(fetchDogs).toHaveBeenCalledTimes(2);
  });

  it('can create a person', () => {
    const me = new Person('Bob', ['milk', 'rice']);
    expect(me.name).toEqual('Bob');
  });

  it('can fetch foods', async () => {
    const me = new Person('Bob', ['milk', 'rice']);
    // Mock the fetchFavFoods function
    me.fetchFavFoods = jest.fn().mockResolvedValue(['sushi', 'bread']);
    const favFoods = await me.fetchFavFoods();
    expect(favFoods).toContain('bread');
  });
});