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
      title: {
        type: Sequelize.TEXT,
      },
      director: {
        type: Sequelize.TEXT,
      },
      year: {
        type: Sequelize.INTEGER,
      }
    },
      { timestamps: false, }),
    "books": database.define('books', {
      title: {
        type: Sequelize.TEXT,
      },
      author: {
        type: Sequelize.TEXT,
      },
      year: {
        type: Sequelize.INTEGER,
      },
      is_read: {
        type: Sequelize.BOOLEAN
      },
      is_owned: {
        type: Sequelize.BOOLEAN
      }
    },
      { timestamps: false, }),
    "music": database.define('music', {
      title: {
        type: Sequelize.TEXT,
      },
      artist: {
        type: Sequelize.TEXT,
      },
      year: {
        type: Sequelize.INTEGER,
      },
      format: {
        type: Sequelize.INTEGER
      },
    },
      { timestamps: false, }),
    "todos": database.define('todos', {
      type: {
        type: Sequelize.TEXT,
      },
      title: {
        type: Sequelize.TEXT,
      },
      notes: {
        type: Sequelize.TEXT,
      },
    },
      { timestamps: false, }),
  }

  return models;
}

const models = setUpModels();
sync();

server.setUpRoutes(models, jwtFunctions, database);
server.listen(config.port);

