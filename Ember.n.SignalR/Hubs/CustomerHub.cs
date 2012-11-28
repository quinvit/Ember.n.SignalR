namespace Ember.n.SignalR.Hubs
{
    using Ember.n.SignalR.Models;
    using Microsoft.AspNet.SignalR.Hubs;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Serialization;

    public class CustomerHub : Hub
    {
        JsonSerializerSettings _settings = new JsonSerializerSettings
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver(),
            NullValueHandling = NullValueHandling.Ignore
        };

        public void Add(Customer customer)
        {
            Clients.All.add(JsonConvert.SerializeObject(customer, _settings));
        }

        public void Update(Customer customer)
        {
            Clients.All.update(JsonConvert.SerializeObject(customer, _settings));
        }

        public void Remove(Customer customer)
        {
            Clients.All.remove(JsonConvert.SerializeObject(customer, _settings));
        }
    }
}