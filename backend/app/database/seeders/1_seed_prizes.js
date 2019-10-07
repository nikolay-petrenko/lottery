module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      "prizes",
      [
        {
          amount: 5,
          title: "Рюкзак Everad"
        }, {
          amount: 10,
          title: "Термокружки Everad"
        }, {
          amount: 30,
          title: "USB браслет Everad"
        }, {
          amount: 5,
          title: "Powerbank Everad"
        }, {
          amount: 40,
          title: "Значки от Affhub"
        }, {
          amount: 10,
          title: "Ветровка от Affhub"
        }, {
          amount: 30,
          title: "USB зажигалка Affhub"
        }, {
          amount: 10,
          title: "Пуловер Affhub"
        }
      ],
      {}
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("prizes", null, {});
  }
};
