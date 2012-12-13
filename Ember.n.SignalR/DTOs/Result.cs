using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Ember.n.SignalR.DTOs
{
    public class Result
    {
        public int ErrorCode { get; set; }
        public object ErrorMessage { get; set; }
        public object Data { get; set; }
    }
}