using System;

namespace VTNConnect
{
    /// <summary>
    /// 応援クラス
    /// </summary>
    [Serializable]
    public class CheerEvent : EventData
    {
        public CheerEvent() : base(EventDefine.Cheer){ }
    }
}