using System;
using System.Runtime.Serialization;
using UnityEngine;
using VTNConnect;


/// <summary>
/// データクラス
/// </summary>
[Serializable]
public class NecoEvent : EventData
{
    //実装
    public class Neco
    {
        public int CatType = 0;
        public int Color = 0;
        public int Move = 0;
    }

    public Neco NecoData = default;

    public NecoEvent()
    {
        base.EventId = 1;
    }
}