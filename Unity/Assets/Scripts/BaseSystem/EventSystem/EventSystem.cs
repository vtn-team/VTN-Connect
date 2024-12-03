using System.Collections.Generic;
using UnityEngine;

namespace VTNConnect
{
    /// <summary>
    /// イベント管理クラス
    /// </summary>
    public class EventSystem
    {
        //シングルトン運用
        static EventSystem _instance = new EventSystem();
        static public EventSystem Instance => _instance;
        private EventSystem() { }

        //
        public delegate void EventDataCallback(EventData data);
        List<EventDataCallback> _sender = new List<EventDataCallback>();
        List<EventDataCallback> _eventListener = new List<EventDataCallback>();

        static private void DataReceive(EventData data)
        {
            foreach (var ev in _instance._eventListener)
            {
                ev.Invoke(data);
            }
        }

        static public void Setup(EventDataCallback send, out EventDataCallback recv)
        {
            _instance._sender.Add(send);
            recv = DataReceive;
        }

        static public void AddListener(EventDataCallback callback)
        {
            _instance._eventListener.Add(callback);
        }

#if UNITY_EDITOR
        static public void RunEvent(EventData data)
        {
            DataReceive(data);
        }
#endif
    }
}