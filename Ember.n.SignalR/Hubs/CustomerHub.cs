namespace Ember.n.SignalR.Hubs
{
    using Ember.n.SignalR.Models;
    using Microsoft.AspNet.SignalR.Hubs;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Serialization;
    using Microsoft.AspNet.SignalR;

    public class CustomerHub : Hub
    {
        public static IHubContext Instance
        {
            get{
                return GlobalHost.ConnectionManager.GetHubContext<CustomerHub>();
            }
        }

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