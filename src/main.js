window.onload = function () {
    var movieData = new Vue({
        el: '#data',
        data: {
            activeTab: 0,
            movies: [],
            books: [],
            music: [],
            todos: [],
            foods: [],
            recipes: [],
            displayedRecipes: [],
            ingredients: [],
            showFoodTable: true,
            recipeName: "",
            recipeInstructions: "",
            selTodoType: "all",
            selFoodType: "1"
        },
        methods: {
            setTab: function (value) {
                this.activeTab = value;
            },
            clearData: function () {
                this.m = {
                    year: new Date().getFullYear(),
                    title: "",
                    director: ""
                }
                this.em = {
                    year: new Date().getFullYear(),
                    title: "",
                    director: "",
                    id:""
                }
                this.b = {
                    year: new Date().getFullYear(),
                    title: "",
                    author: "",
                    is_read: 1,
                    is_owned: 1
                }
                this.eb = {
                    year: new Date().getFullYear(),
                    title: "",
                    author: "",
                    is_read: 1,
                    is_owned: 1,
                    id:""
                }
                this.t = {
                    type: "",
                    title: "",
                    notes: "",
                }
                this.mu = {
                    title: "",
                    artist: "",
                    year: new Date().getFullYear(),
                    format: 0,
                }
                this.f = {
                    name: "",
                    note: "",
                    status: 0
                }
            },
            requestThenUpdate: function (name, request) {
                fetch(request)
                    .then(response => response.json())
                    .then(response => this[name] = response);
            },
            post: function (obj, name, path, event) {
                this.requestThenUpdate(name, new Request(path, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(obj)
                }));
                this.clearData();
            },
            remove: function (obj, name, path, title = "title") {
                console.log(title)
                console.log(obj);
                if (confirm(`Delete "${obj[title]}"?`)) {
                    this.requestThenUpdate(name, new Request(path, {
                        method: 'delete',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(obj)
                    }))
                }
            },
            update: function (obj, name, path, field, value) {
                update = {}
                update[field] = value
                this.requestThenUpdate(name, new Request(path, {
                    method: 'put',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: obj.id, update: update })
                }))
            },
            updateMany: function (obj, name, path) {
                update = {}
                update = obj;
                this.requestThenUpdate(name, new Request(path, {
                    method: 'put',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: obj.id, update: update })
                }))
            },
            findById: function (list, id) {
                return list.find(i => {
                    return i.id == id;
                });
            },
            addIngredient: function (food) {
                var quantity = prompt("Quantity:", "");
                if (quantity) {
                    this.ingredients.push({ id: food.id, quantity: quantity });
                }
            },
            removeIngredient: function (index) {
                this.ingredients.splice(index, 1);
            },
            submitRecipe: function () {
                if (confirm(`Create recipe "${this.recipeName}"?`)) {
                    var obj = {
                        name: this.recipeName,
                        instructions: this.recipeInstructions,
                        ingredients: this.ingredients,
                    }
                    this.requestThenUpdate("recipes", new Request("/recipes", {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(obj)
                    }))
                }
            },
            toggleRecipe: function(i) {
                if(this.displayedRecipes.includes(i)){
                    var index = this.displayedRecipes.indexOf(i);
                    this.displayedRecipes.splice(index, 1);
                } else {
                    this.displayedRecipes.push(i);
                }
            },
            exportShoppingList: function(){
                var list = "Shopping list:\n"
                this.foodFilter.forEach(item => {
                    list += item.name + "\n";
                })
                console.log(list);
                navigator.clipboard.writeText(list)
            },
            prepareMovieEntryEdit: function(movie){
                this.em.id=movie.id;
                this.em.title=movie.title;
                this.em.director=movie.director;
                this.em.year=movie.year;
                this.activeTab=10;
            },
            prepareBookEntryEdit: function(book){
                this.eb.id = book.id;
                this.eb.title = book.title;
                this.eb.author = book.author;
                this.eb.year = book.year;
                this.eb.is_read = book.is_read;
                this.eb.is_owned = book.is_owned;
                this.activeTab = 11;
            }
        },
        created() {
            this.clearData();
            ["movies", "books", "music", "todos", "foods", "recipes"].forEach(item => {
                fetch(new Request(`/${item}`)).then(response => response.json())
                    .then(response => this[item] = response);
            })
        },
        computed: {
            todoTypes: function () {
                var types = [];
                this.todos.forEach(todo => {
                    if (!types.includes(todo.type)) {
                        types.push(todo.type);
                    }
                })
                return types;
            },
            todoFilter: function () {
                if (this.selTodoType == "all") {
                    return this.todos;
                } else {
                    return this.todos.filter(todo => {
                        return todo.type == this.selTodoType;
                    })
                }
            },
            foodFilter: function () {
                if (this.selFoodType == "all") {
                    return this.foods;
                } else {
                    return this.foods.filter(food => {
                        return food.status == this.selFoodType;
                    })
                }
            },
        }
    });
}