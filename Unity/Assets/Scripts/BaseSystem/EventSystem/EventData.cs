using System;
using UnityEngine;
using System.Collections.Generic;

namespace VTNConnect
{
    /// <summary>
    /// データクラス
    /// </summary>
    [Serializable]
    public abstract class EventData
    {
        [Serializable]
        public class ParamData
        {
            public string Key;
            public string TypeName;
            public string Data;
        }

        public int EventId = -1;
        public int FromId = -1;
        [SerializeField] protected List<ParamData> Payload = new List<ParamData>();

        public abstract void Marshal();

        public void DataPack<T>(string Key, T data)
        {
            Payload.Add(new ParamData()
            {
                Key = Key,
                TypeName = typeof(T).Name,
                Data = data.ToString()
            });
        }

        public void Send()
        {
            //TBD
        }
    }
}