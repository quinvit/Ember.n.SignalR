namespace Ember.n.SignalR.Controllers
{
    using System;
    using System.Linq;
    using System.Web.Mvc;
    using Ember.n.SignalR.DS;
    using Ember.n.SignalR.DTOs;
    using Ember.n.SignalR.Validators;
    using FluentValidation.Results;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Serialization;
    using Ember.n.SignalR.Hubs;

    public class CustomerController : Controller
    {
        //
        // GET: /Customer/

        JsonSerializerSettings _settings = new JsonSerializerSettings {
            ContractResolver = new CamelCasePropertyNamesContractResolver(),
            NullValueHandling = NullValueHandling.Ignore
        };

        public ActionResult Index()
        {
            return View();
        }

        [AcceptVerbs(HttpVerbs.Post)]
        public string Read(Guid? id)
        {
            Result r = new Result { ErrorCode = 0, ErrorMessage = String.Empty };

            if (id == Guid.Empty || id == null)
            {
                r.Data = CrudDS<Customer>.Items.AsEnumerable<Customer>();
            }
            else
            {
                r.Data = CrudDS<Customer>.Items.Find(c => c.Id == id);
            }

            return JsonConvert.SerializeObject(r, _settings);
        }

        [AcceptVerbs(HttpVerbs.Delete)]
        public string Delete(Guid id)
        {
            Result r = new Result { ErrorCode = 0, ErrorMessage = "Delete customer successful." };
            var customer = CrudDS<Customer>.Items.First(c => c.Id == id);
            bool ok = (customer == null) ? false : CrudDS<Customer>.Items.Remove(customer);
            CrudDS<Customer>.Serialize(DateTime.Now);
            if (!ok)
            {
                r.ErrorCode = -1;
                r.ErrorMessage = "Could not find customer with id=" + id;
            }

            r.Data = customer;

            // Broadcast to all clients
            CustomerHub.Instance.Clients.All.remove(JsonConvert.SerializeObject(customer, _settings));

            return JsonConvert.SerializeObject(r, _settings);
        }

        [AcceptVerbs(HttpVerbs.Put)]
        public string Update(Customer customer)
        {
            Result r = new Result { ErrorCode = 0, ErrorMessage = "Update customer successful." };

            Customer item = CrudDS<Customer>.Items.Find(c => c.Id == customer.Id);
            if (customer == null)
            {
                r.ErrorCode = -1;
                r.ErrorMessage = "Could not find customer with id=" + customer.Id + ".";
            }
            else
            {
                CustomerValidator validator = new CustomerValidator();
                ValidationResult results = validator.Validate(customer);

                if (!results.IsValid)
                {
                    r.ErrorCode = -1;
                    r.ErrorMessage = results.Errors.First().ErrorMessage;

                    return JsonConvert.SerializeObject(r, _settings);
                }

                item.FirstName = customer.FirstName;
                item.LastName = customer.LastName;
                item.Email = customer.Email;
                item.Phone = customer.Phone;
                CrudDS<Customer>.Serialize(DateTime.Now);
            }

            r.Data = customer;

            // Broadcast to all clients
            CustomerHub.Instance.Clients.All.update(JsonConvert.SerializeObject(customer, _settings));

            return JsonConvert.SerializeObject(r, _settings);
        }

        [AcceptVerbs(HttpVerbs.Post)]
        public string Create(Customer customer)
        {
            Result r = new Result { ErrorCode = 0, ErrorMessage = "Create customer successful." };

            CustomerValidator validator = new CustomerValidator();
            ValidationResult results = validator.Validate(customer);

            if (!results.IsValid)
            {
                r.ErrorCode = -1;
                r.ErrorMessage = results.Errors.First().ErrorMessage;

                return JsonConvert.SerializeObject(r, _settings);
            }

            customer.Id = Guid.NewGuid();
            CrudDS<Customer>.Items.Add(customer);
            CrudDS<Customer>.Serialize(DateTime.Now);

            r.Data = customer; // Return current customer

            // Broadcast to all clients
            CustomerHub.Instance.Clients.All.add(JsonConvert.SerializeObject(customer, _settings));

            return JsonConvert.SerializeObject(r, _settings);
        }
    }
}
