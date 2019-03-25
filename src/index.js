const server = require('./server');
const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')));

const dbCreds = config.database;
const secret = config.jwt_secret;

const jwtFunctions = {
  sign: function (message) {
    return jwt.sign({ value: message }, secret);
  },
  verify: function (token) {
    return jwt.verify(token, secret).value;
  }
}

const database = new Sequelize(dbCreds.database, dbCreds.user, dbCreds.password, {
  logging(str) {
    console.debug(`DB:${str}`);
  },
  dialectOptions: {
    charset: 'utf8mb4',
    multipleStatements: true,
  },
  //   host: dbCreds.host,
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },
});

database.authenticate().then(() => {
  console.debug(`database connection successful: ${dbCreds.database}`);
}, (e) => console.log(e));

async function sync(alter, force, callback) {
  await database.sync({ alter, force, logging: console.log });
}

function setUpModels() {
  const models = {
    "movies": database.define('movies', {
      title: Sequelize.TEXT,
      director: Sequelize.TEXT,
      year: Sequelize.INTEGER,
    },
      { timestamps: false, }),
    "books": database.define('books', {
      title: Sequelize.TEXT,
      author: Sequelize.TEXT,
      year: Sequelize.INTEGER,
      is_read: Sequelize.BOOLEAN,
      is_owned: Sequelize.BOOLEAN
    },
      { timestamps: false, }),
    "music": database.define('music', {
      title: Sequelize.TEXT,
      artist: Sequelize.TEXT,
      year: Sequelize.INTEGER,
      format: Sequelize.INTEGER
    },
      { timestamps: false, }),
    "todos": database.define('todos', {
      type: Sequelize.TEXT,
      title: Sequelize.TEXT,
      notes: Sequelize.TEXT,
    },
      { timestamps: false, }),
    "foods": database.define('foods', {
        name: Sequelize.TEXT,
        notes: Sequelize.TEXT,
        status: Sequelize.INTEGER,
      },
        { timestamps: false, }),
  }

  return models;
}

const models = setUpModels();
sync();

server.setUpRoutes(models, jwtFunctions, database);
server.listen(config.port);

