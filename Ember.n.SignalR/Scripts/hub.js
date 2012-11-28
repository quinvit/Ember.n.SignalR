/// <reference path="_references.js" />

(function (app) {
    var hub = $.connection.customerHub;

    function findCustomer(id) {
        var c = app.customerController.get('customers').findProperty('id', id);
        return c;
    }

    hub.client.add = function (message) {
        var customer = JSON.parse(message);
        var c = findCustomer(customer.id);
        !c && app.customerController.get('customers').pushObject(app.CustomerModel.create(customer));
    }

    hub.client.update = function (message) {
        var customer = JSON.parse(message);
        var c = findCustomer(customer.id);
        c && c.set('quiet', true) && c.setProperties(customer) && c.set('quiet', false);
    }

    hub.client.remove = function (message) {
        var customer = JSON.parse(message);
        var c = findCustomer(customer.id);
        c && app.customerController.get('customers').removeObject(c);
    }

    $.connection.hub.start();

    app.hub = hub;

})(window.App);