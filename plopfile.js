
module.exports = function (plop) {
    // Controller generator
    plop.setGenerator('controller', {
        description: 'Create a new controller',
        prompts: [{
            type: 'input',
            name: 'name',
            message: 'Controller name (without "Controller" suffix):'
        }],
        actions: [{
            type: 'add',
            path: 'src/controllers/{{pascalCase name}}Controller.js',
            templateFile: 'templates/controller.hbs'
        }]
    });

    //Model generator
    plop.setGenerator('model', {
        description: 'Create a new model',
        prompts: [{
            type: 'input',
            name: 'name',
            message: 'Modle name:'
        }],
        actions: [{
            type: 'add',
            path: 'src/models/{{pascalCase name}}.js',
            templateFile: 'templates/model.hbs'
        }]
    });

    //Middleware generator
    plop.setGenerator('middleware', {
        description: 'Create a new middleware file',
        prompts: [{
            type: 'input',
            name: 'name',
            message: 'middleware name:'
        }],
        actions: [{
            type: 'add',
            path: 'src/middlewares/{{lowerCase name}}.middleware.js',
            templateFile: 'templates/middleware.hbs'
        }]
    });

    //Route generator
    plop.setGenerator('route', {
        description: 'Create a new route file',
        prompts: [{
            type: 'input',
            name: 'name',
            message: 'Route name:'
        }],
        actions: [{
            type: 'add',
            path: 'src/routes/{{lowerCase name}}.routes.js',
            templateFile: 'templates/route.hbs'
        }]
    });

     //Validation generator
    plop.setGenerator('validation', {
        description: 'Create a new validation file',
        prompts: [{
            type: 'input',
            name: 'name',
            message: 'validation file name:'
        }],
        actions: [{
            type: 'add',
            path: 'src/validations/{{lowerCase name}}.validation.js',
            templateFile: 'templates/validation.hbs'
        }]
    });
};