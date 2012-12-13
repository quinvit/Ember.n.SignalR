namespace Ember.n.SignalR.DS
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Web;
    using Ember.n.SignalR.DTOs;

    /// <summary>
    /// Automatic synchronization to .em file
    /// </summary>
    public class CustomerDS
    {
        public static List<Customer> Customers
        {
            get
            {
                _Instance.InitOrDoNothing();
                return CustomerDS._customers;
            }
        }

        static class _Instance
        {
            static readonly CustomerDS _ds;
            static _Instance()
            {
                _ds = new CustomerDS();
            }

            public static void InitOrDoNothing()
            {

            }
        }

        private static List<Customer> _customers;
        private static readonly string _fileName = "~/App_Data/Customers.em";
        private static FileStream _stream;
        private static System.Runtime
              .Serialization
              .Formatters
              .Binary
              .BinaryFormatter _binary = new System.Runtime
                                             .Serialization
                                             .Formatters
                                             .Binary.BinaryFormatter();

        private static readonly int _syncPeriod = 100;

        private static readonly object _locker = new object();

        static string PhysicalFilePath
        {
            get
            {
                return HttpContext.Current.Server.MapPath(_fileName);
            }
        }

        static CustomerDS()
        {
            bool existedFile = File.Exists(PhysicalFilePath);
            if (!existedFile)
            {
                _stream = File.Create(PhysicalFilePath, 1024, FileOptions.Encrypted);
                _stream.Close();
            }

            _customers = new List<Customer>();
            _stream = File.Open(PhysicalFilePath, FileMode.Open, FileAccess.ReadWrite, FileShare.Read);

            Deserialize();
        }

        ~CustomerDS()
        {
            if (_stream != null)
            {
                try
                {
                    _stream.Flush();
                    _stream.Close();
                    _stream.Dispose();
                }
                catch { }
            }
        }

        private static void Deserialize()
        {
            if (_stream.Length == 0) return;
            _stream.Seek(0, SeekOrigin.Begin);
            _customers = _binary.Deserialize(_stream) as List<Customer>;
        }

        public static void Serialize(object state)
        {
            DateTime lastModified = File.GetLastWriteTime(PhysicalFilePath);

            if (lastModified.Subtract((DateTime)(state)) < TimeSpan.FromMilliseconds(_syncPeriod))
            {
                lock (_locker)
                {
                    _stream.Seek(0, SeekOrigin.Begin);
                    _binary.Serialize(_stream, _customers);
                }
            }
        }
    }
}