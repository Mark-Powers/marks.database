const express = require('express');
const bodyParser = require('body-parser');

const server = express();
server.use(bodyParser.json());

function listen(port) {
    server.listen(port, () => console.info(`Listening on port ${port}!`));
}

function setUpRoutes(models, jwtFunctions, database) {
    server.use(function (req, res, next) {
        // Hack to ensure only local user can access this
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

    let routes = [["movies"], ["books"], ["todos", "type, title"], ["music"], ["foods", "name"]];
    routes.forEach((route) =>{
        server.get(`/${route[0]}`, async (req, res, next) => {
            await getTable(route[0], req, res, next, route[1]);
        })
        server.post(`/${route[0]}`, async (req, res, next) => {
            await postTable(route[0], req, res, next, route[1]);
        })
        server.delete(`/${route[0]}`, async (req, res, next) => {
            await deleteTable(route[0], req, res, next, route[1]);
        })
    })
}

module.exports = {
    listen,
    setUpRoutes
};


