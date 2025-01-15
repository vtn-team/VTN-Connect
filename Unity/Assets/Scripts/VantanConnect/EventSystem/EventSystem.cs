using System.Collections.Generic;
using UnityEngine;

namespace VTNConnect
{
    /// <summary>
    /// イベントリレー管理クラス
    /// </summary>
    public class EventSystem
    {
        public delegate void EventDataSender(EventData data);
        public delegate void EventDataCallback(EventData data);
        EventDataSender _sender = null;
        List<IVantanConnectEventReceiver> _eventListener = new List<IVantanConnectEventReceiver>();
        List<IVantanConnectEventReceiver> _reNewListener = new List<IVantanConnectEventReceiver>();

        private void DataReceive(EventData data)
        {
            //nullが無いように調整する
            bool isRenew = false;
            foreach (var ev in _eventListener)
            {
                if (ev == null)
                {
                    isRenew = true;
                    _reNewListener.Clear();
                }
            }

            foreach (var ev in _eventListener)
            {
                if (ev == null)
                {
                    continue;
                }

                if (isRenew)
                {
                    _reNewListener.Add(ev);
                }

                if (ev.IsActive == false)
                {
                    continue;
                }

                ev.OnEventCall(data);
            }

            if(isRenew)
            {
                _eventListener = _reNewListener;
            }
        }

        public void Setup(EventDataSender send, out EventDataCallback recv)
        {
            _sender = send;
            recv = DataReceive;
        }

        public void RegisterReceiver(IVantanConnectEventReceiver receiver)
        {
            _eventListener.Add(receiver);
        }

        public void SendEvent(EventData data)
        {
            _sender?.Invoke(data);
        }


#if UNITY_EDITOR
        public void RunEvent(EventData data)
        {
            DataReceive(data);
        }
#endif
    }
}