namespace Ember.n.SignalR.Controllers
{
    using System;
    using System.Linq;
    using System.Web.Mvc;
    using Ember.n.SignalR.DS;
    using Ember.n.SignalR.Models;
    using Ember.n.SignalR.Validators;
    using FluentValidation.Results;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Serialization;

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
                r.Data = CustomerDS.Customers.AsEnumerable<Customer>();
            }
            else
            {
                r.Data = CustomerDS.Customers.Find(c => c.Id == id);
            }

            return JsonConvert.SerializeObject(r, _settings);
        }

        [AcceptVerbs(HttpVerbs.Delete)]
        public string Delete(Guid id)
        {
            Result r = new Result { ErrorCode = 0, ErrorMessage = "Delete customer successful." };
            var customer = CustomerDS.Customers.First(c => c.Id == id);
            bool ok = (customer == null) ? false : CustomerDS.Customers.Remove(customer);
            CustomerDS.Serialize(DateTime.Now);
            if (!ok)
            {
                r.ErrorCode = -1;
                r.ErrorMessage = "Could not find customer with id=" + id;
            }

            r.Data = customer;

            return JsonConvert.SerializeObject(r, _settings);
        }

        [AcceptVerbs(HttpVerbs.Put)]
        public string Update(Customer customer)
        {
            Result r = new Result { ErrorCode = 0, ErrorMessage = "Update customer successful." };

            Customer item = CustomerDS.Customers.Find(c => c.Id == customer.Id);
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
                CustomerDS.Serialize(DateTime.Now);
            }

            r.Data = customer;
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
            CustomerDS.Customers.Add(customer);
            CustomerDS.Serialize(DateTime.Now);

            r.Data = customer; // Return current customer

            return JsonConvert.SerializeObject(r, _settings);
        }
    }
}
