using UnityEngine;

namespace VTNConnect
{
    /// <summary>
    /// イベントレシーバーインタフェース
    /// </summary>
    public interface IVantanConnectEventReceiver
    {
        public bool IsActive { get; }
        void OnEventCall(EventData data);
    }
}