const express = require('express');
const bodyParser = require('body-parser');

const server = express();
server.use(bodyParser.json());

function listen(port) {
    server.listen(port, () => console.info(`Listening on port ${port}!`));
}

function setUpRoutes(models, jwtFunctions, database) {
    server.use(function (req, res, next) {
        if(req.ip.endsWith("127.0.0.1")){
            next()
        } else {
            res.status(400).send("Cannot connect remotely");
        }
    })
    // Route logging
    server.use(function (req, res, next) {
        console.debug(new Date(), req.method, req.originalUrl);
        next()
    })

    server.get('/', (req, res) => res.sendFile(__dirname + "/index.html"))
    var getTable = async function(name, req, res, next, orderby = "title"){
        try {
            var result = await database.query(`SELECT * FROM ${name} order by ${orderby}`, { type: database.QueryTypes.SELECT })
            res.status(200).send(result);
            next();
        } catch (e) {
            console.log(e)
            res.status(400).send(e.message);
        }
    };
    var postTable = async function(name, req, res, next, orderby = "title"){
        try{
            let item = req.body;
            console.log(item);
            await models[name].create(item);
            var result = await database.query(`SELECT * FROM ${name} order by ${orderby}`, { type: database.QueryTypes.SELECT })
            res.status(200).send(result);
        } catch (e) {
            console.log(e);
            res.status(400).send(e.message);
        }
    }
    var deleteTable = async function(name, req, res, next, orderby = "title"){
        try{
            let id = req.body.id;
            console.log(`Deleting ${id}`);
            await models[name].destroy({where: {id: id}});
            var result = await database.query(`SELECT * FROM ${name} order by ${orderby}`, { type: database.QueryTypes.SELECT })
            res.status(200).send(result);
        } catch (e) {
            console.log(e);
            res.status(400).send(e.message);
        }
    }

    server.get('/movies', async (req, res, next) => {
        await getTable('movies', req, res, next);
    })
    server.post('/movies', async (req, res, next) => {
        await postTable('movies', req, res, next);
    })
    server.delete('/movies', async (req, res, next) => {
        await deleteTable('movies', req, res, next);
    })
    server.get('/books', async (req, res, next) => {
        await getTable('books', req, res, next);
    })
    server.post('/books', async (req, res, next) => {
        await postTable('books', req, res, next);
    })
    server.delete('/books', async (req, res, next) => {
        await deleteTable('books', req, res, next);
    })
    server.get('/todos', async (req, res, next) => {
        await getTable('todos', req, res, next, "type, title");
    })
    server.post('/todos', async (req, res, next) => {
        await postTable('todos', req, res, next, "type, title");
    })
    server.delete('/todos', async (req, res, next) => {
        await deleteTable('todos', req, res, next, "type, title");
    })
    server.get('/music', async (req, res, next) => {
        await getTable('music', req, res, next);
    })
    server.post('/music', async (req, res, next) => {
        await postTable('music', req, res, next);
    })
    server.delete('/music', async (req, res, next) => {
        await deleteTable('music', req, res, next);
    })

}

module.exports = {
    listen,
    setUpRoutes
};


