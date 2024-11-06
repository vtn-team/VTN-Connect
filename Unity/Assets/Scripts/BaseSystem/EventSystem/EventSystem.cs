using System.Collections.Generic;

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
        List<EventDataCallback> _eventListener = new List<EventDataCallback>();


        //TBD
        //public async UniTask<int> Setup()
        //{
        //}

        static public void AddListener(EventDataCallback callback)
        {
            _instance._eventListener.Add(callback);
        }

#if UNITY_EDITOR
        static public void RunEvent(EventData data)
        {
            foreach(var ev in _instance._eventListener)
            {
                ev.Invoke(data);
            }
        }
#endif
    }
}