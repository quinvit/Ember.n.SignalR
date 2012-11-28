/// <reference path="_references.js" />
// App
(function (win) {
    "use strict";

    win.App = Ember.Application.create({
        name: "ManageCustomerApp",
        rootElement: '#app',
        // Extend to inherit outlet support
        ApplicationController: Ember.Controller.extend(),
        ready: function () {
            this.initialize();
        },
        getView: function (name) {
            var template = '';
            $.ajax(
                {
                    url: '/Templates/' + name + '.htm',
                    async: false,
                    complete: function (xhr, status) {
                        template = xhr.responseText;
                    }
                });
            return Ember.Handlebars.compile(template);
        }
    });

    // Data store
    App.Store = Ember.Object.extend({
        update: function (customer) {
            var message = null;
            var xhr = $.ajax(
                {
                    url: '/customer/update/',
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify(customer),
                    type: 'PUT',
                    async: false,
                    success: function (data) {
                        message = data;
                    }
                });

            if (xhr.status != 200) { // error
                message = { ErrorCode: xhr.status, ErrorMessage: xhr.statusText };
            }

            return message;
        },
        read: function (id) // !id read all
        {
            var message = null;
            var xhr = $.ajax(
                {
                    url: '/customer/read/',
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify({ 'Id': id }),
                    type: 'POST',
                    async: false,
                    success: function (data) {
                        message = data;
                    }
                });

            if (xhr.status != 200) { // error
                message = { ErrorCode: xhr.status, ErrorMessage: xhr.statusText };
            }

            return message;
        },
        remove: function (id) // !id delete all
        {
            var message = null;
            var xhr = $.ajax(
                {
                    url: '/customer/delete/',
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify({ 'Id': id }),
                    type: 'DELETE',
                    async: false,
                    success: function (data) {
                        message = data;
                    }
                });

            if (xhr.status != 200) { // error
                message = { ErrorCode: xhr.status, ErrorMessage: xhr.statusText };
            }

            return message;
        },
        create: function (customer) {
            var message = null;
            var xhr = $.ajax(
                {
                    url: '/customer/create/',
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify(customer),
                    type: 'POST',
                    async: false,
                    success: function (data) {
                        message = data;
                    }
                });

            if (xhr.status != 200) { // error
                message = { ErrorCode: xhr.status, ErrorMessage: xhr.statusText };
            }

            return message;
        }
    });

    // Models
    App.CustomerModel = Ember.Object.extend({
        id: null,
        firstName: null,
        lastName: null,
        email: null,
        phone: null,
        active: false,
        random: function () {
            this.setProperties({ firstName: String.random(), lastName: String.random(), email: String.random().toLowerCase() + '@gmail.com', phone: '(097) ' + Number.random(3) + '-' + Number.random(4) });
            return this;
        }
    });
    App.ResultModel = Ember.Object.extend({
        errorCode: 0,
        errorMessage: null
    });

    // Controllers
    App.CustomerController = Ember.Controller.extend({
        store: App.Store.create(),
        currentResult: null,
        currentCustomer: null,
        random: function () {
            var customer = App.CustomerModel.create().random();
            if (this.get('currentCustomer')) {
                this.get('currentCustomer').set('active', false);
            }
            this.set('currentCustomer', customer);
        },
        create: function (customer) {
            this.set('currentResult', this.get('store').create(customer));
            if (!this.currentResult.ErrorCode) {
                this.set('currentCustomer', App.CustomerModel.create());
                var newCustomer = App.CustomerModel.create(this.get('currentResult').data);
                this.get('customers').pushObject(newCustomer);
            }
        },
        remove: function (id) {
            var customer = this.get('customers').findProperty('id', id);
            this.set('currentResult', this.store.remove(customer.id));
            if (!this.currentResult.errorCode) {
                if (this.get('currentCustomer').id === id) {
                    this.set('currentCustomer', App.CustomerModel.create());
                }
                this.get('customers').removeObject(customer);
            }
        },
        read: function (id) {
            this.set('currentResult', this.store.read(id));
            if (!this.currentResult.errorCode) {
                if (Ember.isArray(this.currentResult.data)) { // Read all
                    var array = Ember.ArrayController.create({ content: [] });
                    this.currentResult.data.forEach(function (item, index) {
                        array.pushObject(App.CustomerModel.create(item));
                    });
                    return array;
                }
                else { // An object
                    var customer = this.get('customers')
                    .findProperty('id', this.currentResult.data.id)
                    .setProperties(this.currentResult.data);
                    return customer;
                }
            }
            else { // Empty result
                return Ember.ArrayController.create({ content: [] });
            }
        },
        update: function (customer) {
            this.set('currentResult', this.store.update(customer));
            if (!this.currentResult.errorCode) {
            }
        },
        save: function (customer) {
            var customer = this.get('currentCustomer');
            if (!customer.id) { // create
                this.create(customer);
            }
            else { // edit
                this.update(customer);
            }
        },
        edit: function (id) {
            if (this.get('currentCustomer').id != id) { // Rollback
                this.get('currentCustomer')
                .setProperties({ active: false })
                .setProperties(this.get('currentResult').data);
            }
            else {
                return;
            }
            var customer = this.read(id);
            this.set('currentCustomer', customer.set('active', true));
            this.set('currentResult',
                App.ResultModel.create({
                    errorMessage: 'Click Submit to save current customer.',
                    data: customer.getProperties("firstName", "lastName", "email", "phone") // Keep copy
                }));
        },
        customers: Ember.ArrayController.create({ content: [] }),
        initialize: function () {
            var array = this.read();
            this.set('customers', array);
            this.random();
            this.set('currentResult', App.ResultModel.create({ errorMessage: 'Click Submit to create new customer.' }));
        }
    });
    App.customersController = App.CustomerController.create();

    // Views
    App.MessageView = Ember.View.extend({
        template: App.getView('message'),
        name: "message"
    });

    App.CreateEditCustomerView = Ember.View.extend({
        template: App.getView('create_edit_customer'),
        contentBinding: 'controller.namespace.customersController',
        name: "create_edit_customer",
        save: function (event) {
            this.get('content').save();
        },
        random: function () {
            this.get('content').random();
        }
    });

    App.CustomerListView = Ember.View.extend({
        contentBinding: 'controller.namespace.customersController',
        customersBinding: 'controller.namespace.customersController.customers',
        template: App.getView('customer_list'),
        name: "customer_list",
        edit: function (event) {
            var id = $(event.target).attr('value');
            var controller = this.get('content').edit(id);
        },
        remove: function (event) {
            var id = $(event.target).attr('value');
            var controller = this.get('content');
            this.animateItem(id, function () {
                controller.remove(id);
            }, controller);
        },
        animateItem: function (id, callback, target) {
            $('#' + id).animate({ opacity: 0 }, 200, "linear", function () {
                $(this).animate({ opacity: 1 }, 200);
                if (typeof callback == 'function') {
                    target = target | null;
                    callback.call(target);
                }
            });
        }
    });

    App.ApplicationView = Ember.View.extend({
        Title: "Example of Ember.js application",
        template: App.getView('main'),
        name: "ApplicationView"
    });

    // Router, this need to connect view and controller
    App.Router = Ember.Router.extend({
        root: Ember.Route.extend({
            defaults: Ember.Route.transitionTo('index'),
            index: Ember.Route.extend({
                route: '/',
                connectOutlets: function (router) {
                    var controller = router.get('applicationController');
                    var context = App.customersController;
                    context.initialize();
                    controller.connectOutlet('application', context); // connectOutlet(nameOfView without suffix *view, controller)
                }
            })
        })
    });
})(window);