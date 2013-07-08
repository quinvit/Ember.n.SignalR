/// <reference path="_references.js" />
// App
(function (wnd) {
    "use strict";

    function getView(name) {
        var template = '';
        $.ajax(
                {
                    url: '/Templates/' + name + '.htm',
                    async: false,
                    success: function (text) {
                        template = text;
                    }
                });
        return Ember.Handlebars.compile(template);
    };

    wnd.App = Ember.Application.create();

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
                message = { errorCode: xhr.status, errorMessage: xhr.statusText };
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
                    data: JSON.stringify({ 'id': id }),
                    type: 'POST',
                    async: false,
                    success: function (data) {
                        message = data;
                    }
                });

            if (xhr.status != 200) { // error
                message = { errorCode: xhr.status, errorMessage: xhr.statusText };
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
                    data: JSON.stringify({ 'id': id }),
                    type: 'DELETE',
                    async: false,
                    success: function (data) {
                        message = data;
                    }
                });

            if (xhr.status != 200) { // error
                message = { errorCode: xhr.status, errorMessage: xhr.statusText };
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
                message = { errorCode: xhr.status, errorMessage: xhr.statusText };
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
        quiet: false,
        random: function () {
            this.setProperties({ firstName: String.random(), lastName: String.random(), email: String.random().toLowerCase() + '@gmail.com', phone: '(097) ' + Number.random(3) + '-' + Number.random(4) });
            return this;
        },
        propertyChanged: function () {
            try {
                if (!this.get('quiet') && this.get('id')) {
                    App.hub.server.update(this.plain());
                }
            }
            catch (e) {

            }
        } .observes('firstName', 'lastName', 'email', 'phone', 'active'),
        plain: function () {
            return this.getProperties("id", "firstName", "lastName", "email", "phone", "active");
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
                this.get('currentCustomer')
                    .set('quiet', true)
                    .set('active', false)
                    .setProperties(this.get('currentResult').data)
                    .set('quiet', false);
            }
            this.set('currentCustomer', customer);
            this.set('currentResult', App.ResultModel.create({ errorMessage: 'Click Submit to create new customer.' }));
        },
        create: function (customer) {
            this.set('currentResult', this.get('store').create(customer.plain()));
            if (!this.currentResult.errorCode) {
                this.set('currentCustomer', App.CustomerModel.create());
                var newCustomer = App.CustomerModel.create(this.get('currentResult').data);
                this.get('customers').pushObject(newCustomer);
            }
        },
        remove: function (id) {
            var customer = this.get('customers').findProperty('id', id);
            if (!customer) return;
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
                    var customer = this.get('customers').findProperty('id', this.currentResult.data.id)
                    customer && customer.setProperties(this.currentResult.data);
                    return customer;
                }
            }
            else { // Empty result
                return id ? null : Ember.ArrayController.create({ content: [] });
            }
        },
        update: function (customer) {
            this.set('currentResult', this.store.update(customer.plain()));
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
            return array;
        }
    });

    App.applicationController = App.CustomerController.create();

    // Views
    App.MessageView = Ember.View.extend({
        template: getView('message'),
        init: function () {
            this._super();
            this.set('controller', App.applicationController);
        },
        name: "MessageView"
    });

    App.CreateEditCustomerView = Ember.View.extend({
        template: getView('create_edit_customer'),
        init: function () {
            this._super();
            this.set('controller', App.applicationController);
        },
        save: function (event) {
            this.get('controller').send('save');
        },
        random: function () {
            this.get('controller').send('random');
        },
        name: "CreateEditCustomerView"
    });

    App.CustomerListView = Ember.View.extend({
        template: getView('customer_list'),
        init: function () {
            this._super();
            this.set('controller', App.applicationController);
        },
        edit: function () {
            var id = $(event.target).attr('value');
            var controller = this.get('controller').send('edit', id);
        },
        remove: function () {
            var id = $(event.target).attr('value');
            var controller = this.get('controller');
            this.animateItem(id, function () {
                controller.send('remove', id);
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
        },
        name: "CustomerListView"
    });

    App.ApplicationView = Ember.View.extend({
        Title: "Example of Ember.js application",
        template: getView('main'),
        init: function () {
            this._super();
            this.set('controller', App.applicationController);
        },
        name: "ApplicationView"
    });

    App.IndexRoute = Ember.Route.extend({
        model: function () {
            return App.applicationController.initialize();
        }
    });


})(window);