using System;
using UnityEngine;
using System.Collections.Generic;
using System.Linq;

namespace VTNConnect
{
    /// <summary>
    /// データクラス
    /// </summary>
    [Serializable]
    public class EventData
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

        public void DataPack<T>(string Key, T data)
        {
            Payload.Add(new ParamData()
            {
                Key = Key,
                TypeName = typeof(T).Name,
                Data = data.ToString()
            });
        }

        public ParamData GetData(string Key)
        {
            var target = Payload.Where(p => p.Key == Key);
            if (target.Count() == 0) return null;
            return target.First();
        }

        public int GetIntData(string Key)
        {
            var target = Payload.Where(p => p.Key == Key);
            if (target.Count() == 0) return 0;
            var data = target.First();
            if(data.TypeName != "Integer")
            {
                Debug.LogWarning($"Intじゃない値かもしれません:{data.Data}({data.TypeName })");
            }
            return int.Parse(data.Data);
        }
    }
}