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
        public delegate void EventDataSender(int eventId, EventData data);
        public delegate void EventDataCallback(EventData data);
        EventDataSender _sender = null;
        List<EventDataCallback> _eventListener = new List<EventDataCallback>();

        static private void DataReceive(EventData data)
        {
            foreach (var ev in _instance._eventListener)
            {
                ev.Invoke(data);
            }
        }

        static public void Setup(EventDataSender send, out EventDataCallback recv)
        {
            _instance._sender = send;
            recv = DataReceive;
        }

        static public void AddListener(EventDataCallback callback)
        {
            _instance._eventListener.Add(callback);
        }

        static public void SendEvent(int eventId, EventData data)
        {
            _instance._sender?.Invoke(eventId, data);
        }


#if UNITY_EDITOR
        static public void RunEvent(EventData data)
        {
            DataReceive(data);
        }
#endif
    }
}