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
    public class CrudDS<T>
    {
        public static List<T> Items
        {
            get
            {
                _Instance.InitOrDoNothing();
                return CrudDS<T>._items;
            }
        }

        static class _Instance
        {
            static readonly CrudDS<T> _ds;
            static _Instance()
            {
                _ds = new CrudDS<T>();
            }

            public static void InitOrDoNothing()
            {

            }
        }

        private static List<T> _items;
        private static readonly string _fileName = "~/App_Data/{0}.em";
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
                string typeName = typeof(T).Name;
                return HttpContext.Current.Server.MapPath(string.Format(_fileName, typeName));
            }
        }

        static CrudDS()
        {
            bool existedFile = File.Exists(PhysicalFilePath);
            if (!existedFile)
            {
                _stream = File.Create(PhysicalFilePath, 1024, FileOptions.Encrypted);
                _stream.Close();
            }

            _items = new List<T>();
            _stream = File.Open(PhysicalFilePath, FileMode.Open, FileAccess.ReadWrite, FileShare.Read);

            Deserialize();
        }

        ~CrudDS()
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
            _items = _binary.Deserialize(_stream) as List<T>;
        }

        public static void Serialize(object state)
        {
            DateTime lastModified = File.GetLastWriteTime(PhysicalFilePath);

            if (lastModified.Subtract((DateTime)(state)) < TimeSpan.FromMilliseconds(_syncPeriod))
            {
                lock (_locker)
                {
                    _stream.Seek(0, SeekOrigin.Begin);
                    _binary.Serialize(_stream, _items);
                }
            }
        }
    }
}