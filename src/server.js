const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
//const request = require('request');
const crypto = require('crypto');

const server = express();
server.use(cookieParser())
server.use(bodyParser.json());
//server.use(bodyParser.urlencoded({ extended: true }));

function listen(port) {
    server.listen(port, () => console.info(`Listening on port ${port}!`));
}

function setUpRoutes(models, jwtFunctions, database) {
    // Authentication routine
    server.use(function (req, res, next) {
        if (!req.path.toLowerCase().startsWith("/login")) {
            let cookie = req.cookies.authorization
            if (!cookie) {
                console.debug("Redirecting to login - no cookie")
                res.redirect('/login');
                return;
            }
            try {
                const decryptedUserId = jwtFunctions.verify(cookie);
                models.users.findOne({ where: { username: decryptedUserId } }).then((user, error) => {
                    if (user) {
                        res.locals.user = user.get({ plain: true });
                    } else {
                        console.debug("Redirecting to login - invalid cookie")
                        res.redirect('/login');
                        return;
                    }
                });
            } catch (e) {
                res.status(400).send(e.message);
            }
        }
        next();
    })
    
    // Route logging
    server.use(function (req, res, next) {
        console.debug(new Date(), req.method, req.originalUrl);
        next()
    })

    server.get('/', (req, res) => res.sendFile(__dirname + "/index.html"))
    server.get('/login', (req, res) => res.sendFile(__dirname + "/login.html"))
    server.get('/styles.css', (req, res) => res.sendFile(__dirname + "/styles.css"))
    server.get('/main.js', (req, res) => res.sendFile(__dirname + "/main.js"))

    server.post('/login', async (req, res, next) => {
        const hash = crypto.createHash("sha512").update(req.body.password, "binary").digest("base64");
        const user = await models.users.findOne({ where: { username: req.body.username, password: hash } })
        if (user) {
            const token = jwtFunctions.sign(user.username);
            res.cookie('authorization', token, { expires: new Date(Date.now() + (1000 * 60 * 60)) });
            console.debug("Redirecting to page - logged in")
            res.redirect('/');
        } else {
            console.debug("Redirecting to login - invalid login")
            res.redirect('/login');
        }
    })

    var getTable = async function (name, req, res, next, orderby = "title") {
        try {
            var result = await database.query(`SELECT * FROM ${name} order by ${orderby}`, { type: database.QueryTypes.SELECT })
            res.status(200).send(result);
            next();
        } catch (e) {
            console.log(e)
            res.status(400).send(e.message);
        }
    };
    var postTable = async function (name, req, res, next, orderby = "title") {
        try {
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
    var deleteTable = async function (name, req, res, next, orderby = "title") {
        try {
            let id = req.body.id;
            console.log(`Deleting ${id}`);
            await models[name].destroy({ where: { id: id } });
            var result = await database.query(`SELECT * FROM ${name} order by ${orderby}`, { type: database.QueryTypes.SELECT })
            res.status(200).send(result);
        } catch (e) {
            console.log(e);
            res.status(400).send(e.message);
        }
    }
    var updateTable = async function (name, req, res, next, orderby = "title") {
        try {
            let id = req.body.id;
            let update = req.body.update;
            console.log(`Updating ${id}`);
            var toUpdate = await models[name].findOne({ where: { id: id } });
            console.log(toUpdate)
            console.log(update)
            await toUpdate.update(update);
            var result = await database.query(`SELECT * FROM ${name} order by ${orderby}`, { type: database.QueryTypes.SELECT })
            res.status(200).send(result);
        } catch (e) {
            console.log(e);
            res.status(400).send(e.message);
        }
    }

    let routes = [["movies"], ["books"], ["todos", "type, title"], ["music"], ["foods", "name"]];
    routes.forEach((route) => {
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
    server.put("/foods", async (req, res, next) => {
        await updateTable("foods", req, res, next, "name");
    })
    server.put("/movies", async (req, res, next) => {
        await updateTable("movies", req, res, next, "title");
    })
    server.put("/books", async (req, res, next) => {
        await updateTable("books", req, res, next, "title");
    })
    server.put("/music", async (req, res, next) => {
        await updateTable("music", req, res, next, "title");
    })
    async function getRecipes() {
        var recipes = await database.query(`SELECT * FROM recipes order by name`, { type: database.QueryTypes.SELECT })
        for (const recipe of recipes) {
            recipe.ingredients = await database.query(`SELECT * FROM ingredients where recipeId = ${recipe.id}`, { type: database.QueryTypes.SELECT })
            for (const ingredient of recipe.ingredients) {
                ingredient.food = (await database.query(`SELECT * FROM foods where id = ${ingredient.foodId}`, { type: database.QueryTypes.SELECT }))[0];
            }
        }
        return recipes;
    }
    server.post("/recipes", async (req, res, next) => {
        try {
            const newRecipe = await models["recipes"].create({ name: req.body.name, instructions: req.body.instructions })
            req.body.ingredients.forEach(async (ingredient) => {
                await models["ingredients"].create({
                    "quantity": ingredient.quantity, "foodId": ingredient.id, "recipeId": newRecipe.id
                });
            })
            var result = await getRecipes();
            res.status(200).send(result);
        } catch (e) {
            console.log(e);
            res.status(400).send(e.message);
        }
    })
    server.get("/recipes", async (req, res, next) => {
        try {
            var result = await getRecipes();
            res.status(200).send(result);
        } catch (e) {
            console.log(e);
            res.status(400).send(e.message);
        }
    })
}

module.exports = {
    listen,
    setUpRoutes
};


