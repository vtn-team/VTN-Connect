using UnityEngine;
using System.Collections.Generic;
using VTNConnect;


/// <summary>
/// イベント管理クラス
/// </summary>
public class EventSystemViewer : MonoBehaviour
{
    [SerializeField] int _eventId;
    [SerializeField] EventData _testData;

    //test
    void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            EventData n = new EventData();
            n.DataPack<float>("X", this.transform.position.x);
            n.DataPack("Pos", this.transform.position);
            n.DataPack("Rot", this.transform.rotation);
            EventSystem.SendEvent(_eventId, n);
        }
    }

#if UNITY_EDITOR
    public EventData TestData => _testData;
#endif
}
